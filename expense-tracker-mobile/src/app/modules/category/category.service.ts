import { Injectable } from "@angular/core";

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { ICategory } from './category.model';
import { AppConstant } from '../shared/app-constant';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class CategoryService extends BaseService {
    private readonly BASE_URL = "category";

    constructor() {
        super();
    }

    
    pull() {
        return new Promise(async (resolve, reject) => {
            try {
                const items = await this.getCategoryList();
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

                    //find the difference and delete what's not in server (e.g deleted on server)
                    const localItems = await this.getCategoryListLocal();
                    const differItems = localItems.filter(li => !items.find(i => {
                        const dItem = li.id == i.id || (li.markedForAdd || li.markedForUpdate || li.markedForDelete)
                        return dItem;
                    }));
                    for(let d of differItems) {
                        await this.remove(d.id);
                    }
                }
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    push() {
        return new Promise(async (resolve, reject) => {
            const unSycedLocal = await this.getUnSyncedLocal();
            if(AppConstant.DEBUG) {
                console.log('CategoryService: sync: unSycedLocal items length', unSycedLocal.length);
            }

            if(!unSycedLocal.length) {
                resolve();
                return;
            }

            //server returns array of dictionary objects, each key in dict is the localdb id
            //we map the localids and update its serverid locally
            let items: Array<any>;
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

                        const pItem: ICategory = cp[item.id];
                        promises.push(this.putLocal(pItem, true, true));
                    } else if (item.markedForDelete) {
                        const promise = this.remove(item.id);
                        promises.push(promise);
                    }
                }

                //now make updates
                await Promise.all(promises);
                if(AppConstant.DEBUG) {
                    console.log('CategoryService: sync: complete');
                }
                // this.pubsubSvc.publishEvent(AppConstant.EVENT_CATEGORY_CREATED_OR_UPDATED);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    getUnSyncedLocal(): Promise<Array<ICategory>> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.category);

            const unSynced = [];
            let req = db.open(x => {
                let v: ICategory = x.getValue();
                if (v.markedForAdd || v.markedForUpdate || v.markedForDelete) {
                    unSynced.push(v);
                }
            }, iter);
            req.always(() => {
                resolve(unSynced);
            });
        });
    }

    getCategoryList() {
        return this.getData<ICategory[]>({ url: `${this.BASE_URL}/getAll` });
    }

    getCategoryListLocal(): Promise<ICategory[]> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.category);

            const items = [];
            let req = db.open(x => {
                let v: ICategory = x.getValue();
                if (!v.markedForDelete) {
                    items.push(v);
                }
            }, iter);
            req.always(() => {
                resolve(items);
            });
        });
    }

    getByIdLocal(categoryId) {
        return this.dbService.get<ICategory>(this.schemaSvc.tables.category, categoryId);
    }

    putLocal(item: ICategory, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        //defaults
        if(!ignoreDefaults) {
            if(typeof item.markedForAdd === 'undefined' 
                && typeof item.markedForUpdate === 'undefined' && typeof item.markedForDelete === 'undefined') {
                item.markedForAdd = true;
            }

            if(item.markedForAdd && !item.createdOn) {
                item.createdOn = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
            } else if((item.markedForUpdate || item.markedForDelete) && !item.updatedOn) {
                item.updatedOn = moment().format(AppConstant.DEFAULT_DATE_FORMAT);
            }

            //added item can't be marked for update or delete...
            if((item.markedForAdd && item.markedForUpdate) || (item.markedForAdd && item.markedForDelete)) {
                item.markedForUpdate = false;
                item.markedForDelete = false;
            }
        }

        //to utc
        item.createdOn = moment(item.createdOn).utc().toISOString();
        if(item.updatedOn) {
            item.updatedOn = moment(item.updatedOn).utc().toISOString();
        }

        return this.dbService.putLocal(this.schemaSvc.tables.category, item).then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.pubsubSvc.publishEvent(AppConstant.EVENT_CATEGORY_CREATED_OR_UPDATED, item);
            }
            return affectedRows;
        });
    }
    
    putAllLocal(categories: ICategory[], ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        return new Promise(async (resolve, reject) => {
            const promises = [];

            for(let cat of categories) {
                promises.push(this.putLocal(cat, ignoreFiringEvent, ignoreDefaults));
            }

            await Promise.all(promises);
            resolve();
        });
    }

    remove(id) {
        return this.dbService.remove(this.schemaSvc.tables.category, id);
    }


    removeAll() {
        return this.dbService.removeAll(this.schemaSvc.tables.category);
    }

    count() {
        return this.dbService.count(this.schemaSvc.tables.category);
    }
}