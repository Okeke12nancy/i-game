import { Pool, QueryResult } from 'pg';
declare class Database {
    private pool;
    private connected;
    constructor();
    connect(): Promise<Pool>;
    query(text: string, params?: any[]): Promise<QueryResult>;
    close(): Promise<void>;
    getPool(): Pool | null;
    isConnected(): boolean;
}
declare const _default: Database;
export default _default;
//# sourceMappingURL=databaseConfig.d.ts.map