import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './category.entity';
import { ICategory } from './category.model';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepo.find();
  }

  findOne(id: string): Promise<Category> {
    return this.categoryRepo.findOne(id);
  }

  save(category: ICategory) {
    return this.categoryRepo.save<ICategory>(category);
  }

  remove(id: string) {
    return this.categoryRepo.delete(id);
  }
}