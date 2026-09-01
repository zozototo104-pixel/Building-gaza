import { db } from './src/db/index.js';
try {
  await db.query.apartments.findMany({ with: { building: true, residents: true, debts: true, payments: true } });
  console.log("Query 1 success");
} catch(e) { console.error("Query 1 error:", e.message); }
