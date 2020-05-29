import { Controller, Get, Query, Body, Post, UseInterceptors, ClassSerializerInterceptor, UseGuards, Req } from '@nestjs/common';

import { Request } from "express";

import { IRegistrationParams, ILoginParams, UserRole } from './user.model';
import { UserService } from './user.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ICurrentUser } from '../shared/shared.model';

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
  @UseGuards(JwtAuthGuard)
  @Get('getByEmail')
  async getByEmail(@Req() req: Request, @Query() args: { email: string }) {
    if(!args.email) {
      return null;
    }

    const user = <ICurrentUser>req.user;
    if(!user) {
      return null;
    }
    
    const toFind = await this.userSvc.getUserByEmail(user.username);
    if(!toFind || (toFind && toFind.role != UserRole.Admin)) {
      return null;
    }

    args.email = args.email.toLowerCase();
    return this.userSvc.getUserByEmail(args.email);
  }
}
