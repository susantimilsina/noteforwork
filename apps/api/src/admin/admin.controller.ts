import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import type { User } from '@nfw/db';
import { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { RequireRoles, Staff, StaffGuard } from '../staff/staff.guard';
import { AdminService } from './admin.service';

const STATUSES = ['DRAFT', 'SCREEN_BLOCKED', 'SCREEN_PASSED', 'DETAILS_COMPLETE', 'PAYMENT_AUTHORIZED', 'IN_QUEUE', 'IN_REVIEW', 'APPROVED', 'NOTE_ISSUED', 'DECLINED', 'CANCELLED', 'EXPIRED'] as const;
const listSchema = z.object({
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
const revokeSchema = z.object({ reason: z.string().trim().min(10, 'Give a reason of at least 10 characters.').max(500) });

/** Oversight for admin & support staff. Read-mostly; admins can also revoke notes. Never approves notes. */
@Controller('admin')
@UseGuards(StaffGuard)
@RequireRoles('ADMIN', 'SUPPORT')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('queue')
  queue() {
    return this.admin.queue();
  }

  @Get('physicians')
  physicians() {
    return this.admin.physicians();
  }

  @Get('intakes')
  intakes(@Query(new ZodPipe(listSchema)) q: z.infer<typeof listSchema>) {
    return this.admin.listIntakes(q);
  }

  @Get('intakes/:id')
  intake(@Param('id', ParseUUIDPipe) id: string, @Staff() staff: User) {
    return this.admin.intakeDetail(id, staff);
  }

  @Get('notes')
  notes(@Query(new ZodPipe(listSchema.omit({ status: true }))) q: Omit<z.infer<typeof listSchema>, 'status'>) {
    return this.admin.listNotes(q);
  }

  @Post('notes/:id/revoke')
  @HttpCode(204)
  @RequireRoles('ADMIN')
  revoke(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(revokeSchema)) body: z.infer<typeof revokeSchema>, @Staff() staff: User) {
    return this.admin.revokeNote(id, body.reason, staff);
  }
}
