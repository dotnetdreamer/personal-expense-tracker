import { Injectable } from "@angular/core";

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { IExpense, IExpenseDashboardReport } from './expense.model';
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
                //by default fetch 90 days records only
                const fromDate = moment().add(-90, 'days').format(AppConstant.DEFAULT_DATE_FORMAT);
                const items = await this.getExpenses({ fromDate: fromDate, sync: true });
                let allItems;

                if(!items.length) {
                    //no items found or don't have access on server, get local items and delete it!
                    allItems = await this.getExpenseListLocal();
                } else {
                    allItems = items;
                }

                //local item marked for local changes i.e (delete, update or add) should be ignored...
                for(let i of allItems) {
                    const localItem = await this.getByIdLocal(i.id);
                    if(localItem 
                        && !(localItem && (localItem.markedForAdd || localItem.markedForUpdate || localItem.markedForDelete))) {
                        await this.remove(localItem.id);
                    }
                }

                //no items found ons server? don't proceed!
                if(!items.length) {
                    resolve();
                    return;
                }

                //now add
                await this.putAllLocal(items, true, true);

                resolve();
            } catch(e) {
                reject(e);
            }
        });
    }

    push() {
        return new Promise(async (resolve, reject) => {
            let unSycedLocal = await this.getUnSyncedLocal();
            if(AppConstant.DEBUG) {
                console.log('ExpenseService: sync: unSycedLocal items length', unSycedLocal.length);
            }

            //do not push same records again...
            unSycedLocal = unSycedLocal.filter(ul => this._findInQueue(ul) == -1);

            if(!unSycedLocal.length) {
                resolve();
                return;
            }

            let dependancySynced = {
                category: false,
                attachment: false
            };

            //make sure category and attachments are synced...if dependant are found
            unSycedLocal.forEach(async (ul) => {
                //make sure its synched first...
                try {
                    if(ul.category 
                        && (ul.category.markedForAdd || ul.category.markedForUpdate || ul.category.markedForDelete)) {
                        await this.categorySvc.push();
                        dependancySynced.category = true;
                    } else {
                        dependancySynced.category = true;
                    }
                } catch (e) {
                    //ignore...
                }

                try {
                    if(ul.attachment 
                        && (ul.attachment.markedForAdd || ul.attachment.markedForUpdate || ul.attachment.markedForDelete)) {
                        await this.attachmentSvc.push({
                            data: [ul],
                            successCallback: async (updatedItems: IExpense[]) => {   
                                //now update it also locally
                                await this.putAllLocal(updatedItems, true, true);
                                dependancySynced.attachment = true;
                            }
                        });
                    } else {
                        dependancySynced.attachment = true;
                    }
                } catch(e) {
                    //ignore...
                }
            });

            if(!dependancySynced.attachment || !dependancySynced.category) {
                resolve();
                return; 
            }

            //add to push queue
            this._addQueuePattern(unSycedLocal);

            let items: Array<any>;
            //server returns array of dictionary objects, each key in dict is the localdb id
            //we map the localids and update its serverid locally
            try {
                items = await this.postData<any[]>({
                    url: `${this.BASE_URL}/sync`,
                    body: unSycedLocal
                });
            } catch(e) {
                //try syncing 1 item at a time...
                for(let i=0; i < unSycedLocal.length; i++) {
                    const usItem = unSycedLocal[i];
                    try {
                        const returnedItems = await this.postData<any[]>({
                            url: `${this.BASE_URL}/sync`,
                            body: [usItem]  //server expects an array...
                        });
                        if(!items) {
                            items = [];
                        }
                        items.push(returnedItems[0]);
                    } catch(e) {
                        //remove it from queue
                        const index = unSycedLocal.indexOf(usItem);
                        unSycedLocal.splice(index, 1);
                        //reset i, as it didn't succeed
                        i--;
                        continue;
                    }
                }
            }

            //something bad happend or in case of update, we don't need to update server ids
            if(items == null) {
                resolve();
                return;
            }
            
            try {
                const promises = [];
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
                // this.pubsubSvc.publishEvent(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    getUnSyncedLocal(): Promise<Array<IExpense>> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.expense);

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

    getExpenses(args?: { term?, fromDate?, toDate?, sync? }) {
        let body;

        if(args && (args.fromDate || args.toDate )) {
            //change date to utc first
            if(args.fromDate) {
                const fromDate = moment(args.fromDate).endOf('D').utc()
                    .format(AppConstant.DEFAULT_DATETIME_FORMAT);
                args.fromDate = fromDate;
            }
            if(args.toDate) {
                //if there is no time, add it...
                const toDate = moment(args.toDate).endOf('D').utc().format(AppConstant.DEFAULT_DATETIME_FORMAT);
                args.toDate = toDate;
            }
            
            body = { ...args };
        }
        return this.getData<IExpense[]>({
            url: `${this.BASE_URL}/getAll`,
            body: body
        });
    }

    getExpenseListLocal(args?: { term?, groupId?, fromDate?, toDate?, fromTime?, toTime?, pageIndex?, pageSize? })
        : Promise<IExpense[]> {
        return new Promise(async (resolve, reject) => {
            let results = [];
            const db = this.dbService.Db;
            // new ydn.db.IndexValueIterator(store, opt.key, key_range, (pageSize == 0 ? undefined : pageSize), (skip > 0 ? skip: undefined), false);
            //https://github.com/yathit/ydn-db/blob/8d217ba5ff58a1df694b5282e20ebc2c52104197/test/qunit/ver_1_iteration.js#L117
            //(store_name, key_range, reverse)
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.expense);
            
            // let idx = 0;
            let req = db.open(x => {
                let v: IExpense = x.getValue();
                
                let item: IExpense;
                if(args) {
                    if(args.fromDate || args.toDate) {
                        const createdOnUtcStr = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT);

                        if(args.fromDate && args.toDate) {
                            //change date to utc first
                            let fromDateCreatedOnUtc, toDateCreatedOnUtc, createdOnUtc;

                            if(args.fromTime) {
                                const fromTime = moment.utc(args.fromTime, AppConstant.DEFAULT_TIME_FORMAT)
                                    .format(AppConstant.DEFAULT_TIME_FORMAT)
                                    .split(':')
                                    .map(t => +t);
                                fromDateCreatedOnUtc = moment(args.fromDate)
                                    .set('hour', fromTime[0])
                                    .set('minute', fromTime[1])
                                    // .set('second', 0)
                                    .utc()
                                    .format(AppConstant.DEFAULT_DATETIME_FORMAT);
                                createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATETIME_FORMAT);
                            } else {
                                fromDateCreatedOnUtc = moment.utc(args.fromDate).format(AppConstant.DEFAULT_DATE_FORMAT);
                                createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT);
                            }

                            if(args.toTime) {
                                const toTime = moment.utc(args.toTime, AppConstant.DEFAULT_TIME_FORMAT)
                                    .format(AppConstant.DEFAULT_TIME_FORMAT)
                                    .split(':')
                                    .map(t => +t);
                                toDateCreatedOnUtc = moment.utc(args.toDate)
                                    .set('hour', toTime[0])
                                    .set('minute', toTime[1])
                                    .format(AppConstant.DEFAULT_DATETIME_FORMAT);
                                createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATETIME_FORMAT);
                            } else {
                                toDateCreatedOnUtc = moment.utc(args.toDate).format(AppConstant.DEFAULT_DATE_FORMAT);;
                                createdOnUtc = moment.utc(v.createdOn).format(AppConstant.DEFAULT_DATE_FORMAT);
                            }

                            if(createdOnUtc >= fromDateCreatedOnUtc 
                                && createdOnUtc <= toDateCreatedOnUtc) {
                                item = v;
                            }
                        } else if (args.fromDate) {
                            //change date to utc first
                            const fromDateCreatedOnUtc = moment.utc(args.fromDate).format(AppConstant.DEFAULT_DATE_FORMAT);
                            if(createdOnUtcStr >= fromDateCreatedOnUtc) {
                                item = v;
                            }
                        } else if (args.toDate) {
                            //change date to utc first
                            const toDateCreatedOnUtc = moment.utc(args.toDate).format(AppConstant.DEFAULT_DATE_FORMAT);
                            if(createdOnUtcStr <= toDateCreatedOnUtc) {
                                item = v;
                            } 
                        }
                    }

                    if(item && args.term) {
                        const term = args.term.toLowerCase();
                        const desc = item ? item.description.toLowerCase() : v.description.toLowerCase();
                        const catName = item ? item.category.name.toLowerCase() : v.category.name.toLowerCase();
                        
                        if(!desc.includes(term) && !(catName.includes(term))) {
                            item = null;
                        }
                    }

                    if(item) {
                        //either show grouped or non-grouped or explicilty set groupId to null (e.g in dashboard)
                        if(args.groupId) {
                            if(!item.group) {
                                item = null;
                            } else if(item.group.id != args.groupId) {
                                item = null;
                            }
                        } else if(args.groupId === null) {
                            //do not show goruped items if null is passed
                            if(item.group) {
                                item = null;
                            }
                        }
                    }
                } else {
                    item = v;
                }

                if(item) {
                    //do not show deleted...
                    if(!item.markedForDelete) {
                        results.push(item);
                    }
                }

                req.done();
                // idx++;
                // console.log(idx);
            }, iter);
            req.always(async () => {
                results = await this._mapAll(results);
                results = this._sort(results);                    
                
                //check for pagesize
                if(args && args.pageSize && results.length > args.pageSize) {
                    results = results.slice(0, args.pageSize);
                }
                resolve(results);
            });
        });
    }

    getReport(fromDate: string, toDate: string, totalItems = 10) {
        const fromDateUtc = moment.utc(fromDate, AppConstant.DEFAULT_DATE_FORMAT)
            .format(AppConstant.DEFAULT_DATE_FORMAT);
        const toDateUtc = moment.utc(toDate, AppConstant.DEFAULT_DATE_FORMAT)
            .format(AppConstant.DEFAULT_DATE_FORMAT);

        const body = {
            fromDate: fromDateUtc,
            toDate: toDateUtc,
            totalItems: totalItems
        };
        return this.getData<IExpenseDashboardReport>({
            url: `${this.BASE_URL}/getReport`,
            body: body
        });
    }

    getReportLocal(fromDate: string, toDate: string, totalItems = 10): Promise<IExpenseDashboardReport> {
        return new Promise((resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.expense);

            const items = [];
            let req = db.open(x => {
                let e: IExpense = x.getValue();
                const fromDateUtc = moment.utc(fromDate, AppConstant.DEFAULT_DATE_FORMAT).format(AppConstant.DEFAULT_DATE_FORMAT);
                const toDateUtc = moment.utc(toDate, AppConstant.DEFAULT_DATE_FORMAT).format(AppConstant.DEFAULT_DATE_FORMAT);
                const createdOnUtc = moment(e.createdOn, AppConstant.DEFAULT_DATE_FORMAT).format(AppConstant.DEFAULT_DATE_FORMAT);

                if (createdOnUtc >= fromDateUtc && createdOnUtc <= toDateUtc) {
                    items.push(e);
                }
            }, iter);

            req.always(() => {
                let result: { categories, dates };

                const catGroup = items.groupBy((i: IExpense) => {
                    return i.category.id.toString();
                });
                let categories = [];
                let i = 0;
                for(let cat in catGroup) {
                    if(i == totalItems) {
                        break;
                    }

                    const sum = (<IExpense[]>catGroup[cat]).reduce((a, b) => a + (+b.amount), 0);
                    categories.push({
                        label: catGroup[cat][0].category.name,
                        total: catGroup[cat].length,
                        totalAmount: sum
                    });
                    i++;
                } 
                //order by...
                categories = categories.sort((a, b) => {
                    return a.total - b.total;
                });

                let dates = [];
                const dateGroup = items.groupBy((i: IExpense) => {
                    return moment(i.createdOn).local().format(AppConstant.DEFAULT_DATE_FORMAT);
                });
                for(let dat in dateGroup) {
                    const sum = (<IExpense[]>dateGroup[dat]).reduce((a, b) => a + (+b.amount), 0);
                    // const createdOn = moment(dateGroup[dat][0].createdOn).format(AppConstant.DEFAULT_DATE_FORMAT);

                    dates.push({
                        // label: createdOn,
                        label: dat,
                        total: dateGroup[dat].length,
                        totalAmount: sum
                    });
                } 
                //order by...
                dates = dates.sort((a, b) => {
                    return moment(b.label).diff(a.label);
                });

                result = {
                    categories: categories,
                    dates: dates
                }
                resolve(result);
            });
        });
    }

    getByIdLocal(id) {
        return this.dbService.get<IExpense>(this.schemaSvc.tables.expense, id);
    }

    async putLocal(item: IExpense, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        //defaults
         if(!ignoreDefaults) {
            if(typeof item.markedForAdd === 'undefined' 
                && typeof item.markedForUpdate === 'undefined' 
                && typeof item.markedForDelete === 'undefined') {
                item.markedForAdd = true;
            }

            if(item.markedForAdd && !item.createdOn) {
                item.createdOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            } else if((item.markedForUpdate || item.markedForDelete) && !item.updatedOn) {
                item.updatedOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }

            //added item can't be marked for update or delete...
            if((item.markedForAdd && item.markedForUpdate) || (item.markedForAdd && item.markedForDelete)) {
                item.markedForUpdate = false;
                item.markedForDelete = false;
            }
        }

        //push attachment only in case of Add/Edit, ignore in delete
        // if(item.attachment) {
        //     if(item.attachment.markedForAdd || item.attachment.markedForUpdate) {
        //         const res = await this.attachmentSvc.putLocal(item.attachment);
        //         item.attachment.id = +res.insertId;
        //     }
        // }
        
        let createdOn;
        //if there is no time, add it...
        const crOnTime = moment(item.createdOn).format(AppConstant.DEFAULT_TIME_FORMAT) != '00:00';
        if(!crOnTime) {
            createdOn = `${item.createdOn} ${moment().format(AppConstant.DEFAULT_TIME_FORMAT + ":ss")}`;
        } else {
            createdOn = item.createdOn;
        }
        //to utc
        item.createdOn = moment(createdOn).utc().toISOString();
        if(item.updatedOn) {
            item.updatedOn = moment(item.updatedOn).utc().toISOString();
        }

        return this.dbService.putLocal(this.schemaSvc.tables.expense, item)
        .then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.pubsubSvc.publishEvent(AppConstant.EVENT_EXPENSE_CREATED_OR_UPDATED, item);
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
        return this.dbService.remove(this.schemaSvc.tables.expense, id);
    }

    removeAll() {
        return this.dbService.removeAll(this.schemaSvc.tables.expense);
    }

    private _addQueuePattern(items: IExpense[]) {
        items.map(item => {
            item['queuePattern'] = `${this.schemaSvc.tables.expense}_${item.amount}_${item.createdOn}`;
            return item;
        });
    }

    private _findInQueue(item: IExpense) {
        return this.findInQueue(`${this.schemaSvc.tables.expense}_${item.amount}_${item.createdOn}`);
    }

    private _mapAll(expenses: Array<IExpense>) {
        const result = expenses.map(async (e) => {
            const exp = await this._map(e);
            return exp;
        });
        return Promise.all(result);
    }

    private async _map(e: IExpense) {
        //only convert dates for data that came from server
        // if(!e.markedForAdd && !e.markedForUpdate && !e.markedForDelete) {
            e.createdOn = moment(e.createdOn).local().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            if(e.updatedOn) {
                e.updatedOn = moment(e.updatedOn).local().format(AppConstant.DEFAULT_DATETIME_FORMAT);
            }
        // }

        //if expense is in a group and have transactions, 
        //then consider grabing current user transaction as an expense
        // if(e.group) {
        //     const cu = await this.userSettingSvc.getUserProfileLocal();
        //     const cuTran = e.transactions.filter(t => t.email == cu.email)[0];
        //     if(cuTran) {
        //         if(cuTran.debit) {
        //             e.amount = cuTran.debit.toString();
        //         } else {
        //             //remove this transaction from showing as this isn't expense, its a credit
        //             return;
        //         }
        //     }
        // }
        return e;
    }

    private _sort(expenses: Array<IExpense>) {
        // expenses.sort((aDate: IExpense, bDate: IExpense) => {
        //     // Turn your strings into dates, and then subtract them
        //     // to get a value that is either negative, positive, or zero.
        //     const a = moment(`${aDate.createdOn} ${aDate.createdOn}`, AppConstant.DEFAULT_DATETIME_FORMAT);
        //     const b = moment(`${bDate.createdOn} ${bDate.createdOn}`, AppConstant.DEFAULT_DATETIME_FORMAT);

        //     //The following also takes seconds and milliseconds into account and is a bit shorter.
        //     return b.valueOf() - a.valueOf();
        // });
        
        //by id first
        expenses.sort((a, b) => b.id - a.id);
        //then by date
        expenses = expenses.sort((aDate: IExpense, bDate: IExpense) => {
            return moment(bDate.createdOn).diff(aDate.createdOn);
        });

        return expenses;
    }
}