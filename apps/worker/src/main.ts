import path from 'node:path';
import { config } from 'dotenv';
import { Queue, Worker } from 'bullmq';
import { createPrismaClient } from '@nfw/db';
import { purgeExpiredDrafts } from './jobs/purge-expired-drafts';

config({ path: path.resolve(__dirname, '../../../.env'), quiet: true });

const redisUrl = new URL(process.env.REDIS_URL ?? 'redis://localhost:6379');
const connection = { host: redisUrl.hostname, port: Number(redisUrl.port || 6379) };
const prisma = createPrismaClient();

const QUEUE = 'maintenance';

async function main() {
  const queue = new Queue(QUEUE, { connection });
  // Idempotent: re-registering the scheduler on every boot just updates it.
  await queue.upsertJobScheduler('purge-expired-drafts', { every: 15 * 60_000 }, { name: 'purge-expired-drafts' });

  const worker = new Worker(
    QUEUE,
    async (job) => {
      if (job.name === 'purge-expired-drafts') {
        const n = await purgeExpiredDrafts(prisma);
        return { purged: n };
      }
      throw new Error(`Unknown job ${job.name}`);
    },
    { connection, concurrency: 1 },
  );
  worker.on('completed', (job, result) => console.log(`[worker] ${job.name} done`, result));
  worker.on('failed', (job, err) => console.error(`[worker] ${job?.name} failed:`, err.message));

  const shutdown = async () => {
    await worker.close();
    await queue.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  console.log('[worker] started; queues:', QUEUE);
}

void main();
