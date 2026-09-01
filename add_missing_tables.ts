import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE vote_status AS ENUM ('ACTIVE', 'CLOSED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        options JSONB NOT NULL, -- e.g. [{"id": 1, "text": "موافق"}, ...]
        start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        audience VARCHAR(50) DEFAULT 'ALL',
        status vote_status DEFAULT 'ACTIVE' NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vote_responses (
        id SERIAL PRIMARY KEY,
        vote_id INTEGER REFERENCES votes(id) ON DELETE CASCADE,
        apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
        option_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE(vote_id, apartment_id)
      );
    `);
    console.log("Migration for voting applied successfully.");
  } catch (e) {
    console.error("Migration failed:", e);
  }
}

migrate();
