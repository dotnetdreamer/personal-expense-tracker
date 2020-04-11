import { Injectable } from "@angular/core";

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { IGroup } from './group.model';
import { AppConstant } from '../shared/app-constant';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class GroupService extends BaseService {
    private readonly BASE_URL = "group";

    constructor() {
        super();
    }
  
    pull() {
        return new Promise(async (resolve, reject) => {
            try {
                const items = await this.getGroupList();
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
            } catch (e) {
                reject(e);
            }
        });
    }

    push() {
        return new Promise(async (resolve, reject) => {
            const unSycedLocal = await this.getUnSyncedLocal();
            if(AppConstant.DEBUG) {
                console.log('GroupService: sync: unSycedLocal items length', unSycedLocal.length);
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

                        const pItem: IGroup = cp[item.id];
                        promises.push(this.putLocal(pItem, true, true));
                    } else if (item.markedForDelete) {
                        const promise = this.remove(item.id);
                        promises.push(promise);
                    }
                }

                //now make updates
                await Promise.all(promises);
                if(AppConstant.DEBUG) {
                    console.log('GroupService: sync: complete');
                }
                // this.pubsubSvc.publishEvent(AppConstant.EVENT_CATEGORY_CREATED_OR_UPDATED);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    getUnSyncedLocal(): Promise<Array<IGroup>> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.group);

            const unSynced = [];
            let req = db.open(x => {
                let v: IGroup = x.getValue();
                if (v.markedForAdd || v.markedForUpdate || v.markedForDelete) {
                    unSynced.push(v);
                }
            }, iter);
            req.always(() => {
                resolve(unSynced);
            });
        });
    }

    
    getGroupList() {
        return this.getData<IGroup[]>({ url: `${this.BASE_URL}/getAll` });
    }

    getGroupListLocal(): Promise<IGroup[]> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.group);

            const items = [];
            let req = db.open(x => {
                let v: IGroup = x.getValue();
                if (!v.markedForDelete) {
                    items.push(v);
                }
            }, iter);
            req.always(() => {
                resolve(items);
            });
        });
    }

    getByIdLocal(id) {
        return this.dbService.get<IGroup>(this.schemaSvc.tables.group, id);
    }

    async putLocal(item: IGroup, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
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

        //to utc
        item.createdOn = moment(item.createdOn).utc().toISOString();
        if(item.updatedOn) {
            item.updatedOn = moment(item.updatedOn).utc().toISOString();
        }

        return this.dbService.putLocal(this.schemaSvc.tables.group, item)
        .then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.pubsubSvc.publishEvent(AppConstant.EVENT_GROUP_CREATED_OR_UPDATED, item);
            }
            return affectedRows;
        });
    }

    putAllLocal(groups: IGroup[], ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        return new Promise(async (resolve, reject) => {
            const promises = [];

            for(let exp of groups) {
                promises.push(this.putLocal(exp, ignoreFiringEvent, ignoreDefaults));
            }

            await Promise.all(promises);
            resolve();
        });
    }

    remove(id) {
        return this.dbService.remove(this.schemaSvc.tables.group, id);
    }

    removeAll() {
        return this.dbService.removeAll(this.schemaSvc.tables.group);
    }
}