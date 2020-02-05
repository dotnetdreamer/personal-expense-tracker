import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SchemaService {
    private _setting = "setting";
    private _category = "category";

    schema = {
        stores: [
            {
                name: this._category,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER' 
                }, { 
                    name: 'name', 
                    type: 'TEXT' 
                }, {
                    name: 'createdOn', 
                    type: 'TEXT'  
                }]
            }
            // , {
            //     name: this._setting,
            //     columns: ['key', 'value'],
            //     autoIncrement: false
            // }
        ]
    };
    tables = {
        // setting: this._setting,
        category: this._category
    };

    constructor() {

    }
}

export interface ITableOptions {
    name: string
    columns: Array<{ name, isPrimaryKey?, type? }>,
    autoIncrement?: boolean
}