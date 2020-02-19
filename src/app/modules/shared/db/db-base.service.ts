export class DbService {
    put(store, data): Promise<{ rowsAffected, insertId }>{ return; }
    
    get<T>(store: string, key: any): Promise<T> { return; }
    getAll<T>(store: string): Promise<T> { return; }
}