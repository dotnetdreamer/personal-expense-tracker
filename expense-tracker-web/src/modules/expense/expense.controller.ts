import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query } from "@nestjs/common";

import { ExpenseService } from "./expense.service";
import { IExpenseParams } from "./expense.model";
import { Expense } from "./expense.entity";
import { AttachmentService } from "../attachment/attachment.service";
import { CategoryService } from "../category/category.service";
import { AppConstant } from "../shared/app-constant";

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseSvc: ExpenseService
    , private attachmentSvc: AttachmentService, private categorySvc: CategoryService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll(@Query() filters?: { term?: string, fromDate?: string, toDate?: string }) {
    const expenses = await this.expenseSvc.findAll(filters);

    //map it
    const model = expenses.map(async (e) => {
      const mapped = await this._prepare(e);
      return mapped;
    });
    return Promise.all(model);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getReport')
  async getReport(@Query() filters: { fromDate: string, toDate: string }) {
    const items = await this.expenseSvc.getReport(
      filters.fromDate, filters.toDate);
    return items;
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Body() models: IExpenseParams[]) {
    //local id and mapping server record
    let items: Array<Map<number, any>> = [];

    for (let model of models)
    {
      const itemMap: Map<number, IExpenseParams> = new Map();
      let returnedExpense: any;

      if (model.markedForAdd) {
        //generate new one..ignore id from client
        let toAdd = Object.assign({}, model);
        delete toAdd.id;

        const item = await this.expenseSvc.save(toAdd);
        returnedExpense = item;        
      } else if(model.markedForUpdate) {
        const toUpdate = await this.expenseSvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }
    
        let updated = await this._updateOrDelete(toUpdate, model, false);
        returnedExpense = updated;
      } else if(model.markedForDelete) {
        const toDelete = await this.expenseSvc.findOne(model.id);
        if(!toDelete) {
          continue;
        }

        let deleted = await this._updateOrDelete(toDelete, model, true);
        returnedExpense = deleted;
      }

      // delete returnedExpense.markedForAdd;
      // delete returnedExpense.markedForUpdate;
      // delete returnedExpense.markedForDelete;

      // if(returnedExpense.category) {
      //   delete returnedExpense.category.markedForAdd;
      //   delete returnedExpense.category.markedForUpdate;
      //   delete returnedExpense.category.markedForDelete;
      // }

      // if(returnedExpense.attachment) {
      //   delete returnedExpense.attachment.markedForAdd;
      //   delete returnedExpense.attachment.markedForUpdate;
      //   delete returnedExpense.attachment.markedForDelete;
      // }
      returnedExpense = await this._prepare(returnedExpense);

      itemMap.set(model.id, returnedExpense);
      items.push(itemMap);
    }

    return items;
  }

  private async _updateOrDelete(toUpdateOrDelete: Expense, model, shouldDelete?: boolean) {
    //no need to update
    // delete model.createdOn;
    // delete model.attachment;
    model.isDeleted = shouldDelete;

    let updated = Object.assign(toUpdateOrDelete, model);
    await this.expenseSvc.save(updated);

    return updated;
  }

  private async _prepare(exp: Expense) {
    let mExp = Object.assign({}, exp);
    
    //category
    const category = await this.categorySvc.findOne(mExp.categoryId);
    mExp["category"] = category;
 
    //attachment
    if(mExp.attachmentId) {
      const attachment = await this.attachmentSvc.findOne(mExp.attachmentId);
      mExp["attachment"] = {
        ...attachment,
        attachment: `${AppConstant.UPLOADED_PATH_FILES}/${attachment.guid}.${attachment.extension}`
      };
    }

    //remove 
    delete mExp.attachmentId;
    delete mExp.categoryId;
    delete mExp['markedForAdd'];
    delete mExp['markedForUpdate'];
    delete mExp['markedForDelete'];

    // if(mExp.category) {
    //   delete mExp.category.markedForAdd;
    //   delete mExp.category.markedForUpdate;
    //   delete mExp.category.markedForDelete;
    // }

    // if(mExp.attachment) {
    //   delete mExp.attachment.markedForAdd;
    //   delete mExp.attachment.markedForUpdate;
    //   delete mExp.attachment.markedForDelete;
    // }

    return mExp;
  }
}