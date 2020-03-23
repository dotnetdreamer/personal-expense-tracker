import { Injectable } from '@angular/core';

import { Platform } from '@ionic/angular';

import { SchemaService, ITableOptions } from './schema.service';
import { AppConstant } from "../app-constant";
import { EventPublisher } from '../event-publisher';
import { DbService } from './db-base.service';

@Injectable({
    providedIn: 'root'
})
export class DbSqlService implements DbService {
    private _dbName: string = AppConstant.DB_NAME;
    private _db: any;
    private _isDbInitialized = false;

    constructor(private platform: Platform
        , private eventPub: EventPublisher, private schemaSvc: SchemaService) {
            this.platform.ready().then(async () => {
                // await this._deleteDatabase();
                this._db = !this.platform.is('cordova') ?
                    (<any>window).openDatabase(this._dbName, '1.0', 'Data', 2*1024*1024, () => this._dbSuccess(), (err) => this._dbError(err)) :
                    (<any>window).sqlitePlugin.openDatabase({ name: this._dbName, location: 'default' }, () => this._dbSuccess(), (err) => this._dbError(err));

                this.initializeDb();
            });
    }

    testDb() {
        this._db.transaction((tr) => {
            tr.executeSql('SELECT upper(?) AS upperString', ['Test string'], (tr, rs) => {
                console.log('Got upperString result: ' + rs.rows.item(0).upperString);
            });
        }); 
    }
 
    initializeDb() {   
        const delay = 50;
        //workaround: don't proceed unless db is initialized...wait everytime 50ms
        const _self = this;
        let timerId = setTimeout(async function request() { 
            if (!_self._isDbInitialized) {
                //retry
                timerId = setTimeout(request, delay);
            } else {  
                //clear timeout
                clearTimeout(timerId);
                timerId = null;
                
                if(AppConstant.DEBUG) {
                    console.log('Event firing: EVENT_DB_INITIALIZED');
                }

                await _self._prepareTables();
        
                // heavy database operations should start from this...
                _self.eventPub.$pub(AppConstant.EVENT_DB_INITIALIZED);
            }
        }, delay);
    }

    get Db() {
        return this._db;
    } 

    putLocal(store, data): Promise<{ rowsAffected, insertId }> {
        return new Promise(async (resolve, reject) => {
            let sql;
            const values = [];
            
            const total = await this.count(store);
            if(total) {
                //update
                sql = `UPDATE ${store} SET `;
                //columns
                for(let prop in data) {
                    if(data.hasOwnProperty(prop)) {
                        sql += `${prop}='${data[prop]}',`;
                    }
                }
                //remove extra ',' at the end
                sql = sql.substr(0, sql.length - 1);
            } else {
                //insert
                sql = `INSERT INTO ${store} `;
                //columns
                sql += `(`;
                for(let prop in data) {
                    if(data.hasOwnProperty(prop)) {
                        sql += `${prop},`;
                    }
                }
                //remove extra ',' at the end
                sql = sql.substr(0, sql.length - 1);
                sql += `)`;

                //values
                sql += ` VALUES (`;
                for(let prop in data) {
                    sql += `?,`;
                    values.push(data[prop]);
                }
                sql = sql.substr(0, sql.length - 1);
                sql += `)`;
            }

            if(AppConstant.DEBUG) {
                console.log('DbService: put: sql:', sql);
            }     
            this._db.transaction(async (tx) => {           
                const res = await this._executeSql<{ rowsAffected, insertId }>(tx, sql, values);
                resolve(res);
            }, (error) => reject(error));
        });
    }

    get<T>(store: string, key: any): Promise<T> {
        return new Promise((resolve, reject) => {
            //get primary key field form schema
            const table:any = this.schemaSvc.schema.stores.filter(s => s.name === store)[0];
            const pk = (table.columns.filter(c => c.isPrimaryKey)[0]).name;

            let sql = `SELECT * FROM ${store} WHERE ${pk} = '${key}' LIMIT 1`;

            this._db.transaction(async (tx) => {    
                let data;
                const res = await this._executeSql<any>(tx, sql);
                if(res.rows.length) {
                    data = res.rows.item(0);
                }
                resolve(data);
            }, (error) => reject(error));
        });
    }

    getAll<T>(store: string): Promise<T> {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM ${store} `;

            this._db.transaction(async (tx) => {    
                const data = [];
       
                const res = await this._executeSql<any>(tx, sql);
                if(res.rows.length) {
                    for(let i=0; i< res.rows.length; i++) {
                        data.push(res.rows.item(i));
                    }
                }
                resolve(<any>data);
            }, (error) => reject(error));
        });
    }

    remove(store, key): Promise<any> {
        return new Promise((resolve, reject) => {
            // this.db.remove(store, key).done(key => {
            //     resolve(key);
            // });
            throw 'remove not impleted in db-sql yet';
        });
    }

    removeAll(store) {
        return new Promise((resolve, reject) => {
            throw 'removeAll not impleted in db-sql yet';
        });
    }

    count(store, opts?: { key }): Promise<number> {
        return new Promise((resolve, reject) => {
            let sql = `SELECT count(*) AS total FROM ${store} `;
            this._db.executeSql(sql, [], (rs) => {
                resolve(rs.rows.item(0).total);
            }, (error) => {
                reject(error);
            });
        });
    }

    delete() {
        return this._deleteDatabase();
    }

    private _prepareTables() {
        return new Promise((resolve, reject) => {
            this._db.transaction(async (transaction) => {
                const schemas = this.schemaSvc.schema.stores;
                
                const promises = [];
                for(let schema of schemas) {
                    let sql = `CREATE TABLE IF NOT EXISTS ${schema.name} `;
                    sql += `(`;

                    for(let col of schema.columns) {
                        sql += `${col.name}${col.type ? ' ' + col.type : ''}${col['isPrimaryKey'] ? ' PRIMARY KEY' : ''},`;
                    }

                    //remove extra ',' at the end
                    sql = sql.substr(0, sql.length - 1);
                    sql += `)`;

                    if(AppConstant.DEBUG) {
                        console.log('DbService: _prepareTables: sql:', sql);
                    }
                    const promise = this._executeSql(transaction, sql);
                    promises.push(promise); 
                }

                try {
                    await Promise.all(promises);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            });
        })
    }

    private _executeSql<T>(transaction, sql, params = []): Promise<T> {
        return new Promise((resolve, reject) => {
            transaction.executeSql(sql, params
                , (tx, rs) => {
                    resolve(rs);
                }
                , (tx, error) => {
                    reject(error);
                }
            );
        });
    }

    private _deleteDatabase() {
        return new Promise((resolve, reject) => {
            (<any>window).sqlitePlugin.deleteDatabase({name: this._dbName, location: 'default'}, resolve, reject);
        });
    }

    private _dbSuccess() {
        this._isDbInitialized = true;
    }

    private _dbError(err) {
        alert('Open database ERROR: ' + JSON.stringify(err));
    }
} 