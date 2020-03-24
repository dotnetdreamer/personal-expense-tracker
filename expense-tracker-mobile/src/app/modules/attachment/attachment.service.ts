import { Injectable } from "@angular/core";
import { HttpHeaders } from '@angular/common/http';

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { IAttachment } from './attachment.model';
import { AppConstant } from '../shared/app-constant';
import { MediaOptionType } from '../shared/media/media.model';

declare const ydn: any;

@Injectable({
    providedIn: 'root'
})
export class AttachmentService extends BaseService {
    private readonly BASE_URL = "attachment";

    constructor() {
        super();
    }

    push() {
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
                let blob = new Blob([ul.attachment], { type: ul.contentType });
                ul.attachment = blob;

                return ul;
            });

            let formData = new FormData();
            // for (let i = 0; i < unSycedLocal.length; i++) { 
            //     const myItemInArr = unSycedLocal[i]; 
            //     for (const prop in myItemInArr) { 
            //         formData.append(`attachments[${i}][${prop}]`, myItemInArr[prop]); 
            //     }
            // }
            unSycedLocal.forEach((file) => {
                formData.append('files[]', file.attachment, file.filename);
            });

            let headers = new HttpHeaders();
            headers = headers.append('Content-Type', 'multipart/form-data');
            //server returns array of dictionary objects, each key in dict is the localdb id
            //we map the localids and update its serverid locally
            const items = await this.postData<any[]>({
                url: `${this.BASE_URL}/sync`,
                body: formData,
                ignoreContentType: true,
                // httpHeaders: headers
            });
            
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
                        promises.push(this.putLocal(pItem, true, true));
                    } else if (item.markedForDelete) {
                        const promise = this.remove(item.id);
                        promises.push(promise);
                    }
                }

                //now make updates
                await Promise.all(promises);
                if(AppConstant.DEBUG) {
                    console.log('AttachmentService: sync: complete');
                }
                // this.eventPub.$pub(AppConstant.EVENT_ATTACHMENT_CREATED_OR_UPDATED);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    async putLocal(item: IAttachment, ignoreFiringEvent?: boolean, ignoreDefaults?: boolean) {
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

        return this.dbService.putLocal(this.schemaService.tables.attachment, item)
        .then((affectedRows) => {
            if(!ignoreFiringEvent) {
                this.eventPub.$pub(AppConstant.EVENT_ATTACHMENT_CREATED_OR_UPDATED, item);
            }
            return affectedRows;
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
            const iter = new ydn.db.ValueIterator(this.schemaService.tables.attachment);

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

    remove(id) {
        return this.dbService.remove(this.schemaService.tables.attachment, id);
    }

    removeAll() {
        return this.dbService.removeAll(this.schemaService.tables.attachment);
    }
}