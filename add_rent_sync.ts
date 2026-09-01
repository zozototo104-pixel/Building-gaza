import fs from 'fs';
let content = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

const syncRoute = `
router.post('/rent-contracts/sync', async (req, res) => {
  try {
    const contracts = await db.query.rentContracts.findMany({
      where: eq(rentContracts.status, 'ACTIVE')
    });
    
    let generated = 0;
    const now = new Date();
    
    for (const contract of contracts) {
      // Loop from startDate to min(endDate, now) by month
      let current = new Date(contract.startDate);
      const end = new Date(contract.endDate);
      const limit = end < now ? end : now;
      
      while (current <= limit) {
        // Create debt if not exists
        const monthStr = \`\${current.getFullYear()}-\${String(current.getMonth() + 1).padStart(2, '0')}\`;
        const noteStr = \`إيجار شهر \${monthStr}\`;
        
        const existingDebt = await db.query.debts.findFirst({
          where: and(
            eq(debts.apartmentId, contract.apartmentId),
            eq(debts.source, 'RENT'),
            eq(debts.sourceId, contract.id),
            eq(debts.notes, noteStr)
          )
        });
        
        if (!existingDebt) {
          const dueDate = new Date(current.getFullYear(), current.getMonth(), contract.dueDay || 1);
          await db.insert(debts).values({
            apartmentId: contract.apartmentId,
            residentId: contract.tenantId,
            amount: contract.monthlyRent,
            originalAmount: contract.monthlyRent,
            remainingAmount: contract.monthlyRent,
            dueDate: dueDate,
            status: 'OPEN',
            source: 'RENT',
            sourceId: contract.id,
            notes: noteStr
          });
          generated++;
        }
        
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    res.json({ success: true, generated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
`;

if (!content.includes('/rent-contracts/sync')) {
  content = content.replace("router.get('/rent-contracts'", syncRoute + "\nrouter.get('/rent-contracts'");
  fs.writeFileSync('src/server/routes/index.ts', content);
  console.log("Rent sync route added");
}
