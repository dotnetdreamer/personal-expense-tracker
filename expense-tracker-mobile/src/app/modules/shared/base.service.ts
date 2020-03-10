import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Platform } from '@ionic/angular';

import { AppConstant } from './app-constant';
import { DbService } from './db/db-base.service';
import { DbSqlService } from './db/db-sql.service';
import { SchemaService } from './db/schema.service';
import { AppSettingService } from './app-setting.service';
import { AppInjector } from './app-injector';
import { HelperService } from './helper.service';
import { LocalizationService } from './localization.service';
import { DbWebService } from './db/db-web.service'; 
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class BaseService {
    protected http: HttpClient;
    protected platform: Platform;
    protected dbService: DbService;
    protected schemaService: SchemaService;
    protected appSettingService: AppSettingService;
    protected helperSvc: HelperService;
    protected localizationSvc: LocalizationService;

    constructor() {
        const injector = AppInjector.getInjector();

        this.http = injector.get(HttpClient);
        this.platform = injector.get(Platform);
        this.schemaService = injector.get(SchemaService);
        this.appSettingService = injector.get(AppSettingService);
        this.helperSvc = injector.get(HelperService);
        this.localizationSvc = injector.get(LocalizationService);

        if(this.platform.is('cordova')) {
            this.dbService = injector.get(DbSqlService);
        } else {
            this.dbService = injector.get(DbWebService);
        }
    }

    protected async prepareHeaders(ignoreContentType?) {
        let headers = new HttpHeaders();
        if(!ignoreContentType) {
            headers = headers.append('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');            
        }
        return headers;
    }

    protected async handleError(errorObj: HttpErrorResponse, errorHandler?, 
        request?: Observable<any>, resolve?, reject?) {
        if(AppConstant.DEBUG) {
            console.log('BaseService: handleError', errorObj);
        }
        // let error = errorObj.error;
        if(!errorHandler) {
            // switch(errorObj.status) {
            //     case 401:

            //     break;
            // }
            //the error might be thrown by e.g a plugin wasn't install properly. In that case text() will not be available
            let errorText = null;    
            if((<HttpErrorResponse>errorObj).message) {
                errorText = (<HttpErrorResponse>errorObj).message;            
            }
            //let the caller handle the message
            // console.log(errorText);
            this.helperSvc.presentToast(errorText);          
        } else {
            errorHandler(errorObj);
        }
    }
}