import { Global, Module } from '@nestjs/common';
import { StaffAuthController } from './staff-auth.controller';
import { StaffAuthService } from './staff-auth.service';
import { StaffGuard } from './staff.guard';

@Global()
@Module({ controllers: [StaffAuthController], providers: [StaffAuthService, StaffGuard], exports: [StaffAuthService, StaffGuard] })
export class StaffModule {}
