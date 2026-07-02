import sql from 'mssql';
export declare function getDatabase(): Promise<sql.ConnectionPool>;
export declare function closeDatabase(): Promise<void>;
declare const _default: {
    getDatabase: typeof getDatabase;
    closeDatabase: typeof closeDatabase;
};
export default _default;
//# sourceMappingURL=database.d.ts.map