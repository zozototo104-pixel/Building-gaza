import fs from 'fs';
let content = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

const helperStr = `
import { monthlyClosings } from '../../db/schema.js';

// Helper to check if a date falls in a closed month
async function checkMonthlyClosing(dateObj: Date | string | null | undefined) {
  if (!dateObj) return false;
  const d = new Date(dateObj);
  const monthStr = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`;
  const closed = await db.query.monthlyClosings.findFirst({
    where: eq(monthlyClosings.month, monthStr)
  });
  if (closed) {
    throw new Error(\`Cannot modify data in a closed month (\${monthStr}).\`);
  }
}
`;

content = content.replace(`const router = Router();`, helperStr + `\nconst router = Router();`);

fs.writeFileSync('src/server/routes/index.ts', content);
console.log("Monthly closing helper added");
