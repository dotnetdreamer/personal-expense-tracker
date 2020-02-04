import { Injectable } from "@angular/core";

import { BaseService } from '../shared/base.service';

@Injectable({
    providedIn: 'root'
})
export class CategoryService extends BaseService {
    constructor() {
        super();
    }


    getCategoryList() {
        return this.dbService.getAll<Array<any>>(this.schemaService.tables.category);
    }
}