import { Controller, Get, Query, Body, Post, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';

import { IRegistrationParams } from './user.model';
import { UserService } from './user.service';


@Controller('user')
export class UserController {
  constructor(private readonly userSvc: UserService) {}

//   @UseInterceptors(ClassSerializerInterceptor)
//   @Get('getAll')
//   getAll() {
//     // return this.categorySvc.findAll();
//   }

    @UseInterceptors(ClassSerializerInterceptor)
    @Post('register')
    async register(@Body() model: IRegistrationParams) {
        return this.userSvc.register(model);
    }
}
