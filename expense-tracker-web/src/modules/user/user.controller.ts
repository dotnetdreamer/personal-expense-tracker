import { Controller, Get, Query, Request, Body, Post, UseInterceptors, ClassSerializerInterceptor, UseGuards, Req } from '@nestjs/common';


import { IRegistrationParams, ILoginParams } from './user.model';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userSvc: UserService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getByEmail')
  getByEmail(@Query() email: string) {
    return this.userSvc.getUserByEmail(email);
  }
}
