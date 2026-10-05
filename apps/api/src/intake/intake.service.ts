import {
  ConflictException,
  GoneException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Intake } from '@nfw/db';
import type { ConsentInput, CreateIntakeInput } from '@nfw/schemas';
import { evaluate, type Answers } from '@nfw/screening';
import { AuditService } from '../common/audit.service';
import { newRequestRef, newSecretToken, sha256 } from '../common/crypto';
import { PrismaService } from '../common/prisma.service';
import { CONSENT_DOCUMENT, DRAFT_TTL_HOURS } from '../config';

export interface ClientContext {
  ip: string;
  userAgent: string;
}

@Injectable()
export class IntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Start an intake. The returned token is the only credential for this draft (sent as an httpOnly cookie). */
  async create(input: CreateIntakeInput, ctx: ClientContext) {
    const state = await this.prisma.client.state.findUnique({ where: { code: input.stateCode } });
    if (!state?.enabled) {
      throw new UnprocessableEntityException({ code: 'STATE_UNAVAILABLE', message: `We are not yet available in ${state?.name ?? input.stateCode}.` });
    }

    const token = newSecretToken();
    const now = new Date();
    const intake = await this.withUniqueRef((publicRef) =>
      this.prisma.client.intake.create({
        data: {
          publicRef,
          accessTokenHash: sha256(token),
          stateCode: state.code,
          locationAttestedAt: now,
          expiresAt: new Date(now.getTime() + DRAFT_TTL_HOURS * 3_600_000),
        },
      }),
    );

    await this.audit.record({
      actorType: 'PATIENT',
      action: 'intake.created',
      entity: 'Intake',
      entityId: intake.id,
      meta: { stateCode: state.code, locationAttested: true },
    });
    return { token, intake };
  }

  async findByToken(token: string | undefined): Promise<Intake> {
    if (!token) throw new UnauthorizedException({ code: 'NO_INTAKE', message: 'No intake in progress.' });
    const intake = await this.prisma.client.intake.findUnique({ where: { accessTokenHash: sha256(token) } });
    if (!intake) throw new UnauthorizedException({ code: 'NO_INTAKE', message: 'No intake in progress.' });
    if (intake.status === 'EXPIRED' || (intake.expiresAt && intake.expiresAt < new Date() && !intake.submittedAt)) {
      throw new GoneException({ code: 'INTAKE_EXPIRED', message: 'This request expired. Please start again.' });
    }
    return intake;
  }

  async summary(intake: Intake) {
    const [consent, screening] = await Promise.all([
      this.prisma.client.consentRecord.findUnique({ where: { intakeId: intake.id } }),
      this.prisma.client.screeningResult.findUnique({ where: { intakeId: intake.id } }),
    ]);
    return {
      publicRef: intake.publicRef,
      status: intake.status,
      stateCode: intake.stateCode,
      expiresAt: intake.expiresAt,
      consent: { required: CONSENT_DOCUMENT, accepted: !!consent },
      screening: screening && { outcome: screening.outcome, blockReason: screening.blockReason },
    };
  }

  async recordConsent(intake: Intake, input: ConsentInput, ctx: ClientContext) {
    if (input.documentVersion !== CONSENT_DOCUMENT.version) {
      throw new ConflictException({ code: 'CONSENT_VERSION_MISMATCH', message: 'The consent document was updated. Please review it again.' });
    }
    const existing = await this.prisma.client.consentRecord.findUnique({ where: { intakeId: intake.id } });
    if (existing) return existing;

    const record = await this.prisma.client.consentRecord.create({
      data: {
        intakeId: intake.id,
        documentKey: CONSENT_DOCUMENT.key,
        documentVersion: CONSENT_DOCUMENT.version,
        language: input.language,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent.slice(0, 512),
      },
    });
    await this.audit.record({
      actorType: 'PATIENT',
      action: 'intake.consent.accepted',
      entity: 'Intake',
      entityId: intake.id,
      meta: { documentKey: CONSENT_DOCUMENT.key, documentVersion: CONSENT_DOCUMENT.version, language: input.language },
    });
    return record;
  }

  /**
   * Evaluate the complete questionnaire server-side. The client's own preview is ignored —
   * this result is the only one that gates payment.
   */
  async submitScreening(intake: Intake, answers: Answers) {
    const consent = await this.prisma.client.consentRecord.findUnique({ where: { intakeId: intake.id } });
    if (!consent) throw new ConflictException({ code: 'CONSENT_REQUIRED', message: 'Please accept the telehealth consent first.' });
    if (intake.status !== 'DRAFT') {
      throw new ConflictException({ code: 'SCREENING_ALREADY_SUBMITTED', message: 'Screening was already submitted for this request.' });
    }

    const result = evaluate(answers);
    if (result.status === 'incomplete') {
      throw new UnprocessableEntityException({ code: 'SCREENING_INCOMPLETE', nextQuestion: result.nextQuestion });
    }

    const blocked = result.status === 'blocked';
    await this.prisma.client.$transaction([
      this.prisma.client.screeningResult.create({
        data: {
          intakeId: intake.id,
          rulesetVersion: result.rulesetVersion,
          answers: answers as object,
          outcome: blocked ? 'BLOCKED' : 'ELIGIBLE',
          riskLevel: result.risk.level,
          riskScore: result.risk.score,
          blockReason: blocked ? result.blockReason : null,
        },
      }),
      this.prisma.client.intake.update({
        where: { id: intake.id },
        data: { status: blocked ? 'SCREEN_BLOCKED' : 'SCREEN_PASSED' },
      }),
    ]);
    await this.audit.record({
      actorType: 'PATIENT',
      action: blocked ? 'intake.screening.blocked' : 'intake.screening.passed',
      entity: 'Intake',
      entityId: intake.id,
      meta: { rulesetVersion: result.rulesetVersion, ...(blocked && { blockReason: result.blockReason }) },
    });

    return blocked
      ? { outcome: 'BLOCKED' as const, blockReason: result.blockReason }
      : { outcome: 'ELIGIBLE' as const };
  }

  /** Retry on the (astronomically unlikely) public-ref collision. */
  private async withUniqueRef<T>(create: (ref: string) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await create(newRequestRef());
      } catch (e) {
        const isUniqueViolation = (e as { code?: string }).code === 'P2002';
        if (!isUniqueViolation || attempt >= 3) throw e;
      }
    }
  }
}
