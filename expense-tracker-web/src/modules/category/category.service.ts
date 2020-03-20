import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './category.entity';
import { ICategoryParams } from './category.model';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
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
    return this.categoryRepo.save<Category>(newOrUpdated);
  }

  remove(id) {
    return this.categoryRepo.delete(id);
  }
}