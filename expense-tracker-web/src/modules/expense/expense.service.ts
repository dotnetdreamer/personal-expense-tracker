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
import { Category } from '../category/category.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepo: Repository<Expense>
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { term?: string, fromDate?: string, toDate?: string, showHidden?: boolean }): Promise<Expense[]> {
    let qb = await getRepository(Expense)
      .createQueryBuilder('exp'); 
      
    if(args && (args.term || args.fromDate || args.toDate)) {
      if(args.term) {
        const term = args.term.trim().toLowerCase();
        qb = qb.innerJoinAndSelect(Category, "cat", "cat.id = exp.categoryId");
        qb = qb.andWhere('(exp.description like :term', { term: `%${term}%` })
          .orWhere('cat.name like :categoryTerm)', { categoryTerm: `%${term}`});
      }

      if(args.fromDate) {
        // const fromDate =  moment(args.fromDate, AppConstant.DEFAULT_DATE_FORMAT).toDate();
        const fromDate = args.fromDate;
        qb = qb.andWhere('exp.createdOn >= :createdOnFrom', { createdOnFrom: fromDate });
      }
      if(args.toDate) {
        const toDate =  args.toDate; 
        qb = qb.andWhere('exp.createdOn <= :createdOnToDate', { createdOnToDate: toDate });
      }
      // console.log(qb.getQuery())
    }
      
    // .orWhere('user.email = :email', { email });
    qb = qb.andWhere('exp.isDeleted <= :isDeleted', { isDeleted: args && args.showHidden ? true : false });
    qb = qb.orderBy("exp.id", 'DESC')

    return qb.getMany();
  }

  async getReport(fromDate: string, toDate: string, totalItems = 10, showHidden = false)
    : Promise<{ categories: Array<{ label, total, totalAmount }>, dates: Array<{ label, total, totalAmount }> }> {
    let qb = await getRepository(Expense)
      .createQueryBuilder("exp");

    qb = qb.innerJoinAndSelect(Category, "cat", "cat.id == categoryId");
    qb = qb.andWhere('date(exp.createdOn) >= :createdOnFrom', { createdOnFrom: fromDate });
    qb = qb.andWhere('date(exp.createdOn) <= :createdOnToDate', { createdOnToDate: toDate });
    qb = qb.andWhere('exp.isDeleted <= :isDeleted', { isDeleted: showHidden });

    qb = qb.select("COUNT(exp.id)", "total")
    .addSelect("SUM(exp.amount)", "totalAmount");

    let catQb = qb;
    catQb = catQb.addSelect("cat.name", "label");
    catQb = catQb.groupBy("exp.categoryId");
    catQb = catQb.orderBy("total", 'ASC');
    const categories: any = await catQb.limit(totalItems).getRawMany();

    let datQb = qb;
    datQb = datQb.addSelect("date(exp.createdOn)", "label");
    datQb = datQb.groupBy("date(exp.createdOn)");
    datQb = datQb.orderBy("date(exp.createdOn)", 'DESC');

    const dates: any = await datQb.getRawMany();

    return {
      categories: categories,
      dates: dates
    };
  }

  findOne(id): Promise<Expense> {
    return this.expenseRepo.findOne(id);
  }

  save(expense: IExpenseParams) {
    let newOrUpdated: any = Object.assign({}, expense);
    if(typeof newOrUpdated.isDeleted === 'undefined') {
      newOrUpdated.isDeleted = false;
    }

    //date is comming always as utc now..no need for this for now
    // if(newOrUpdated.createdOn && !this.helperSvc.isValidDate(newOrUpdated.createdOn)) {
    //   newOrUpdated.createdOn = moment(expense.createdOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    // }
    // if(newOrUpdated.updatedOn && !this.helperSvc.isValidDate(newOrUpdated.updatedOn)) {
    //   newOrUpdated.updatedOn = moment(expense.updatedOn, AppConstant.DEFAULT_DATETIME_FORMAT).toDate();
    // }

    //in some cases (e.g adding in syncing) it is all attachment or category params object
    let attachmentId = undefined;
    if(expense.attachment) {
      if(typeof expense.attachment !== 'number') {
        const att = <IAttachmentParams>expense.attachment;
        attachmentId = att.id;
      } else {
        attachmentId = expense.attachment;
      }
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