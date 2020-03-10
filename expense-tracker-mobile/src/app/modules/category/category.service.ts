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

    async populate() {
        const categories: ICategory[] = [
            { groupName: '', name: 'General' },
            //Entertainment
            { groupName: 'Entertainment', name: 'Games' },
            { groupName: 'Entertainment', name: 'Movies' },
            { groupName: 'Entertainment', name: 'Music' },
            { groupName: 'Entertainment', name: 'Other' },
            { groupName: 'Entertainment', name: 'Sports' },
            //Food and Drink
            { groupName: 'Food and Drink', name: 'Dinning Out' },
        ];
        
        await this.putAll(categories);
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
            groupName: category.groupName,
            createdOn: category.createdOn
        });
    }

    async putAll(categories: ICategory[]) {
        const promises = [];
        categories.forEach(cat => {
            promises.push(this.put(cat));
        });

        await Promise.all(promises);
    }
}