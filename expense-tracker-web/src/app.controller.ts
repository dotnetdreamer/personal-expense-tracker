import { Controller, Get, UseGuards, Post, Request, UseInterceptors, ClassSerializerInterceptor, Body, UnauthorizedException } from '@nestjs/common';

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

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('authenticate')
  async authenticate(@Body() args: { email, password }) {
    const user = await this.authSvc.validateUser(args.email, args.password);
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.authSvc.login(user);
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
