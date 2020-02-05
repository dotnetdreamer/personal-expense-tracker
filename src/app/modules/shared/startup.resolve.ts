import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { Observable} from "rxjs";

import { AppConstant } from './app-constant';
import { DbService } from './db.service';
import { EventPublisher } from './event-publisher';

@Injectable({
    providedIn: 'root'
})
export class StartupResolver implements Resolve<any> {
    private _isDbReady = false;

    constructor(private eventPub: EventPublisher
        , private dbSvc: DbService) {
        this.eventPub.$sub(AppConstant.EVENT_DB_INITIALIZED, () => {
            this._isDbReady = true;
            if(AppConstant.DEBUG) {
                console.log('Event received: EVENT_DB_INITIALIZED');
            }
        });
        //db
        // this.dbSvc.initializeDb();
    }

    resolve(route: ActivatedRouteSnapshot, rState: RouterStateSnapshot): Observable<any> {
        return new Observable(s => {
            if(AppConstant.DEBUG) {
                console.log('checking initially ready', this._isDbReady);
            }
            if(this._isDbReady) {
                s.next();
                s.complete();
                return;
            }
            const delay = 25;
            //workaround: don't proceed unless platform is ready...wait everytime 100ms
            const _self = this;
            let timerId = setTimeout(async function request() { 
              if (!_self._isDbReady) {
                if(AppConstant.DEBUG) {
                    console.log('db not ready');
                }
                //retry
                timerId = setTimeout(request, delay);
              } else {
                timerId = null;
                if(AppConstant.DEBUG) {
                    console.log('db is ready');
                }
                s.next();
                s.complete();
              }
            }, delay);
        });
    }
}