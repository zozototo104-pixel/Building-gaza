import { db } from './src/db/index.js';
try {
  await db.query.payments.findMany({ with: { apartment: true, resident: true } });
  console.log("Query 2 success");
} catch(e) { console.error("Query 2 error:", e); }
