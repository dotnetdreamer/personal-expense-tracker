import { Injectable } from "@angular/core";

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { IExpense } from './expense.model';
import { AppConstant } from '../shared/app-constant';

@Injectable({
    providedIn: 'root'
})
export class ExpenseService extends BaseService {
    constructor() {
        super();
    }


    getExpenseList() {
        return this.dbService.getAll<Array<IExpense>>(this.schemaService.tables.expense);
    }

    put(expense: IExpense) {
        if(!expense.createdOn) {
            expense.createdOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }

        return this.dbService.put(this.schemaService.tables.expense, {
            description: expense.description,
            amount: expense.amount,
            categoryId: expense.categoryId,
            createdOn: expense.createdOn
        });
    }
}