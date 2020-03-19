import { Injectable } from "@angular/core";

import { SyncEntity } from './sync.model';
import { CategoryService } from '../../category/category.service';
import { EventPublisher } from '../event-publisher';
import { SyncConstant } from './sync-constant';


@Injectable({
    providedIn: 'root'
})
export class SyncHelperService {
    constructor(private eventPub: EventPublisher
        , private categorySvc: CategoryService) {
    }
    
    push(table?: SyncEntity) {
        return new Promise(async (resolve, reject) => {
            let promises: Array<Promise<any>> = [];
            if(table) {
                switch(table) {
                    case SyncEntity.Category:
                        promises.push(this.categorySvc.push());
                    break;
                    default:
                    break;
                }
            } else {   //sync all
                //category
                promises.push(this.categorySvc.push());
            }
            
            if(!promises.length) {
                resolve();
                return;
            }

            try {
                await Promise.all(promises);
                this.eventPub.$pub(SyncConstant.EVENT_SYNC_DATA_PUSH_COMPLETE, promises.length);

                resolve();
            } catch (e) {
                resolve(e);
            }
        });
    }

}