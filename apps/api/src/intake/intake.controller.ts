import { Body, Controller, Get, HttpCode, Post, Put, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply, FastifyRequest } from 'fastify';
import {
  consentSchema,
  createIntakeSchema,
  screeningSchema,
  type ConsentInput,
  type CreateIntakeInput,
  type ScreeningInput,
} from '@nfw/schemas';
import { ZodPipe } from '../common/zod.pipe';
import { DRAFT_TTL_HOURS, isProd } from '../config';
import { IntakeService, type ClientContext } from './intake.service';

export const INTAKE_COOKIE = 'nfw_intake';

const ctxOf = (req: FastifyRequest): ClientContext => ({
  ip: req.ip,
  userAgent: req.headers['user-agent'] ?? '',
});

@Controller('intakes')
export class IntakeController {
  constructor(private readonly intakes: IntakeService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(
    @Body(new ZodPipe(createIntakeSchema)) body: CreateIntakeInput,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { token, intake } = await this.intakes.create(body, ctxOf(req));
    res.setCookie(INTAKE_COOKIE, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: DRAFT_TTL_HOURS * 3600,
    });
    return this.intakes.summary(intake);
  }

  @Get('current')
  async current(@Req() req: FastifyRequest) {
    const intake = await this.intakes.findByToken(req.cookies[INTAKE_COOKIE]);
    return this.intakes.summary(intake);
  }

  @Post('current/consent')
  @HttpCode(204)
  async consent(@Body(new ZodPipe(consentSchema)) body: ConsentInput, @Req() req: FastifyRequest) {
    const intake = await this.intakes.findByToken(req.cookies[INTAKE_COOKIE]);
    await this.intakes.recordConsent(intake, body, ctxOf(req));
  }

  @Put('current/screening')
  async screening(@Body(new ZodPipe(screeningSchema)) body: ScreeningInput, @Req() req: FastifyRequest) {
    const intake = await this.intakes.findByToken(req.cookies[INTAKE_COOKIE]);
    return this.intakes.submitScreening(intake, body.answers);
  }
}
