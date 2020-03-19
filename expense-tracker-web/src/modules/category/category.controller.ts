import { Controller, Get, Query, Body, Post } from '@nestjs/common';

import { CategoryService } from './category.service';
import { ICategory } from './category.model';

@Controller('category')
export class CategoryController {
  constructor(private readonly categorySvc: CategoryService) {}

  @Get('getAll')
  getAll() {
    return this.categorySvc.findAll();
  }

  @Post('post')
  async post(@Body() args: ICategory) {
    const result = await this.categorySvc.save(args);
    return result;
  }
}
