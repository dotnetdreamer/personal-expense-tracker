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

    protected getData<T>(args: HttpParams): Promise<T> {
        let headers: any = this.prepareHeaders(args); 

        args.body = args.body || {};  
        if(!args.overrideUrl) {
            let newUrl = `${AppConstant.BASE_API_URL + args.url}`;

            for(let prop in args.body) {
                if(args.body.hasOwnProperty(prop)) {
                    if(newUrl.includes('?')) {
                        newUrl += '&';
                    } else {
                        newUrl += '?';
                    }
                    newUrl += `${prop}=${args.body[prop]}`;
                }
            }   
            args.url = newUrl;
        }
        
        return new Promise((resolve, reject) => {
            this.http.get<T>(args.url, {
                headers: headers
            })
            .subscribe(result => {
                resolve(<T>result);
            }, error => {
                this.handleError(error, args);
                if(args.errorCallback) {
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
    }

    protected postData<T>(args: HttpParams): Promise<T> {
        let headers: HttpHeaders = this.prepareHeaders(args);

        let newUrl;
        if(!args.overrideUrl) {
            newUrl = `${AppConstant.BASE_API_URL + args.url}`;
        } else {
            newUrl = args.url;
        }

        // let data;
        // for(let prop in args.body) {
        //     if(args.body.hasOwnProperty(prop)) {
        //         if(data) {
        //             data += '&';
        //         } else {
        //             //initialize
        //             data = '';
        //         }
        //         data += `${prop}=${args.body[prop]}`;
        //     }
        // }   
        // args.body = data || {};   
        args.url = newUrl;

        return new Promise((resolve, reject) => {
            this.http.post<T>(args.url, args.body, {
                headers: headers
            })
            .subscribe(result => {
                resolve(<T>result);
            }, error => {
                this.handleError(error, args);
                if(args.errorCallback) {
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
    }

    protected handleError(e: HttpErrorResponse, args: HttpParams) {
        if(AppConstant.DEBUG) {
            console.log('BaseService: handleError', e);
        }
        if(!args.errorCallback) {
            let msg;
            //the error might be thrown by e.g a plugin wasn't install properly. In that case text() will not be available
            if(e.message) {
                msg = e.message;            
            } else {
                msg = e.error.toString();
            }
            // setTimeout(async () => {
            //     await this.helperSvc.alert(msg);
            // });
        } else {
            args.errorCallback(e, args);
        }
    }
    
    private prepareHeaders(args: HttpParams) {
        let headers = new HttpHeaders();
        if(!args.ignoreContentType) {
            headers = headers.append('Content-Type', 'application/json;charset=utf-8');            
        }
        return headers;
    }
}

export class HttpParams {
    url: string
    body?: any
    errorCallback?
    ignoreContentType?: boolean
    overrideUrl?: boolean
}