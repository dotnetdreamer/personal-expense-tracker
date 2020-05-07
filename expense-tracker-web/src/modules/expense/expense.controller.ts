import { Controller, UseInterceptors, Get, ClassSerializerInterceptor, Post, Body, Query, UseGuards, Req } from "@nestjs/common";

import { Request } from "express";

import { ExpenseService } from "./expense.service";
import { IExpense } from "./expense.model";
import { Expense } from "./expense.entity";
import { AttachmentService } from "../attachment/attachment.service";
import { AppConstant } from "../shared/app-constant";
import { JwtAuthGuard } from "../user/auth/jwt-auth.guard";
import { ICurrentUser } from "../shared/shared.model";

@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseSvc: ExpenseService
    , private attachmentSvc: AttachmentService) {}

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getAll')
  async getAll(@Req() req: Request,
   @Query() filters?: { groupId?: number, term?: string, fromDate?: string, toDate?: string, sync?: boolean }) {
    const expenses = await this.expenseSvc.findAll({
      ...filters
    });

    return expenses;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('getReport')
  async getReport(@Query() filters: { groupId?: number, fromDate: string, toDate: string }) {
    const items = await this.expenseSvc.getReport({
      fromDate: filters.fromDate,
      toDate: filters.toDate,
      groupId: filters.groupId
    });
    return items;
  }

  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  @Post('sync')
  async sync(@Body() models: IExpense[]) {
    //local id and mapping server record
    let items: Array<Map<number, any>> = [];

    for (let model of models)
    {
      const itemMap: Map<number, IExpense> = new Map();
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

      itemMap.set(model.id, returnedExpense);
      items.push(itemMap);
    }

    //test delay...
    // await this._timeout();
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
    
    //attachment
    if(mExp.attachmentId) {
      const attachment = await this.attachmentSvc.findOne(mExp.attachmentId);
      if(!attachment.isDeleted) {
        mExp["attachment"] = {
          ...attachment,
          attachment: `${AppConstant.UPLOADED_PATH_FILES}/${attachment.guid}.${attachment.extension}`
        };
      }
    }

    //remove 
    delete mExp.attachmentId;
    delete mExp['markedForAdd'];
    delete mExp['markedForUpdate'];
    delete mExp['markedForDelete'];

    return mExp;
  }

  private _timeout() {
    return new Promise((resolve, reject) => setTimeout(resolve, 5000));
  }
}