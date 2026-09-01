import fs from 'fs';
let content = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

// 1. Prevent duplicate apartments
content = content.replace(
  "    const { number, floor, status } = req.body;\n    \n    // Check if building exists, if not create default",
  `    const { number, floor, status } = req.body;\n\n    const existing = await db.query.apartments.findFirst({\n      where: eq(apartments.number, number)\n    });\n    if (existing) {\n      return res.status(400).json({ error: 'رقم الشقة موجود مسبقاً' });\n    }\n    \n    // Check if building exists, if not create default`
);

// 2. Add /debts/summary route
const debtsSummaryRoute = `
// --- Debts Summary ---
router.get('/debts/summary', async (req, res) => {
  try {
    const allDebts = await db.query.debts.findMany({
      where: inArray(debts.status, ['OPEN', 'PARTIALLY_PAID']),
      with: { apartment: true, resident: true }
    });
    
    // Group by apartment
    const summary = new Map();
    allDebts.forEach(debt => {
      const aptId = debt.apartmentId;
      if (!summary.has(aptId)) {
        summary.set(aptId, {
          apartmentId: aptId,
          apartmentNumber: debt.apartment?.number || '-',
          residentName: debt.resident?.name || 'غير معروف',
          totalDebt: 0,
          details: []
        });
      }
      const item = summary.get(aptId);
      item.totalDebt += parseFloat(debt.remainingAmount);
      item.details.push(debt);
    });
    
    res.json(Array.from(summary.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Debts ---`;
content = content.replace("// --- Debts ---", debtsSummaryRoute);

// 3. Fix /payments route for CREDIT
const originalPaymentAllocations = `        await db.insert(paymentAllocations).values({
          paymentId: newPayment[0].id,
          debtId: debtId,
          amount: amount.toString()
        });
      }
    }
    
    // ADD TO CASH FUND (Income)
    await db.insert(cashFund).values({
      type: 'INCOME',
      amount: amount.toString(),
      date: new Date(),
      source: 'PAYMENT',
      referenceId: newPayment[0].id,
      apartmentId,
      paymentMethod: method,
      notes,
      createdById: (req as any).userRecord?.id
    });
    
    res.json(newPayment[0]);`;

const newPaymentAllocations = `        await db.insert(paymentAllocations).values({
          paymentId: newPayment[0].id,
          debtId: debtId,
          amount: amount.toString()
        });
      }
    }
    
    if (method === 'CREDIT') {
      // Find oldest active credit for this apartment
      const activeCredits = await db.query.credits.findMany({
        where: eq(credits.apartmentId, apartmentId),
        orderBy: (credits, { asc }) => [asc(credits.date)]
      });
      
      let amountToDeduct = parseFloat(amount.toString());
      for (const c of activeCredits) {
        const remaining = parseFloat(c.remainingAmount);
        if (remaining > 0) {
          const deduct = Math.min(remaining, amountToDeduct);
          await db.update(credits).set({
             remainingAmount: (remaining - deduct).toString()
          }).where(eq(credits.id, c.id));
          amountToDeduct -= deduct;
          if (amountToDeduct <= 0) break;
        }
      }
    } else {
      // ADD TO CASH FUND (Income) - Only if not credit
      await db.insert(cashFund).values({
        type: 'INCOME',
        amount: amount.toString(),
        date: new Date(),
        source: 'PAYMENT',
        referenceId: newPayment[0].id,
        apartmentId,
        paymentMethod: method,
        notes,
        createdById: (req as any).userRecord?.id
      });
    }
    
    res.json(newPayment[0]);`;

content = content.replace(originalPaymentAllocations, newPaymentAllocations);

fs.writeFileSync('src/server/routes/index.ts', content);
console.log("Routes updated successfully");
