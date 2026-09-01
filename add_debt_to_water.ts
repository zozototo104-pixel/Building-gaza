import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    await db.execute(sql`ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS debt_id INTEGER REFERENCES debts(id);`);
    console.log("Migration applied successfully.");
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

migrate();
