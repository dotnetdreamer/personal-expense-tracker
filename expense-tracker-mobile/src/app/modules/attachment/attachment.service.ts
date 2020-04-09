import { Injectable } from "@angular/core";
import { HttpHeaders } from '@angular/common/http';

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { IAttachment } from './attachment.model';
import { AppConstant } from '../shared/app-constant';
import { SyncEntity } from '../shared/sync/sync.model';
import { SyncConstant } from '../shared/sync/sync-constant';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class AttachmentService extends BaseService {
    private readonly BASE_URL = "attachment";

    constructor() {
        super();
    }

    push(dependantDataOptions?: { data: any[], successCallback: (updatedData: any[]) => void }) {
        return new Promise(async (resolve, reject) => {
            let unSycedLocal = await this.getUnSyncedLocal();
            if(AppConstant.DEBUG) {
                console.log('AttachmentService: sync: unSycedLocal items length', unSycedLocal.length);
            }

            if(!unSycedLocal.length) {
                resolve();
                return;
            }

            unSycedLocal = unSycedLocal.map((ul) => {
                //not a path e.g in update or delete
                if(typeof ul.attachment != 'string') {
                    //binary
                    let blob = new Blob([ul.attachment], { type: ul.contentType });
                    ul.attachment = blob;
                }
                return ul;
            });

            let formData = new FormData();
            for (let i = 0; i < unSycedLocal.length; i++) { 
                const item = unSycedLocal[i]; 
                for (const prop in item) { 
                    if(prop == 'attachment' && typeof item[prop] !== 'string') {
                        formData.append(`files[]`, item.attachment, `${item.guid}.${item.extension}`); 
                    } else {
                        formData.append(`attachments[${i}][${prop}]`, item[prop]); 
                    }
                }
            }

            // let headers = new HttpHeaders();
            // headers = headers.append('Content-Type', 'multipart/form-data');

            //server returns array of dictionary objects, each key in dict is the localdb id
            //we map the localids and update its serverid locally
            let items: Array<any>;
            try {
                items = await this.postData<any[]>({
                    url: `${this.BASE_URL}/sync`,
                    body: formData,
                    ignoreContentType: true,
                    // httpHeaders: headers
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

                        const pItem: IAttachment = cp[item.id];
                        const pro = this.putLocal(pItem, true, true)
                            .then(async (args: any) => {
                                //now update the dependent records as well
                                await this._dependentDataCallback(item, dependantDataOptions, args);
                                return args;
                            });
                        promises.push(pro);
                    } else if (item.markedForDelete) {
                        const promise = this.remove(item.id)
                        .then(async (deletedItemId) => {
                            //now update the dependent records as well
                            await this._dependentDataCallback(item, dependantDataOptions);
                        });
                        promises.push(promise);
                    }
                }

                //now make updates
                await Promise.all(promises);
                if(AppConstant.DEBUG) {
                    console.log('AttachmentService: sync: complete');
                }
                //attachments have always dependents from other entities..let's push them
                this.pubsubSvc.publishEvent(SyncConstant.EVENT_SYNC_DATA_PUSH);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    async putLocal(item: IAttachment
        , ignoreFiringEvent?: boolean
        , ignoreDefaults?: boolean) {
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

        return this.dbService.putLocal(this.schemaSvc.tables.attachment, item)
        .then((insertId) => {
            if(!ignoreFiringEvent) {
                this.pubsubSvc.publishEvent(AppConstant.EVENT_ATTACHMENT_CREATED_OR_UPDATED, item);
            }
            return {
                insertId: insertId
            };
        });
    }

    putAllLocal(items: IAttachment[], ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
        return new Promise(async (resolve, reject) => {
            const promises = [];

            for(let item of items) {
                promises.push(this.putLocal(item, ignoreFiringEvent, ignoreDefaults));
            }

            await Promise.all(promises);
            resolve();
        });
    }

    getUnSyncedLocal(): Promise<Array<IAttachment>> {
        return new Promise(async (resolve, reject) => {
            const db = this.dbService.Db;
            const iter = new ydn.db.ValueIterator(this.schemaSvc.tables.attachment);

            const unSynced = [];
            let req = db.open(x => {
                let v: IAttachment = x.getValue();
                if (v.markedForAdd || v.markedForUpdate || v.markedForDelete) {
                    unSynced.push(v);
                }
            }, iter);
            req.always(() => {
                resolve(unSynced);
            });
        });
    }

    getByIdLocal(id) {
        return this.dbService.get<IAttachment>(this.schemaSvc.tables.attachment, id);
    }

    remove(id) {
        return this.dbService.remove(this.schemaSvc.tables.attachment, id);
    }

    removeAll() {
        return this.dbService.removeAll(this.schemaSvc.tables.attachment);
    }

    private async _dependentDataCallback(item: IAttachment
        , dependantDataOptions?: { data: any[], successCallback: (updatedData: any[]) => void }
        , args?: { rowsAffected: any, insertId: any }) {
        if(dependantDataOptions && dependantDataOptions.data.length) {
            const updatedData = [];

            for(let a = 0; a < dependantDataOptions.data.length; a++) {
                const dd = dependantDataOptions.data[a];
                if(dd.attachment.id == item.id) {
                    if(dd.attachment.markedForAdd || dd.attachment.markedForUpdate) {
                        const id = args.insertId;
                        const updatedAttachment = await this.getByIdLocal(id);
                        dd.attachment = updatedAttachment;
                    } else if(dd.attachment.markedForDelete) {
                        dd.attachment = null;
                    }
                }
                updatedData.push(dd);
            }
            dependantDataOptions.successCallback(updatedData);
        }
    }
}