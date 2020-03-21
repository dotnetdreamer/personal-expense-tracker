import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';

import { Expense } from './expense.entity';
import { IExpenseParams } from './expense.model';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>,
  ) {}

  async findAll(args?: { fromDate?: string, toDate?: string }): Promise<Expense[]> {
    let qb = await getRepository(Expense)
      .createQueryBuilder('exp');
      
      //TODO: need to fix this.
    if(args && (args.fromDate || args.toDate)) {
      if(args.fromDate) {
        // qb = qb.andWhere('createdAt >= :after');
        const fromDate =  moment(args.fromDate).toISOString();
        qb = qb.andWhere('exp.createdOn >= :createdOn', { createdOn: fromDate });
      }
      if(args.toDate) {
        const toDate =  moment(args.toDate).toISOString();
        qb = qb.andWhere('exp.createdOn <= :createdOn', { createdOn: toDate });
      }

      // console.log(qb.getQuery())
      

    }
      
      // .orWhere('user.email = :email', { email });
      qb = qb.orderBy("exp.id", 'DESC')

      return qb.getMany();
    // const user = await qb.getOne();

    // if (user) {
    //   const errors = {username: 'Username and email must be unique.'};
    //   throw new HttpException({message: 'Input data validation failed', errors}, HttpStatus.BAD_REQUEST);

    // }

    // return this.expenseRepo.find();
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