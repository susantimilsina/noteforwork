import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { StaffAuthService } from './staff-auth.service';
import { StaffGuard } from './staff.guard';

@Module({ controllers: [AdminController], providers: [StaffAuthService, AdminService, StaffGuard] })
export class AdminModule {}
