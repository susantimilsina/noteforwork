import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hashPassword, verifyPassword, type Role, type User } from '@nfw/db';
import { AuditService } from '../common/audit.service';
import { newSecretToken, sha256 } from '../common/crypto';
import { PrismaService } from '../common/prisma.service';
import type { ClientContext } from '../intake/intake.service';

export const STAFF_COOKIE = 'nfw_staff';
export const SESSION_HOURS = 8; // absolute lifetime
export const IDLE_MINUTES = 30; // sign out after inactivity
const STAFF_ROLES: ReadonlySet<Role> = new Set(['ADMIN', 'SUPPORT', 'PHYSICIAN']);
export const isStaff = (u: Pick<User, 'roles'>) => u.roles.some((r) => STAFF_ROLES.has(r));

// Verified against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = hashPassword('not-a-real-password-' + Math.random());

/** Shared sign-in for all staff: admins, support and physicians. */
@Injectable()
export class StaffAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async login(email: string, password: string, ctx: ClientContext) {
    const user = await this.prisma.client.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    const ok = user?.passwordHash ? await verifyPassword(password, user.passwordHash) : (await verifyPassword(password, await DUMMY_HASH), false);
    const allowed = !!user && ok && !user.disabled && isStaff(user);

    await this.audit.record({
      actorType: allowed ? (user.roles.includes('PHYSICIAN') && !user.roles.includes('ADMIN') ? 'PHYSICIAN' : 'ADMIN') : 'PUBLIC',
      actorId: allowed ? user.id : undefined,
      action: allowed ? 'staff.login.succeeded' : 'staff.login.failed',
      entity: 'User',
      entityId: user?.id ?? 'unknown',
      meta: { ipHash: sha256(ctx.ip).slice(0, 16) },
    });
    if (!allowed) throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' });

    const token = newSecretToken();
    const now = new Date();
    await this.prisma.client.$transaction([
      this.prisma.client.staffSession.create({
        data: {
          tokenHash: sha256(token),
          userId: user.id,
          expiresAt: new Date(now.getTime() + SESSION_HOURS * 3_600_000),
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent.slice(0, 512),
        },
      }),
      this.prisma.client.user.update({ where: { id: user.id }, data: { lastLoginAt: now } }),
    ]);
    return { token, user: this.publicUser(user) };
  }

  /** Resolve a session cookie to a staff user; enforces absolute + idle timeouts. */
  async authenticate(token: string | undefined): Promise<User> {
    if (!token) throw new UnauthorizedException({ code: 'NOT_SIGNED_IN' });
    const session = await this.prisma.client.staffSession.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
    const now = Date.now();
    const idle = session && now - session.lastSeenAt.getTime() > IDLE_MINUTES * 60_000;
    if (!session || session.expiresAt.getTime() < now || idle || session.user.disabled || !isStaff(session.user)) {
      if (session) await this.prisma.client.staffSession.delete({ where: { id: session.id } }).catch(() => {});
      throw new UnauthorizedException({ code: 'SESSION_EXPIRED' });
    }
    // Touch at most once a minute to keep writes low.
    if (now - session.lastSeenAt.getTime() > 60_000) {
      await this.prisma.client.staffSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date(now) } });
    }
    return session.user;
  }

  async logout(token: string | undefined) {
    if (token) await this.prisma.client.staffSession.deleteMany({ where: { tokenHash: sha256(token) } });
  }

  publicUser(u: User) {
    return { id: u.id, email: u.email, roles: u.roles, displayName: u.displayName };
  }
}
