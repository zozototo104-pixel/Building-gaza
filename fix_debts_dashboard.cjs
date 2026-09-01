const fs = require('fs');
let code = fs.readFileSync('src/server/routes/index.ts', 'utf8');

// Replace where(eq(debts.status, 'OPEN')) with where(inArray(debts.status, ['OPEN', 'PARTIALLY_PAID']))
const oldTotalDebts = "const totalDebts = await db.select({ total: sql<number>`sum(amount)` }).from(debts).where(eq(debts.status, 'OPEN'));";
const newTotalDebts = "const totalDebts = await db.select({ total: sql<number>`sum(remaining_amount)` }).from(debts).where(inArray(debts.status, ['OPEN', 'PARTIALLY_PAID']));";

code = code.replace(oldTotalDebts, newTotalDebts);

const importEqRegex = /import \{ eq \} from 'drizzle-orm';/;
if (!code.includes('inArray')) {
  code = code.replace(importEqRegex, "import { eq, inArray } from 'drizzle-orm';");
}

fs.writeFileSync('src/server/routes/index.ts', code);
