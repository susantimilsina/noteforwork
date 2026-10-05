import { CanActivate, createParamDecorator, ExecutionContext, Injectable } from '@nestjs/common';
import type { User } from '@nfw/db';
import type { FastifyRequest } from 'fastify';
import { STAFF_COOKIE, StaffAuthService } from './staff-auth.service';

type StaffRequest = FastifyRequest & { staff?: User };

/** Allows the request only with a valid staff session cookie (ADMIN / SUPPORT). */
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(private readonly auth: StaffAuthService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<StaffRequest>();
    req.staff = await this.auth.authenticate(req.cookies[STAFF_COOKIE]);
    return true;
  }
}

export const Staff = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<StaffRequest>().staff!);
