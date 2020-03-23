import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';
import { CategoryService } from './modules/category/category.service';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService
    , private readonly categorySvc: CategoryService) {}

  getHello(): string {
    return this.appService.getHello();
  }

  @Get('install')
  install() {
    this._populate();
  }

  private async _populate() {
    await this.categorySvc.populate();
  }
}
