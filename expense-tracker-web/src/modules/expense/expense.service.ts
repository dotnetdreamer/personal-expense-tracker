import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';

import { Expense } from './expense.entity';
import { IExpenseParams } from './expense.model';
import { HelperService } from '../shared/helper.service';
import { AppConstant } from '../shared/app-constant';
import { IAttachmentParams } from '../attachment/attachment.model';
import { ICategoryParams } from '../category/category.model';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { fromDate?: string, toDate?: string }): Promise<Expense[]> {
    let qb = await getRepository(Expense)
      .createQueryBuilder('exp');
      
    if(args && (args.fromDate || args.toDate)) {
      if(args.fromDate) {
        // const fromDate =  moment(args.fromDate, AppConstant.DEFAULT_DATE_FORMAT).toDate();
        const fromDate = args.fromDate;
        qb = qb.andWhere('date(exp.createdOn) >= :createdOn', { createdOn: fromDate });
      }
      if(args.toDate) {
        // const toDate = moment(args.toDate, AppConstant.DEFAULT_DATE_FORMAT)
        //   .utc()
        //   .format(AppConstant.DEFAULT_DATE_FORMAT);
        const toDate =  args.toDate;
        qb = qb.andWhere('date(exp.createdOn) <= :createdOn', { createdOn: toDate });
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

    if(newOrUpdated.createdOn && !this.helperSvc.isValidDate(newOrUpdated.createdOn)) {
      newOrUpdated.createdOn = moment(expense.createdOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    }
    if(newOrUpdated.updatedOn && !this.helperSvc.isValidDate(newOrUpdated.updatedOn)) {
      newOrUpdated.updatedOn = moment(expense.updatedOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    }

    //in some cases (e.g adding in syncing) it is all attachment or category params object
    let attachmentId;
    if(typeof expense.attachment !== 'number') {
      const att = <IAttachmentParams>expense.attachment;
      attachmentId = att.id;
    } else {
      attachmentId = expense.attachment;
    }

    let categoryId;
    if(typeof expense.category !== 'number') {
      const cat = <ICategoryParams>expense.category;
      categoryId = cat.id;
    } else {
      categoryId = expense.category;
    }

    //now save
    return this.expenseRepo.save<Expense>({
      ...newOrUpdated,
      attachmentId: attachmentId,
      categoryId: categoryId
    });
  }

  remove(id) {
    return this.expenseRepo.delete(id);
  }
}