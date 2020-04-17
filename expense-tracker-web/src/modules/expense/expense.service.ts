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
import { ExpenseTransaction } from './expense.transaction.entity';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>
    , @InjectRepository(User) private userRepo: Repository<User>
    , @InjectRepository(Group) private groupRepo: Repository<Group>
    , @InjectRepository(Category) private categoryRepo: Repository<Category>
    , private helperSvc: HelperService
  ) {}

  async findAll(args?: { 
      term?: string, groupId?: number, userIds?: number[]
    , fromDate?: string, toDate?: string, showHidden?: boolean 
  }): Promise<Expense[]> {
    let qb = await getRepository(Expense)
      .createQueryBuilder('exp')
      .leftJoinAndSelect("exp.category", "cat")
      .leftJoinAndSelect("exp.group", "grp"); 
      
    if(args && (args.term || args.groupId || args.userIds || args.fromDate || args.toDate)) {
      if(args.term) {
        const term = args.term.trim().toLowerCase();
        qb = qb.andWhere('(exp.description like :term', { term: `%${term}%` })
          .orWhere('cat.name like :categoryTerm)', { categoryTerm: `%${term}%`});
      }

      args.groupId = +args.groupId;
      if(args.groupId > 0) {
        //show non-grouped only if no grouped is passed
        qb = qb.andWhere("(grp.id = :groupId and grp.entityName = 'expense')", { groupId: args.groupId });
      } else {
        qb = qb.andWhere("exp.group is null");
      }
      
      if(args.userIds && args.userIds.length) {
        qb = qb.andWhere("exp.createdBy IN (:...userIds)", { userIds: args.userIds })
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
    qb = qb.orderBy("exp.createdOn", 'DESC')
      .addOrderBy('exp.id', 'DESC');

    return qb.getMany();
  }

  async getReport(args: {
    fromDate: string, toDate: string, totalItems?: number, showHidden?: boolean
    , groupId?: number, userIds?: number[]
    }) : Promise<{ categories: Array<{ label, total, totalAmount }>, dates: Array<{ label, total, totalAmount }> }> {
    //defaults
    if(typeof args.totalItems === 'undefined') {
      args.totalItems = 10;
    }
    if(typeof args.showHidden === 'undefined') {
      args.showHidden = true;
    }

    let qb = await getRepository(Expense)
      .createQueryBuilder("exp")
      .leftJoinAndSelect("exp.category", "cat")
      .leftJoinAndSelect("exp.group", "grp");

    qb = qb.andWhere('date(exp.createdOn) >= :createdOnFrom', { createdOnFrom: args.fromDate });
    qb = qb.andWhere('date(exp.createdOn) <= :createdOnToDate', { createdOnToDate: args.toDate });
    qb = qb.andWhere('exp.isDeleted <= :isDeleted', { isDeleted: args.showHidden });
    
    args.groupId = +args.groupId;
    if(args.groupId > 0) {
      //show non-grouped only if no grouped is passed
      qb = qb.andWhere("exp.groupId = :groupId", { groupId: args.groupId });
    } else {
      qb = qb.andWhere("(exp.groupId is null OR exp.groupId = 0)");
    }
    
    if(args.userIds && args.userIds.length) {
      qb = qb.andWhere("exp.createdBy IN (:...userIds)", { userIds: args.userIds })
    }

    qb = qb.select("COUNT(exp.id)", "total")
    .addSelect("SUM(exp.amount)", "totalAmount");

    let catQb = qb;
    catQb = catQb.addSelect("cat.name", "label");
    catQb = catQb.groupBy("cat.id");
    catQb = catQb.orderBy("total", 'ASC');
    const categories: any = await catQb.limit(args.totalItems).getRawMany();

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

  async save(expense: IExpenseParams) {
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

    let category;
    if(typeof expense.category !== 'number') {
      category = expense.category;
    } else {
      category = this.categoryRepo.findOne({ id: expense.category });
    }

    let group;
    if (expense.group) {
      let gId;
      if (typeof expense.group !== 'number') {
        const grp = expense.group;
        gId = grp.id;
      } else {
        gId = expense.group;
      }
      group = await this.groupRepo.findOne({ id: gId });
    }

    const transactions = [];
    if(expense.transactions) {
      for(let expTran of expense.transactions) {
        const user = await this.userRepo.findOne({ email: expTran.email });

        //add
        const tran: ExpenseTransaction = {
          id: undefined,
          credit: expTran.credit,
          debit: expTran.debit,
          transactionType: expTran.transactionType,
          user: user,
          expense: null
        };
        if(!tran.createdOn) {
          tran.createdOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }

        transactions.push(tran);
      }
    }

    //now save
    return this.expenseRepo.save<Expense>({
      ...newOrUpdated,
      group: group,
      attachmentId: attachmentId,
      category: category,
      transactions: transactions.length ? transactions : undefined
    });
  }

  remove(id) {
    return this.expenseRepo.delete(id);
  }
}