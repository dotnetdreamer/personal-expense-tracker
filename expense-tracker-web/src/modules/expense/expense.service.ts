import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Expense } from './expense.entity';
import { IExpenseParams } from './expense.model';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
  ) {}

  findAll(): Promise<Expense[]> {
    return this.expenseRepo.find();
  }

  findOne(id): Promise<Expense> {
    return this.expenseRepo.findOne(id);
  }

  save(expense: IExpenseParams) {
    let newOrUpdated: any = Object.assign({}, expense);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }
    return this.expenseRepo.save<Expense>(newOrUpdated);
  }

  remove(id) {
    return this.expenseRepo.delete(id);
  }
}