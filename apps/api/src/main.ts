import 'reflect-metadata';
import { createApp } from './bootstrap';
import { env } from './config';

async function main() {
  const app = await createApp();
  await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  console.log(`API listening on http://localhost:${env.API_PORT}/v1`);
}

void main();
