import { Controller, Get, Query, Body, Post, UseInterceptors
  , ClassSerializerInterceptor, UseGuards 
} from '@nestjs/common';

import { CategoryService } from './category.service';
import { ICategoryParams } from './category.model';
import { Category } from './category.entity';
import { JwtAuthGuard } from '../user/auth/jwt-auth.guard';

@Controller('category')
export class CategoryController {
  constructor(private readonly categorySvc: CategoryService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  getAll() {
    return this.categorySvc.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Body() models: ICategoryParams[]) {
    //local id and mapping server record
    let items: Array<Map<number, any>> = [];

    for (let model of models)
    {
      const itemMap: Map<number, ICategoryParams> = new Map();
      let returnedCategory: any;

      if (model.markedForAdd) {
        //generate new one..ignore id from client
        let toAdd = Object.assign({}, model);
        delete toAdd.id;

        const item = await this.categorySvc.save(toAdd);
        returnedCategory = item;        
        
        delete returnedCategory.markedForAdd;
      } else if(model.markedForUpdate) {
        const toUpdate = await this.categorySvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }
    
        let updated = await this._updateOrDelete(toUpdate, model, false);
        returnedCategory = updated;

        delete returnedCategory.markedForUpdate;
      } else if(model.markedForDelete) {
        const toDelete = await this.categorySvc.findOne(model.id);
        if(!toDelete) {
          continue;
        }

        let deleted = await this._updateOrDelete(toDelete, model, true);
        returnedCategory = deleted;
        
        delete returnedCategory.markedForDelete;
      }

      itemMap.set(model.id, returnedCategory);
      items.push(itemMap);
    }

    return items;
  }

  private async _updateOrDelete(toUpdateOrDelete: Category, model, shouldDelete?: boolean) {
    //no need to update
    delete toUpdateOrDelete.createdOn;
    toUpdateOrDelete.isDeleted = shouldDelete;

    let updated = Object.assign(toUpdateOrDelete, model);
    await this.categorySvc.save(updated);

    return updated;
  }
}
