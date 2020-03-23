import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as moment from 'moment';

import { Category } from './category.entity';
import { ICategoryParams } from './category.model';
import { AppConstant } from '../shared/app-constant';
import { HelperService } from '../shared/helper.service';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>
    , private helperSvc: HelperService
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  findOne(id): Promise<Category> {
    return this.categoryRepo.findOne(id);
  }

  save(category: ICategoryParams) {
    let newOrUpdated: any = Object.assign({}, category);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }

    if(newOrUpdated.createdOn && !this.helperSvc.isValidDate(newOrUpdated.createdOn)) {
      newOrUpdated.createdOn = moment(category.createdOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    }
    if(newOrUpdated.updatedOn && !this.helperSvc.isValidDate(newOrUpdated.updatedOn)) {
      newOrUpdated.updatedOn = moment(category.updatedOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    }

    return this.categoryRepo.save<Category>(newOrUpdated);
  }

  remove(id) {
    return this.categoryRepo.delete(id);
  }

  count() {
    return this.categoryRepo.count();
  }

  
  async populate() {
    const items = await this.count();
    if(items > 0) {
      return;
    }

    const toDate =  moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
    const categories: ICategoryParams[] = [
      { groupName: '', name: 'General', icon: 'newspaper-outline', createdOn: toDate },
      //Entertainment
      { groupName: 'Entertainment', name: 'Games', icon: 'game-controller-outline', createdOn: toDate },
      { groupName: 'Entertainment', name: 'Movies', icon: 'videocam-outline', createdOn: toDate },
      { groupName: 'Entertainment', name: 'Music', icon: 'musical-notes-outline', createdOn: toDate },
      { groupName: 'Entertainment', name: 'Other', icon: 'newspaper-outline', createdOn: toDate },
      { groupName: 'Entertainment', name: 'Sports', icon: 'football-outline', createdOn: toDate },
      //Food and Drink
      { id: 6, groupName: 'Food and Drink', name: 'Dinning Out', icon: 'restaurant-outline', createdOn: toDate },
    ];
    
    categories.forEach(async (c) => {
      await this.save(c);
    });
  }
}