import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SchemaService {
    private _setting = "setting";
    private _category = "category";
    private _group = "group";
    private _expense = "expense";
    private _attachment = "attachment";
    private _user = "user";

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
                    name: 'groupName', 
                    type: 'TEXT' 
                }, { 
                    name: 'icon', 
                    type: 'TEXT' 
                }, { 
                    name: 'updatedOn', 
                    type: 'TEXT' 
                }, {
                    name: 'createdOn', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForAdd', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForUpdate', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForDelete', 
                    type: 'TEXT'  
                }]
            }, {
                name: this._group,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER' 
                }, { 
                    name: 'name', 
                    type: 'TEXT' 
                }, { 
                    name: 'guid', 
                    type: 'TEXT' 
                }, { 
                    name: 'entityName', 
                    type: 'TEXT' 
                }, { 
                    name: 'updatedOn', 
                    type: 'TEXT' 
                }, {
                    name: 'createdOn', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForAdd', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForUpdate', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForDelete', 
                    type: 'TEXT'  
                }]
            }, {
                name: this._expense,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER' 
                }, {
                    name: 'categoryId', 
                    type: 'INTEGER' 
                }, { 
                    name: 'amount', 
                    type: 'TEXT' 
                }, { 
                    name: 'description', 
                    type: 'TEXT' 
                }, { 
                    name: 'notes', 
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
            }, {
                name: this._attachment,
                columns: [{ 
                    name: 'id', 
                    isPrimaryKey: true, 
                    type: 'INTEGER'
                }, {
                    name: 'contentType',
                    type: 'TEXT'
                }, {
                    name: 'filename',
                    type: 'TEXT'
                }, {
                    name: 'extension',
                    type: 'TEXT'
                }, {
                    name: 'guid',
                    type: 'TEXT'
                }, {
                    name: 'attachment',
                    type: 'BLOB'
                }, { 
                    name: 'updatedOn', 
                    type: 'TEXT' 
                }, {
                    name: 'createdOn', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForAdd', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForUpdate', 
                    type: 'TEXT'  
                }, {
                    name: 'markedForDelete', 
                    type: 'TEXT'  
                }]
            }, {
                name: this._user,
                columns: [{ 
                    name: 'email', 
                    isPrimaryKey: true, 
                    type: 'TEXT'
                }, {
                    name: 'name',
                    type: 'TEXT'
                }, {
                    name: 'photo',
                    type: 'TEXT'
                }, {
                    name: 'mobile',
                    type: 'TEXT'
                }, {
                    name: 'uuid',
                    type: 'TEXT'
                }]
            }
        ]
    };
    tables = {
        setting: this._setting,
        category: this._category,
        group: this._group,
        expense: this._expense,
        attachment: this._attachment,
        user: this._user
    };

    constructor() {

    }
}

export interface ITableOptions {
    name: string
    columns: Array<{ name, isPrimaryKey?, type? }>,
    autoIncrement?: boolean
}