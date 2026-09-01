import { db } from './src/db/index.js';
try {
  await db.query.waterReadings.findMany({ with: { apartment: true } });
  console.log("Water Query success");
} catch(e) { console.error("Water Query error:", e); }
