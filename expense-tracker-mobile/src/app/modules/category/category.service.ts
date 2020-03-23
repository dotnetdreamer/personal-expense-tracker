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
            // const products = await this.getTodayProducts();
            // if(products.length) {
            //     //remove all first
            //     await this.removeAll();
            //     //now add
            //     await this.putAllLocal(products, true, true);
            // }
            resolve();
            }catch (e) {
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
            const items = await this.postData<any[]>({
                url: `${this.BASE_URL}/sync`,
                body: unSycedLocal
            });
            
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
                // this.eventPub.$pub(AppConstant.EVENT_CATEGORY_CREATED_OR_UPDATED);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    getUnSyncedLocal(): Promise<Array<ICategory>> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaService.tables.category);

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

    async populate() {
        const items = await this.count();
        if(items > 0) {
            return;
        }
        
        const categories: ICategory[] = [
            { groupName: '', name: 'General', icon: 'newspaper-outline' },
            //Entertainment
            { groupName: 'Entertainment', name: 'Games', icon: 'game-controller-outline' },
            { groupName: 'Entertainment', name: 'Movies', icon: 'videocam-outline' },
            { groupName: 'Entertainment', name: 'Music', icon: 'musical-notes-outline' },
            { groupName: 'Entertainment', name: 'Other', icon: 'newspaper-outline' },
            { groupName: 'Entertainment', name: 'Sports', icon: 'football-outline' },
            //Food and Drink
            { groupName: 'Food and Drink', name: 'Dinning Out', icon: 'restaurant-outline' },
        ];
        
        await this.putAllLocal(categories, true, true);
    }

    getCategoryListLocal(): Promise<ICategory[]> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaService.tables.category);

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

    getCategoryByIdLocal(categoryId) {
        return this.dbService.get<ICategory>(this.schemaService.tables.category, categoryId);
    }

    putLocal(item: ICategory, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
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
            }
        }

        return this.dbService.putLocal(this.schemaService.tables.category, item).then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.eventPub.$pub(AppConstant.EVENT_CATEGORY_CREATED_OR_UPDATED, item);
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
        return this.dbService.remove(this.schemaService.tables.category, id);
    }

    // removeAll() {
    //     return this.dbService.removeAll(this.schemaService.tables.category);
    // }

    count() {
        return this.dbService.count(this.schemaService.tables.category);
    }
}