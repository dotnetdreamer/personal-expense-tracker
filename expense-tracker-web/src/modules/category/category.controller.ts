import { Controller, Get } from '@nestjs/common';

import { CategoryService } from './category.service';

@Controller('category')
export class CategoryController {
  constructor(private readonly categorySvc: CategoryService) {}

  @Get('getAll')
  getAll() {
    return this.categorySvc.findAll();
  }

  test() {
    // this.categorySvc.
  }
}
