import { Controller, Get, UseGuards, Post, Request, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';

import { AppService } from './app.service';
import { CategoryService } from './modules/category/category.service';
import { AuthService } from './modules/user/auth/auth.service';
import { LocalAuthGuard } from './modules/user/auth/local-auth.guard';

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
  async login(@Request() req) {
    return this.authSvc.login(req.user);
  }

  private async _populate() {
    await this.categorySvc.populate();
  }
}
