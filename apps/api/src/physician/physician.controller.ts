import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import type { User } from '@nfw/db';
import { z } from 'zod';
import { ZodPipe } from '../common/zod.pipe';
import { RequireRoles, Staff, StaffGuard } from '../staff/staff.guard';
import { DECLINE_REASONS, PhysicianService } from './physician.service';

const approveSchema = z.object({ attestation: z.literal(true, { error: 'You must sign the attestation to approve.' }) });
const declineSchema = z.object({ reason: z.enum(DECLINE_REASONS), message: z.string().trim().max(500).optional() });

/** Physician-only: review queue, claim/release, approve & sign, decline. */
@Controller('physician')
@UseGuards(StaffGuard)
@RequireRoles('PHYSICIAN')
export class PhysicianController {
  constructor(private readonly physicians: PhysicianService) {}

  @Get('queue')
  queue(@Staff() me: User) {
    return this.physicians.queue(me);
  }

  @Post('cases/:id/claim')
  @HttpCode(200)
  claim(@Param('id', ParseUUIDPipe) id: string, @Staff() me: User) {
    return this.physicians.claim(me, id);
  }

  @Post('cases/:id/release')
  @HttpCode(204)
  release(@Param('id', ParseUUIDPipe) id: string, @Staff() me: User) {
    return this.physicians.release(me, id);
  }

  @Get('cases/:id')
  detail(@Param('id', ParseUUIDPipe) id: string, @Staff() me: User) {
    return this.physicians.detail(me, id);
  }

  @Post('cases/:id/approve')
  @HttpCode(200)
  approve(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(approveSchema)) _body: z.infer<typeof approveSchema>, @Staff() me: User) {
    return this.physicians.approve(me, id);
  }

  @Post('cases/:id/decline')
  @HttpCode(204)
  decline(@Param('id', ParseUUIDPipe) id: string, @Body(new ZodPipe(declineSchema)) body: z.infer<typeof declineSchema>, @Staff() me: User) {
    return this.physicians.decline(me, id, body.reason, body.message);
  }
}
