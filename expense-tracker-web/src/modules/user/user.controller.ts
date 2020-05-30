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
  @Get('getUserByEmailWithExternalAuth')
  async getUserByEmailWithExternalAuth(@Req() req: Request, @Query() args: { email: string }) {
    if(!args.email) {
      return null;
    }

    const user = <ICurrentUser>req.user;
    if(!user) {
      return null;
    }
    
    //only admin can change
    const toFind = await this.userSvc.getUserByEmail(user.username);
    if(!toFind || (toFind && toFind.role != UserRole.Admin)) {
      return null;
    }

    args.email = args.email.toLowerCase();
    return this.userSvc.getUserByEmailWithExternalAuth(args.email);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Post('update')
  async update(@Req() req: Request, @Body() args: { name, email, mobile, status }) {
    if(!args.email) {
      return null;
    }

    const currentUser = <ICurrentUser>req.user;
    if(!currentUser) {
      return null;
    }
    
    //only admin can update
    const toFind = await this.userSvc.getUserByEmail(currentUser.username);
    if(!toFind || (toFind && toFind.role != UserRole.Admin)) {
      return null;
    }

    return this.userSvc.update(args);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(JwtAuthGuard)
  @Post('changePassword')
  async changePassword(@Req() req: Request, @Body() args: { email: string, newPassword: string }) {
    if(!args.email) {
      return null;
    }

    const user = <ICurrentUser>req.user;
    if(!user) {
      return null;
    }
    
    //only admin can change
    const toFind = await this.userSvc.getUserByEmail(user.username);
    if(!toFind || (toFind && toFind.role != UserRole.Admin)) {
      return null;
    }

    args.email = args.email.toLowerCase();
    return this.userSvc.changePassword(args.email, args.newPassword);
  }
}
