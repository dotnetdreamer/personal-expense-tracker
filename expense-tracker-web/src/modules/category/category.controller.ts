import { Controller, Get, Query, Body, Post, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';


import { CategoryService } from './category.service';
import { ICategory } from './category.model';

@Controller('category')
export class CategoryController {
  constructor(private readonly categorySvc: CategoryService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  getAll() {
    return this.categorySvc.findAll();
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Body() models: ICategory[]) {
    //local id and mapping server record
    let items: Array<Map<number, ICategory>> = [];

    for (let model of models)
    {
      if (model.markedForAdd) {
        const item = await this.categorySvc.save(model);
        delete item.markedForUpdate;
        delete item.markedForDelete;
        delete item.markedForAdd;

        const itemMap: Map<number, ICategory> = new Map();
        itemMap.set(model.id, item);

        items.push(itemMap);
      } else if(model.markedForUpdate) {
        const toUpdate = await this.categorySvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }

        //no need to update
        delete toUpdate.createdOn;
    
        let updated = Object.assign(toUpdate, model);
        await this.categorySvc.save(updated);
      }
    }

    return items;
  }
}
