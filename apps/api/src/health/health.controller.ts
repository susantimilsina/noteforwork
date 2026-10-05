import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { RULESET_VERSION } from '@nfw/screening';
import { PrismaService } from '../common/prisma.service';

@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    await this.prisma.client.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'ok', screeningRuleset: RULESET_VERSION };
  }
}
