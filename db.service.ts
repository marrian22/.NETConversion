// src/database/db.service.ts

import { DbRow } from '../models/data-contracts';
import { open } from 'msnodesqlv8';

export class DbService {
    private connectionString: string;

    constructor() {
        const server = '(localdb)\\MSSQLLocalDB';
        const database = 'master'; // IMPORTANT: Change this to your actual database name
        this.connectionString = `Driver={ODBC Driver 18 for SQL Server};Server=${server};Database=${database};Trusted_Connection=Yes;`;
        
        console.log('DbService initialized.');
    }

    private async getConnection(): Promise<any> {
        return new Promise((resolve, reject) => {
            open(this.connectionString, (err: any, conn: any) => {
                if (err) {
                    console.error('Database connection failed!', err);
                    return reject(err);
                }
                console.log('Successfully connected to the database.');
                resolve(conn);
            });
        });
    }

    public async getResultSet(sqlQuery: string): Promise<DbRow[]> {
        let conn: any;
        try {
            conn = await this.getConnection();
            const result = await new Promise<any>((resolve, reject) => {
                conn.query(sqlQuery, (queryErr: any, recordset: any) => {
                    if (queryErr) {
                        return reject(queryErr);
                    }
                    resolve({ recordset: recordset as DbRow[], rowsAffected: [] });
                });
            });
            return result.recordset;
        } catch (err) {
            console.error('Query failed!', err);
            throw err;
        } finally {
            if (conn) {
                conn.close(() => console.log('Connection closed.'));
            }
        }
    }
    
    public async sqlExecute(sqlCommand: string): Promise<void> {
        let conn: any;
        try {
            conn = await this.getConnection();
            await new Promise<void>((resolve, reject) => {
                conn.query(sqlCommand, (queryErr: any) => {
                    if (queryErr) {
                        return reject(queryErr);
                    }
                    resolve();
                });
            });
        } catch (err) {
            console.error('Command execution failed!', err);
            throw err;
        } finally {
            if (conn) {
                conn.close(() => console.log('Connection closed.'));
            }
        }
    }

    public async close(): Promise<void> {
        // Connections are managed per-request, so this method is not needed.
    }
}