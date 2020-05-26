import { Injectable, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository, SelectQueryBuilder } from 'typeorm';
import * as moment from 'moment';

import { Expense } from './expense.entity';
import { IExpense, IExpenseTransaction } from './expense.model';
import { HelperService } from '../shared/helper.service';
import { AppConstant } from '../shared/app-constant';
import { IAttachmentParams } from '../attachment/attachment.model';
import { ICategoryParams } from '../category/category.model';
import { Category } from '../category/category.entity';
import { ExpenseTransaction } from './expense.transaction.entity';
import { User } from '../user/user.entity';
import { Group } from '../group/group.entity';
import { AttachmentService } from '../attachment/attachment.service';
import { ICurrentUser } from '../shared/shared.model';
import { GroupMemberStatus } from '../group/group.model';

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense) private expenseRepo: Repository<Expense>
    , @InjectRepository(User) private userRepo: Repository<User>
    , @InjectRepository(Group) private groupRepo: Repository<Group>
    , @InjectRepository(Category) private categoryRepo: Repository<Category>
    , @Inject(REQUEST) private readonly request: Request
    , private helperSvc: HelperService, private attachmentSvc: AttachmentService
  ) {}

  async findAll(args?: { 
      term?: string, groupId?: number, userIds?: number[]
    , fromDate?: string, toDate?: string
    , showHidden?: boolean, sync?: boolean
  }): Promise<any[]> {
    let qb = await getRepository(Expense)
      .createQueryBuilder('exp')
      .leftJoinAndSelect("exp.category", "cat")
      .leftJoinAndSelect("exp.transactions", "tran")      
      .leftJoinAndSelect("tran.user", "tranUsr")      
      .leftJoinAndSelect("exp.group", "grp")
      .leftJoinAndSelect("grp.members", "grpMbr"); 
      
          
    //current user expenses only...
    const user = <ICurrentUser>this.request.user;
    const cUserGroups = await getRepository(Group)
      .createQueryBuilder('grp')
      .leftJoinAndSelect("grp.members", "grpMbr")
      .where('grpMbr.userId = :gCurrentUserId', { gCurrentUserId: user.userId })
      .getMany();
    const cUserGroupIds = cUserGroups.map(g => g.id);

    const q = '((exp.groupId IS NOT NULL AND grp.id IN (:...groupIds) AND grpMbr.status IN (:...memberStatuses)) OR (exp.createdBy = :createdBy))';
    qb = qb.andWhere(q, { 
      groupIds: cUserGroupIds,
      memberStatuses: [GroupMemberStatus.Approved, GroupMemberStatus.Pending],
      createdBy: +user.userId
    });

    if(args && (args.term || args.groupId || args.userIds || args.fromDate || args.toDate)) {
      if(args.term) {
        const term = args.term.trim().toLowerCase();
        qb = qb.andWhere('(exp.description like :term', { term: `%${term}%` })
          .orWhere('cat.name like :categoryTerm)', { categoryTerm: `%${term}%`});
      }

      args.groupId = +args.groupId;
      if(args.groupId > 0) {
        qb = qb.andWhere("(grp.id = :groupId and grp.entityName = 'expense')", { groupId: args.groupId });
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

    qb = qb.andWhere('exp.isDeleted <= :isDeleted', { isDeleted: args && args.showHidden ? true : false });
    qb = qb.orderBy("exp.createdOn", 'DESC')
      .addOrderBy('exp.id', 'DESC');

    const expenses = await qb.getMany();

    const data = expenses.map(async (e) => {
      const map = await this._map(e);
      return map;
    });
    return Promise.all(data);
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

  async save(expense: IExpense) {
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

    let group = undefined;
    if(expense.group) {
      let gId;
      if (typeof expense.group !== 'number') {
        const grp = expense.group;
        gId = grp.id;
      } else {
        gId = expense.group;
      }
      group = await this.groupRepo.findOne({ id: gId });
    }

    const user = <ICurrentUser>this.request.user;
    if(typeof newOrUpdated.createdBy == 'undefined') {
      newOrUpdated.createdBy = user.userId;
    }

    if(newOrUpdated.updatedOn && typeof newOrUpdated.updatedBy == 'undefined') {
      newOrUpdated.updatedBy = user.userId;
    }

    //now save
    let newExp = new Expense();
    newExp = Object.assign({}, newOrUpdated);
    newExp.group = group;
    newExp.attachmentId = attachmentId;
    newExp.category = category;

    if(expense.transactions) {
      newExp.transactions = [];

      for(let expTran of expense.transactions) {
        const user = await this.userRepo.findOne({ email: expTran.email });

        //add
        const tran: ExpenseTransaction = {
          id: undefined,
          credit: expTran.credit,
          debit: expTran.debit,
          transactionType: expTran.transactionType,
          user: user,
          expense: undefined,
          actualPaidAmount: expTran.actualPaidAmount
        };
        if(!tran.createdOn) {
          tran.createdOn = <any>moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }

        newExp.transactions.push(tran);
      }
    }

    const saved = await this.expenseRepo.save(newExp);

    const maped = await this._map(saved);
    return maped;
  }

  remove(id) {
    return this.expenseRepo.delete(id);
  }

  private async _map(exp: Expense) {
    let mExp: IExpense;
    mExp = <any>Object.assign({}, exp);

    //transactions
    if(exp.transactions && exp.transactions.length) {
      mExp.transactions = exp.transactions.map(t => {
        const it: IExpenseTransaction = {
          email: t.user.email,
          name: t.user.name,
          credit: t.credit,
          debit: t.debit,
          transactionType: t.transactionType,
          actualPaidAmount: t.actualPaidAmount
        };
        return it;
      });
    }
    
    //attachment
    if(exp.attachmentId) {
      const attachment:any = await this.attachmentSvc.findOne(exp.attachmentId);
      if(!attachment.isDeleted) {
        mExp.attachment = {
          ...attachment,
          attachment: `${AppConstant.UPLOADED_PATH_FILES}/${attachment.guid}.${attachment.extension}`
        };
      }
    }

    //user
    if(exp.createdBy) {
      const cBy = await this.userRepo.findOne({ id: exp.createdBy });
      if(cBy) {
        mExp['createdByName'] = cBy.name;
      }
    }

    if(exp.updatedBy) {
      const uBy = await this.userRepo.findOne({ id: exp.updatedBy });
      if(uBy) {
        mExp['updatedByName'] = uBy.name;
      }
    }

    //remove 
    delete mExp['attachmentId'];
    delete mExp['markedForAdd'];
    delete mExp['markedForUpdate'];
    delete mExp['markedForDelete'];
    
    return mExp;
  }
}