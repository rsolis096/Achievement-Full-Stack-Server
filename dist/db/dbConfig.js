// src/db/dbConfig.ts
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Games",
    password: process.env.POSTGRES_PASSWORD,
    port: 5432
});
db.connect();
export default db;
//# sourceMappingURL=dbConfig.js.map