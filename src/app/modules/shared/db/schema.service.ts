import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SchemaService {
    private _setting = "setting";
    private _category = "category";
    private _expense = "expense";

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
            }, {
                name: this._expense,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER' 
                }, { 
                    name: 'title', 
                    type: 'TEXT' 
                }, { 
                    name: 'amount', 
                    type: 'TEXT' 
                }, { 
                    name: 'description', 
                    type: 'TEXT' 
                }, {
                    name: 'createdOn', 
                    type: 'TEXT'  
                }]
            }, {
                name: this._setting,
                columns: [{ 
                    name: 'key', 
                    isPrimaryKey: true, 
                    type: 'TEXT' 
                }, {
                    name: 'value', 
                    type: 'TEXT'  
                }],              
                // autoIncrement: false
            }
        ]
    };
    tables = {
        setting: this._setting,
        category: this._category,
        expense: this._expense
    };

    constructor() {

    }
}

export interface ITableOptions {
    name: string
    columns: Array<{ name, isPrimaryKey?, type? }>,
    autoIncrement?: boolean
}