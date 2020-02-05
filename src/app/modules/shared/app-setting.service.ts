import { Injectable } from '@angular/core';

import { Platform } from '@ionic/angular';

import { DbService } from './db/db-base.service';
import { DbSqlService } from './db/db-sql.service';
import { SchemaService } from './db/schema.service';
import { AppConstant } from './app-constant';
import { AppInjector } from './app-injector';

@Injectable({
    providedIn: 'root'
})
export class AppSettingService {
    protected static settingCache = new Map();
    

    protected dbService: DbService;
    protected schemaService: SchemaService;
 
    constructor(private platform: Platform) {
        // https://blogs.msdn.microsoft.com/premier_developer/2018/06/17/angular-how-to-simplify-components-with-typescript-inheritance/
        const injector = AppInjector.getInjector();
        
        if(this.platform.is('cordova')) {
            this.dbService = injector.get(DbSqlService);
        } else {
            this.dbService = injector.get(DbSqlService);
        }
        this.schemaService = injector.get(SchemaService);
    }

    getWorkingLanguage() {
        return new Promise((resolve, reject) => resolve('en'));
    }
}