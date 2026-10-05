import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { User } from '@nfw/db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { isProd } from '../config';
import { SESSION_HOURS, STAFF_COOKIE, StaffAuthService } from './staff-auth.service';
import { Staff, StaffGuard } from './staff.guard';

const loginSchema = z.object({ email: z.string().trim().min(3).max(200), password: z.string().min(1).max(200) });

@Controller('staff')
export class StaffAuthController {
  constructor(private readonly auth: StaffAuthService) {}

  @Post('auth/login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // slows password guessing
  async login(@Body(new ZodPipe(loginSchema)) body: z.infer<typeof loginSchema>, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { token, user } = await this.auth.login(body.email, body.password, { ip: req.ip, userAgent: req.headers['user-agent'] ?? '' });
    res.setCookie(STAFF_COOKIE, token, { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/', maxAge: SESSION_HOURS * 3600 });
    return user;
  }

  @Post('auth/logout')
  @HttpCode(204)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    await this.auth.logout(req.cookies[STAFF_COOKIE]);
    res.clearCookie(STAFF_COOKIE, { path: '/' });
  }

  @Get('me')
  @UseGuards(StaffGuard)
  me(@Staff() staff: User) {
    return this.auth.publicUser(staff);
  }
}
