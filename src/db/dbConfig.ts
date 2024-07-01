// src/db/dbConfig.ts
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbSSL : boolean = process.env.SSL as string == "true";

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT as string),
    ssl: dbSSL //Needed for production
});
db.connect();

export default db;