import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Controller('states')
export class StatesController {
  constructor(private readonly prisma: PrismaService) {}

  /** Public: all states with their availability, for the location picker. */
  @Get()
  list() {
    return this.prisma.client.state.findMany({
      select: { code: true, name: true, enabled: true },
      orderBy: { name: 'asc' },
    });
  }
}
