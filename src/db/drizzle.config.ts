import { defineConfig } from "drizzle-kit";

let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.SQL_HOST) {
  const password = encodeURIComponent(process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD || '');
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER || '';
  const dbName = process.env.SQL_DB_NAME || '';
  const host = process.env.SQL_HOST;
  databaseUrl = `postgresql://${user}:${password}@localhost:5432/${dbName}?host=${host}`;
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl!,
  },
});
