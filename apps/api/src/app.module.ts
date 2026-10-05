import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { HealthController } from './health/health.controller';
import { IntakeModule } from './intake/intake.module';
import { PhysicianModule } from './physician/physician.module';
import { StaffModule } from './staff/staff.module';
import { StatesController } from './states/states.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    CommonModule,
    StaffModule,
    IntakeModule,
    AdminModule,
    PhysicianModule,
  ],
  controllers: [HealthController, StatesController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
