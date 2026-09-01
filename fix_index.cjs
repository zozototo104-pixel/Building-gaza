const fs = require('fs');
let code = fs.readFileSync('src/server/routes/index.ts', 'utf8');

const start = code.indexOf("router.post('/payments',");
const end = code.indexOf("// --- Credits ---");

const correctPaymentPost = `router.post('/payments', async (req, res) => {
  try {
    const { apartmentId, residentId, amount, method, reference, notes, debtId } = req.body;
    
    // Create payment
    const newPayment = await db.insert(payments).values({
      apartmentId,
      residentId: residentId || null,
      amount: amount.toString(),
      method,
      reference,
      notes,
      createdById: (req as any).userRecord?.id
    }).returning();
    
    // Allocate debt
    if (debtId) {
      const debtRecord = await db.query.debts.findFirst({
        where: eq(debts.id, debtId)
      });
      
      if (debtRecord) {
        const remaining = parseFloat(debtRecord.remainingAmount) - parseFloat(amount);
        const status = remaining <= 0 ? 'PAID' : 'PARTIALLY_PAID';
        
        await db.update(debts).set({
          remainingAmount: Math.max(0, remaining).toString(),
          status
        }).where(eq(debts.id, debtId));
        
        await db.insert(paymentAllocations).values({
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
    
    res.json(newPayment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

`;

code = code.substring(0, start) + correctPaymentPost + code.substring(end);
fs.writeFileSync('src/server/routes/index.ts', code);
