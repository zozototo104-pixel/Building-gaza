import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS monthly_closings (
        id SERIAL PRIMARY KEY,
        month VARCHAR(7) NOT NULL UNIQUE, -- YYYY-MM
        closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        closed_by_id INTEGER REFERENCES users(id),
        notes TEXT
      );
    `);
    console.log("Migration applied successfully.");
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

migrate();
