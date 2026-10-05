import { Module } from '@nestjs/common';
import { PhysicianController } from './physician.controller';
import { PhysicianService } from './physician.service';

@Module({ controllers: [PhysicianController], providers: [PhysicianService] })
export class PhysicianModule {}
