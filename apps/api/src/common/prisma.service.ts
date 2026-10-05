import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createPrismaClient, type PrismaClient } from '@nfw/db';
import { env } from '../config';

/** Thin Nest wrapper so the Prisma client is injectable and closed on shutdown. */
@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient = createPrismaClient(env.DATABASE_URL);

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
