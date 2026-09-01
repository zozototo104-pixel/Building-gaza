const fs = require('fs');
let code = fs.readFileSync('src/server/routes/import.ts', 'utf8');

code = code.replace(/import \{ apartments, residents, debts, payments, expenses, buildingFund \} from '\.\.\/\.\.\/db\/schema\.js';/, `import { apartments, residents, debts, payments, expenses, buildings } from '../../db/schema.js';`);

const executeReplacement = `    // Actual Import inside a transaction
    await db.transaction(async (tx) => {
      // 0. Ensure at least one building exists
      let bId = 1;
      const existingB = await tx.select().from(buildings).limit(1);
      if (existingB.length === 0) {
        const newB = await tx.insert(buildings).values({ name: 'المبنى الرئيسي' }).returning();
        bId = newB[0].id;
      } else {
        bId = existingB[0].id;
      }

      // 1. Mapping and importing apartments
      const aptMap = new Map(); // legacy_id -> new_id
      if (Array.isArray(data.apartments)) {
        for (const apt of data.apartments) {
          const inserted = await tx.insert(apartments).values({
            buildingId: bId,
            number: apt.number || apt.apartment_no || String(apt.id),
            floor: apt.floor ? String(apt.floor) : '1',
            status: apt.status === 'occupied' ? 'OCCUPIED' : 'EMPTY'
          }).returning();
          aptMap.set(apt.id, inserted[0].id);
        }
      }

      // 2. Importing residents
      const resMap = new Map();
      if (Array.isArray(data.residents)) {
        for (const r of data.residents) {
          const newAptId = aptMap.get(r.apartmentId || r.apartment_id);
          if (newAptId) {
            const inserted = await tx.insert(residents).values({
              apartmentId: newAptId,
              name: r.name || 'Unknown',
              phone: r.phone || null,
              type: r.type || 'TENANT',
              startDate: r.moveInDate ? new Date(r.moveInDate) : new Date(),
            }).returning();
            resMap.set(r.id, inserted[0].id);
          }
        }
      }

      // 3. Debts & Payments
      let newExpected = 0;
      let newCollected = 0;

      if (Array.isArray(data.debts)) {
        for (const d of data.debts) {
          const newAptId = aptMap.get(d.apartmentId || d.apartment_id);
          if (newAptId) {
            const amount = Number(d.amount) || 0;
            await tx.insert(debts).values({
              apartmentId: newAptId,
              amount: amount.toString(),
              originalAmount: amount.toString(),
              remainingAmount: amount.toString(),
              dueDate: d.dueDate ? new Date(d.dueDate) : new Date(),
              status: d.status === 'paid' ? 'PAID' : 'OPEN',
              source: d.type || 'OTHER',
              notes: d.description || 'Legacy Debt'
            });
            newExpected += amount;
          }
        }
      }

      if (Array.isArray(data.payments)) {
        for (const p of data.payments) {
          const newAptId = aptMap.get(p.apartmentId || p.apartment_id);
          if (newAptId) {
            const amount = Number(p.amount) || 0;
            await tx.insert(payments).values({
              apartmentId: newAptId,
              amount: amount.toString(),
              date: p.paymentDate ? new Date(p.paymentDate) : new Date(),
              method: p.paymentMethod || 'cash',
              reference: p.referenceNumber || p.receiptNumber || null,
              notes: p.notes || 'Legacy Payment'
            });
            newCollected += amount;
          }
        }
      }

      const newOutstanding = newExpected - newCollected;
      
      // Reconciliation Check
      if (legacyOutstanding !== newOutstanding && Math.abs(legacyOutstanding - newOutstanding) > 1) {
        throw new Error(\`Financial Reconciliation Failed. Legacy Outstanding: \${legacyOutstanding}, New Outstanding: \${newOutstanding}\`);
      }
    });`;

code = code.replace(/    \/\/ Actual Import inside a transaction[\s\S]*?    \}\);/m, executeReplacement);

fs.writeFileSync('src/server/routes/import.ts', code);
console.log("import.ts patched against db schema");
