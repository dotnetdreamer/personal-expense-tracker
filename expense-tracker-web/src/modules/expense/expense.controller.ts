import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body } from "@nestjs/common";

import { ExpenseService } from "./expense.service";
import { IExpenseParams } from "./expense.model";
import { Expense } from "./expense.entity";
import { AttachmentService } from "../attachment/attachment.service";
import { CategoryService } from "../category/category.service";

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseSvc: ExpenseService
    , private attachmentSvc: AttachmentService, private categorySvc: CategoryService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll() {
    const expenses = await this.expenseSvc.findAll();

    //map it
    const model = expenses.map(async (e) => {
      const mapped = await this._prepare(e);
      return mapped;
    });
    return Promise.all(model);
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
        
        delete returnedExpense.markedForAdd;
      } else if(model.markedForUpdate) {
        const toUpdate = await this.expenseSvc.findOne(model.id);
        if(!toUpdate) {
          continue;
        }
    
        let updated = await this._updateOrDelete(toUpdate, model, false);
        returnedExpense = updated;

        delete returnedExpense.markedForUpdate;
      } else if(model.markedForDelete) {
        const toDelete = await this.expenseSvc.findOne(model.id);
        if(!toDelete) {
          continue;
        }

        let deleted = await this._updateOrDelete(toDelete, model, true);
        returnedExpense = deleted;
        
        delete returnedExpense.markedForDelete;
      }

      itemMap.set(model.id, returnedExpense);
      items.push(itemMap);
    }

    return items;
  }

  private async _updateOrDelete(toUpdateOrDelete: Expense, model, shouldDelete?: boolean) {
    //no need to update
    delete toUpdateOrDelete.createdOn;
    toUpdateOrDelete.isDeleted = shouldDelete;

    let updated = Object.assign(toUpdateOrDelete, model);
    await this.expenseSvc.save(updated);

    return updated;
  }

  private async _prepare(exp: Expense) {
    let mExp = Object.assign({}, exp);
    //category
    mExp["category"] = await this.categorySvc.findOne(mExp.categoryId);
    //attachment
    if(mExp.attachmentId) {
      const attachment = await this.attachmentSvc.findOne(mExp.attachmentId);
      mExp["attachment"] = attachment;
    }

    //remove 
    delete mExp.attachmentId;
    delete mExp.categoryId;

    return mExp;
  }
}