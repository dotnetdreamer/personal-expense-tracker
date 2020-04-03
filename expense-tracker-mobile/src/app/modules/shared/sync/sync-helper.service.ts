import { Injectable } from "@angular/core";

import { SyncEntity } from './sync.model';
import { CategoryService } from '../../category/category.service';
import { EventPublisher } from '../event-publisher';
import { SyncConstant } from './sync-constant';
import { ExpenseService } from '../../expense/expense.service';
import { AppConstant } from '../app-constant';
import { AttachmentService } from '../../attachment/attachment.service';


@Injectable({
    providedIn: 'root'
})
export class SyncHelperService {
    constructor(private eventPub: EventPublisher
        , private categorySvc: CategoryService, private expenseSvc: ExpenseService
        , private attachmentSvc: AttachmentService) {
    }

    pull(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            const promises: Array<Promise<any>> = [];

            if(table) {
                switch(table) {
                    case SyncEntity.Category:
                        promises.push(this.categorySvc.pull());
                    break;
                    case SyncEntity.Attachment:
                        // promises.push(this.attachmentSvc.pull());
                    break;
                    case SyncEntity.Expense:
                        promises.push(this.expenseSvc.pull());
                    break;
                    default:
                    break;
                }
            } else {   //sync all
                //category
                promises.push(this.categorySvc.pull());
                //attachment
                // promises.push(this.attachmentSvc.pull());
                //expense
                promises.push(this.expenseSvc.pull());
            }
            
            try {
                await Promise.all(promises);
                resolve();
            } catch(e) {
                reject(e);
            } finally {
                this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PULL_COMPLETE);
            }
        });
    }
    
    push(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            let promises: Array<Promise<any>> = [];
            if(table) {
                switch(table) {
                    case SyncEntity.Category:
                        promises.push(this.categorySvc.push());
                    break;
                    case SyncEntity.Attachment:
                        promises.push(this.attachmentSvc.push());
                    break;
                    case SyncEntity.Expense:
                        promises.push(this.expenseSvc.push());
                    break;
                    default:
                    break;
                }
            } else {   //sync all
                //category
                promises.push(this.categorySvc.push());
                //attachment
                promises.push(this.attachmentSvc.push());
                //expense
                promises.push(this.expenseSvc.push());
            }
            
            if(!promises.length) {
                resolve();
                return;
            }

            try {
                await Promise.all(promises);
                resolve();
            } catch (e) {
                resolve(e);
            } finally {
                this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, promises.length);
            }
        });
    }

}