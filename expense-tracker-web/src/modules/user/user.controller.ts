import { Controller, Get, Query, Request, Body, Post, UseInterceptors, ClassSerializerInterceptor, UseGuards, Req } from '@nestjs/common';


import { IRegistrationParams, ILoginParams } from './user.model';
import { UserService } from './user.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userSvc: UserService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll(@Req() req: Request,
   @Query() filters?: { name?: string, email?: string }) {
    return this.userSvc.findAll({
      ...filters
    });
  }
  
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getByEmail')
  getByEmail(@Query() email: string) {
    return this.userSvc.getUserByEmail(email);
  }
}
