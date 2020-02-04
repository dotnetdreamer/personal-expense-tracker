import { Injectable } from '@angular/core';

import { DbService } from './db.service';
import { SchemaService } from './schema.service';
import { AppConstant } from './app-constant';
import { AppInjector } from './app-injector';

@Injectable({
    providedIn: 'root'
})
export class AppSettingService {
    protected static settingCache = new Map();
    

    protected dbService: DbService;
    protected schemaService: SchemaService;
 
    constructor() {
        // https://blogs.msdn.microsoft.com/premier_developer/2018/06/17/angular-how-to-simplify-components-with-typescript-inheritance/
        const injector = AppInjector.getInjector();

        this.dbService = injector.get(DbService); 
        this.schemaService = injector.get(SchemaService);
    }

    getWorkingLanguage() {
        return new Promise((resolve, reject) => resolve('en'));
    }
}