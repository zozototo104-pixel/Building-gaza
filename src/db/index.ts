import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.js';

let connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.SQL_HOST) {
  const password = encodeURIComponent(process.env.SQL_PASSWORD || '');
  const user = process.env.SQL_USER || '';
  const dbName = process.env.SQL_DB_NAME || '';
  const host = process.env.SQL_HOST;
  connectionString = `postgresql://${user}:${password}@localhost:5432/${dbName}?host=${host}`;
}

const pool = new Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });
