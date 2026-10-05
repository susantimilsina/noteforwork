import { CanActivate, createParamDecorator, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role, User } from '@nfw/db';
import type { FastifyRequest } from 'fastify';
import { STAFF_COOKIE, StaffAuthService } from './staff-auth.service';

type StaffRequest = FastifyRequest & { staff?: User };

const ROLES_KEY = 'nfw:roles';
/** Restrict a controller/route to staff holding at least one of these roles. */
export const RequireRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Requires a valid staff session cookie, then (if declared) one of the required roles. */
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(
    private readonly auth: StaffAuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<StaffRequest>();
    const user = await this.auth.authenticate(req.cookies[STAFF_COOKIE]);
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (required?.length && !user.roles.some((r) => required.includes(r))) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Your account does not have access to this.' });
    }
    req.staff = user;
    return true;
  }
}

export const Staff = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<StaffRequest>().staff!);
