import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { env } from './config';

/** Shared by main.ts and the e2e tests so both run the exact same app setup. */
export async function createApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    // trustProxy: behind CloudFront/ALB in production so req.ip is the client, not the LB.
    new FastifyAdapter({ trustProxy: true, bodyLimit: 64 * 1024 }),
    { logger: env.NODE_ENV === 'test' ? false : ['log', 'warn', 'error'] },
  );
  await app.register(helmet);
  await app.register(cookie);
  app.enableCors({ origin: env.API_CORS_ORIGINS.split(','), credentials: true });
  app.setGlobalPrefix('v1');
  app.enableShutdownHooks();
  return app;
}
