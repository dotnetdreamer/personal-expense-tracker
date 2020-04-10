import { Controller, Get, UseGuards, Post, Request, UseInterceptors, ClassSerializerInterceptor, Body } from '@nestjs/common';

import { AppService } from './app.service';
import { CategoryService } from './modules/category/category.service';
import { AuthService } from './modules/user/auth/auth.service';
import { LocalAuthGuard } from './modules/user/auth/local-auth.guard';
import { IRegistrationParams } from './modules/user/user.model';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService
    , private readonly categorySvc: CategoryService
    , private authSvc: AuthService) {}

  getHello(): string {
    return this.appService.getHello();
  }

  @Get('install')
  install() {
    this._populate();
  }

  @UseGuards(LocalAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('authenticate')
  async authenticate(@Request() req) {
    return this.authSvc.login(req.user);
  }
  
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('register')
  async register(@Body() model: IRegistrationParams) {
    return this.authSvc.register(model);
  }

  private async _populate() {
    await this.categorySvc.populate();
  }
}
