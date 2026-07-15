import { Controller, Get, Post, Body, UseGuards, Patch, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    const dbUser = await this.usersService.findById(user.userId);
    if (dbUser) {
      delete (dbUser as any).passwordHash;
    }
    return dbUser;
  }

  @Post('wallet/deposit')
  async deposit(@CurrentUser() user: any, @Body('amount') amount: number) {
    const updatedUser = await this.usersService.deposit(user.userId, amount);
    delete (updatedUser as any).passwordHash;
    return updatedUser;
  }

  @Post('wallet/withdraw')
  async withdraw(@CurrentUser() user: any, @Body('amount') amount: number) {
    const updatedUser = await this.usersService.withdraw(user.userId, amount);
    delete (updatedUser as any).passwordHash;
    return updatedUser;
  }

  // --- Admin Endpoints ---

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateRole(
    @CurrentUser() admin: any,
    @Param('id') targetId: string,
    @Body('role') role: string
  ) {
    return this.usersService.updateRole(admin.userId, targetId, role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @CurrentUser() admin: any,
    @Param('id') targetId: string,
    @Body('isActive') isActive: boolean
  ) {
    return this.usersService.updateStatus(admin.userId, targetId, isActive);
  }
}
