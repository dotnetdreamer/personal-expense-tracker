import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { AppConstant } from './app-constant';
import { DbService } from './db.service';
import { SchemaService } from './schema.service';
import { AppSettingService } from './app-setting.service';
import { AppInjector } from './app-injector';
import { HelperService } from './helper.service';
import { LocalizationService } from './localization.service';

@Injectable({
    providedIn: 'root'
})
export class BaseService {
    protected http: HttpClient;
    protected dbService: DbService;
    protected schemaService: SchemaService;
    protected appSettingService: AppSettingService;
    protected helperSvc: HelperService;
    protected localizationSvc: LocalizationService;

    constructor() {
        const injector = AppInjector.getInjector();

        this.http = injector.get(HttpClient);
        this.dbService = injector.get(DbService);
        this.schemaService = injector.get(SchemaService);
        this.appSettingService = injector.get(AppSettingService);
        this.helperSvc = injector.get(HelperService);
        this.localizationSvc = injector.get(LocalizationService);
    }

    private async prepareHeaders(ignoreContentType?) {
        let headers = new HttpHeaders();
        if(!ignoreContentType) {
            headers = headers.append('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');            
        }
        return headers;
    }

    private handleError(errorObj, errorHandler?) {
        console.log(errorObj);
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