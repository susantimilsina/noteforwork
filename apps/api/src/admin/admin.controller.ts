import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { User } from '@nfw/db';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { isProd } from '../config';
import { AdminService } from './admin.service';
import { SESSION_HOURS, STAFF_COOKIE, StaffAuthService } from './staff-auth.service';
import { Staff, StaffGuard } from './staff.guard';

const loginSchema = z.object({ email: z.string().trim().min(3).max(200), password: z.string().min(1).max(200) });
const STATUSES = ['DRAFT', 'SCREEN_BLOCKED', 'SCREEN_PASSED', 'DETAILS_COMPLETE', 'PAYMENT_AUTHORIZED', 'IN_QUEUE', 'IN_REVIEW', 'APPROVED', 'NOTE_ISSUED', 'DECLINED', 'CANCELLED', 'EXPIRED'] as const;
const listSchema = z.object({
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

const ctxOf = (req: FastifyRequest) => ({ ip: req.ip, userAgent: req.headers['user-agent'] ?? '' });

@Controller('admin')
export class AdminController {
  constructor(
    private readonly auth: StaffAuthService,
    private readonly admin: AdminService,
  ) {}

  @Post('auth/login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // slows password guessing
  async login(@Body(new ZodPipe(loginSchema)) body: z.infer<typeof loginSchema>, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const { token, user } = await this.auth.login(body.email, body.password, ctxOf(req));
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

  @Get('stats')
  @UseGuards(StaffGuard)
  stats() {
    return this.admin.stats();
  }

  @Get('intakes')
  @UseGuards(StaffGuard)
  intakes(@Query(new ZodPipe(listSchema)) q: z.infer<typeof listSchema>) {
    return this.admin.listIntakes(q);
  }

  @Get('intakes/:id')
  @UseGuards(StaffGuard)
  intake(@Param('id', ParseUUIDPipe) id: string, @Staff() staff: User) {
    return this.admin.intakeDetail(id, staff);
  }

  @Get('notes')
  @UseGuards(StaffGuard)
  notes(@Query(new ZodPipe(listSchema.omit({ status: true }))) q: Omit<z.infer<typeof listSchema>, 'status'>) {
    return this.admin.listNotes(q);
  }
}
