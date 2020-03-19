import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from './category.entity';

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

  create(category) {
    return this.categoryRepo.create(category);
  }

  remove(id: string) {
    return this.categoryRepo.delete(id);
  }
}