import { Injectable } from "@angular/core";

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { IExpense } from './expense.model';
import { AppConstant } from '../shared/app-constant';
import { CategoryService } from '../category/category.service';
import { AttachmentService } from '../attachment/attachment.service';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class ExpenseService extends BaseService {
    private readonly BASE_URL = "expense";

    constructor(private categorySvc: CategoryService, private attachmentSvc: AttachmentService) {
        super();
    }

    pull() {
        return new Promise(async (resolve, reject) => {
            try {
                const items = await this.getExpenses();
                if(items.length) {
                    //local item marked for local changes i.e (delete, update or add) should be ignored...
                    for(let i of items) {
                        const localItem = await this.getByIdLocal(i.id);
                        if(localItem 
                            && !(localItem && (localItem.markedForAdd || localItem.markedForUpdate || localItem.markedForDelete))) {
                            await this.remove(localItem.id);
                        }
                    }
                    //now add
                    await this.putAllLocal(items, true, true);
                }
                resolve();
            } catch(e) {
                reject(e);
            }
        });
    }

    push() {
        return new Promise(async (resolve, reject) => {
            const unSycedLocal = await this.getUnSyncedLocal();
            if(AppConstant.DEBUG) {
                console.log('ExpenseService: sync: unSycedLocal items length', unSycedLocal.length);
            }

            if(!unSycedLocal.length) {
                resolve();
                return;
            }

            let dependancySynced = true;
            //make sure category and attachments are synced...if dependant are found
            unSycedLocal.forEach(async (ul) => {
                //make sure its synched first...
                try {
                    if(ul.category 
                        && (ul.category.markedForAdd || ul.category.markedForUpdate || ul.category.markedForDelete)) {
                        await this.categorySvc.push();
                    }
                } catch (e) {
                    //ignore...
                    dependancySynced = false;
                }

                try {
                    if(ul.attachment 
                        && (ul.attachment.markedForAdd || ul.attachment.markedForUpdate || ul.attachment.markedForDelete)) {
                        await this.attachmentSvc.push();
                    } 
                } catch(e) {
                    //ignore...
                    dependancySynced = false;
                }
            });

            if(!dependancySynced) {
                resolve();
                return; 
            }

            let items: Array<any>;
            //server returns array of dictionary objects, each key in dict is the localdb id
            //we map the localids and update its serverid locally
            try {
                items = await this.postData<any[]>({
                    url: `${this.BASE_URL}/sync`,
                    body: unSycedLocal
                });
            } catch(e) {
                reject(e);
                return;
            }
            
            //something bad happend or in case of update, we don't need to update server ids
            if(items == null) {
                resolve();
                return;
            }

            
            try {
                const promises = [];
                // const removePromises = [];
                //mark it
                for (let item of unSycedLocal) {
                    if (item.markedForAdd || item.markedForUpdate) {
                        //update server id as well...
                        const cp = items.filter(p => p[item.id])[0];
                        if(!cp) {
                            throw `Local item mapping not found for: ${item.id}`;
                        }

                        //removed old items whose ids are changed e.g in adding senario
                        //we remove the item immedialty as it causes issue when we run update promise down
                        await this.remove(item.id);

                        const pItem: IExpense = cp[item.id];
                        promises.push(this.putLocal(pItem, true, true));
                    } else if (item.markedForDelete) {
                        const promise = this.remove(item.id);
                        promises.push(promise);
                    }
                }

                //now make updates
                await Promise.all(promises);
                if(AppConstant.DEBUG) {
                    console.log('ExpenseService: sync: complete');
                }
                // this.eventPub.$pub(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    getUnSyncedLocal(): Promise<Array<IExpense>> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaService.tables.expense);

            const unSynced = [];
            let req = db.open(x => {
                let v: IExpense = x.getValue();
                if (v.markedForAdd || v.markedForUpdate || v.markedForDelete) {
                    unSynced.push(v);
                }
            }, iter);
            req.always(() => {
                resolve(unSynced);
            });
        });
    }

    getExpenses(args?: { fromDate?, toDate? }) {
        let body;

        if(args && (args.fromDate || args.toDate )) {
            body = { ...args };
        }
        return this.getData<IExpense[]>({
            url: `${this.BASE_URL}/getAll`,
            body: body
        });
    }

    getExpenseListLocal(args?: { term?, fromDate?, toDate? }): Promise<IExpense[]> {
        return new Promise(async (resolve, reject) => {
            let results = [];
            // if(!args) {
            //     results = await this.dbService.getAll<IExpense[]>(this.schemaService.tables.expense);
            //     //sor by desc
            //     results = await this._map(results);
            //     results = this._sort(results);

            //     resolve(results);
            //     return;
            // }
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
                let item: IExpense;
                if(args) {
                    if(args.term) {
                        const term = args.term.toLowerCase();
                        if(v.description.toLowerCase().startsWith(term) 
                            || (v.category.name.toLowerCase().startsWith(term))) {
                            item = v;
                        }
                    }
                } else {
                    item = v;
                }

                if(item && !item.markedForDelete) {
                    //do not show deleted...
                    results.push(item);
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

    getReportByCategory(fromDate: string, toDate: string, totalItems = 10)
        : Promise<Array<{ categoryId, categoryName, total, totalAmount }>> {
        return new Promise((resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaService.tables.expense);

            const items = [];
            let req = db.open(x => {
                let e: IExpense = x.getValue();
                if (moment(e.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT) >= fromDate
                    && moment(e.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT) <= toDate) {
                    items.push(e);
                }
            }, iter);

            req.always(() => {
                let result = [];

                const catGroup = items.groupBy((i: IExpense) => i.category.id.toString());
                let i = 0;
                for(let cat in catGroup) {
                    if(i == totalItems) {
                        break;
                    }

                    const sum = (<IExpense[]>catGroup[cat]).reduce((a, b) => a + (+b.amount), 0);
                    result.push({
                        categoryId: cat,
                        categoryName: catGroup[cat][0].category.name,
                        total: catGroup[cat].length,
                        totalAmount: sum
                    });
                    i++;
                } 
                //order by...
                result = result.sort((a, b) => {
                    return a.total - b.total;
                })
                resolve(result);
            });
        });
    }

    getByIdLocal(id) {
        return this.dbService.get<IExpense>(this.schemaService.tables.expense, id);
    }

    async putLocal(item: IExpense, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        //defaults
         if(!ignoreDefaults) {
            if(typeof item.markedForAdd === 'undefined' 
                && typeof item.markedForUpdate === 'undefined' && typeof item.markedForDelete === 'undefined') {
                item.markedForAdd = true;
            }
            if(item.markedForAdd) {
                item.createdOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            } else if(item.markedForUpdate || item.markedForDelete) {
                item.updatedOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }
            //added item can't be marked for update or delete...
            if((item.markedForAdd && item.markedForUpdate) || (item.markedForAdd && item.markedForDelete)) {
                item.markedForUpdate = false;
                item.markedForDelete = false;
            }
        }
        
        //push attachment only in case of Add, ignore in edit/delete
        if(item.attachment && item.markedForAdd) {
            const id = await this.attachmentSvc.putLocal(item.attachment);
            item.attachment.id = +id;
        }

        return this.dbService.putLocal(this.schemaService.tables.expense, item)
        .then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.eventPub.$pub(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, item);
            }
            return affectedRows;
        });
    }

    putAllLocal(expenses: IExpense[], ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        return new Promise(async (resolve, reject) => {
            const promises = [];

            for(let exp of expenses) {
                promises.push(this.putLocal(exp, ignoreFiringEvent, ignoreDefaults));
            }

            await Promise.all(promises);
            resolve();
        });
    }

    remove(id) {
        return this.dbService.remove(this.schemaService.tables.expense, id);
    }

    removeAll() {
        return this.dbService.removeAll(this.schemaService.tables.expense);
    }

    private async _map(expenses: Array<IExpense>) {
        // const promises = [];
        // for(let exp of expenses) {
        //     const expPromise = this.categorySvc.getCategoryByIdLocal(exp.categoryId)
        //     .then(e => exp.category = e);
        //     promises.push(exp);
        // }
        // const exMapeed = await Promise.all(promises);
        // return exMapeed;
        return expenses;
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