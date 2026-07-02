import sql from 'mssql';
export declare function getDatabase(): Promise<sql.ConnectionPool>;
export declare function closeDatabase(): Promise<void>;
export declare function initializeDatabase(): Promise<void>;
export declare function executeQuery(query: string, params?: {
    [key: string]: any;
}): Promise<any>;
export declare function executeStoredProcedure(procedureName: string, params?: {
    [key: string]: any;
}): Promise<any>;
export declare function generateId(): string;
declare const _default: {
    getDatabase: typeof getDatabase;
    closeDatabase: typeof closeDatabase;
    initializeDatabase: typeof initializeDatabase;
    executeQuery: typeof executeQuery;
    executeStoredProcedure: typeof executeStoredProcedure;
    generateId: typeof generateId;
};
export default _default;
//# sourceMappingURL=database.d.ts.map