import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

async function test() {
  try {
    const adminCountRes = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
    console.log(adminCountRes);
  } catch (error) {
    console.error('Setup status error:', error);
  }
}
test();
