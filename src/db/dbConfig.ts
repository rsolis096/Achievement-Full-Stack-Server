// src/db/dbConfig.ts
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbSSL : boolean = process.env.SSL as string == "true";

const db = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT) || 5432,
    max: 10, // maximum number of clients in the pool
    idleTimeoutMillis: 30000, // close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // return an error after 2 seconds if a connection cannot be established
});
db.connect();

export default db;