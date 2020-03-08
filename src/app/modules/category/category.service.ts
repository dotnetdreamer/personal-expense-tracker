import { Injectable } from "@angular/core";

import * as moment from 'moment';

import { BaseService } from '../shared/base.service';
import { ICategory } from './category.model';
import { AppConstant } from '../shared/app-constant';

@Injectable({
    providedIn: 'root'
})
export class CategoryService extends BaseService {
    constructor() {
        super();
    }


    getCategoryList() {
        return this.dbService.getAll<Array<ICategory>>(this.schemaService.tables.category);
    }

    getCategoryById(categoryId) {
        return this.dbService.get<ICategory>(this.schemaService.tables.category, categoryId);
    }

    put(category: ICategory) {
        if(!category.createdOn) {
            category.createdOn = moment().format(AppConstant.DEFAULT_DATETIME_FORMAT);
        }

        return this.dbService.put(this.schemaService.tables.category, {
            name: category.name,
            createdOn: category.createdOn
        });
    }
}