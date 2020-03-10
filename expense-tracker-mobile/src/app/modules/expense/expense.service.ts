import { Injectable } from "@angular/core";

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { IExpense } from './expense.model';
import { AppConstant } from '../shared/app-constant';
import { CategoryService } from '../category/category.service';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class ExpenseService extends BaseService {
    constructor(private categorySvc: CategoryService) {
        super();
    }


    getExpenseList(args?: { term?, fromDate?, toDate? }): Promise<IExpense[]> {
        return new Promise(async (resolve, reject) => {
            let results = [];
            if(!args) {
                results = await this.dbService.getAll<IExpense[]>(this.schemaService.tables.expense);
                //sor by desc
                results = await this._map(results);
                results = this._sort(results);

                resolve(results);
                return;
            }
            const db = this.dbService.Db;
            // new ydn.db.IndexValueIterator(store, opt.key, key_range, (pageSize == 0 ? undefined : pageSize), (skip > 0 ? skip: undefined), false);
            //https://github.com/yathit/ydn-db/blob/8d217ba5ff58a1df694b5282e20ebc2c52104197/test/qunit/ver_1_iteration.js#L117
            //(store_name, key_range, reverse)
            const iter = new ydn.db.ValueIterator(this.schemaService.tables.expense);
            
            // let idx = 0;
            let req = db.open(x => {
                let v: IExpense = x.getValue();
                // const objToFind = v.company.locales.find(l => l.languageId == wkLanguage.id);

                // const cLocaledName: string = objToFind.name.toLowerCase();
                if((args.term && v.description.toLowerCase().startsWith(args.term))) {
                    results.push(v);
                }
                req.done();
                // idx++;
                // console.log(idx);
            }, iter);
            req.always(async () => {
                results = await this._map(results);
                results = this._sort(results);
                resolve(results);
            });
        });
    }

    getById(id) {
        return this.dbService.get<IExpense>(this.schemaService.tables.expense, id);
    }

    put(expense: IExpense) {
        if(!expense.createdOn) {
            expense.createdOn = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
        }

        return this.dbService.put(this.schemaService.tables.expense, {
            description: expense.description,
            amount: expense.amount,
            categoryId: expense.categoryId,
            notes: expense.notes,
            attachment: expense.attachment,
            createdOn: expense.createdOn
        });
    }

    private async _map(expenses: Array<IExpense>) {
        const promises = [];
        for(let exp of expenses) {
            const expPromise = this.categorySvc.getCategoryById(exp.categoryId)
            .then(e => exp.category = e);
            promises.push(exp);
        }
        const exMapeed = await Promise.all(promises);
        return exMapeed;
    }

    private _sort(expenses: Array<IExpense>) {
        expenses.sort((aDate: IExpense, bDate: IExpense) => {
            // Turn your strings into dates, and then subtract them
            // to get a value that is either negative, positive, or zero.
            const a = moment(`${aDate.createdOn} ${aDate.createdOn}`, AppConstant.DEFAULT_DATETIME_FORMAT);
            const b = moment(`${bDate.createdOn} ${bDate.createdOn}`, AppConstant.DEFAULT_DATETIME_FORMAT);

            //The following also takes seconds and milliseconds into account and is a bit shorter.
            return b.valueOf() - a.valueOf();
        });

        //then by id
        expenses.sort((a, b) => b.id - a.id);
        return expenses;
    }
}