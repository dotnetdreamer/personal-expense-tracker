import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { Platform } from '@ionic/angular';
import { Observable} from "rxjs";

import { AppConstant } from './app-constant';
import { EventPublisher } from './event-publisher';
import { DbService } from './db/db-base.service';
import { AppInjector } from './app-injector';
import { DbSqlService } from './db/db-sql.service';
import { DbWebService } from './db/db-web.service';

@Injectable({
    providedIn: 'root'
})
export class StartupResolver implements Resolve<any> {
    private _isDbReady = false;

    constructor(private platform: Platform
        , private eventPub: EventPublisher) {
        //subscribe first...
+        this.eventPub.$sub(AppConstant.EVENT_DB_INITIALIZED, () => {
            this._isDbReady = true;
            if(AppConstant.DEBUG) {
                console.log('Event received: EVENT_DB_INITIALIZED');
            }
        });

        const injector = AppInjector.getInjector();
        
        let dbService: DbService;
        if(this.platform.is('cordova')) {
            dbService = injector.get(DbSqlService);
        } else {
            dbService = injector.get(DbWebService);
        }

        //db
        //already called in consturction of dbService...
        // dbService.initializeDb();
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