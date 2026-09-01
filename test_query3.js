import { db } from './src/db/index.js';
try {
  await db.query.users.findFirst();
  console.log("Query 3 success");
} catch(e) { console.error("Query 3 error:", e); }
