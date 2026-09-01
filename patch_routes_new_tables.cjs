const fs = require('fs');
let indexCode = fs.readFileSync('src/server/routes/index.ts', 'utf8');

const newRoutes = `
// --- Credits ---
router.get('/credits', async (req, res) => {
  try {
    const allCredits = await db.query.credits.findMany({
      with: { apartment: true, resident: true },
      orderBy: (credits, { desc }) => [desc(credits.date)],
    });
    res.json(allCredits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/credits', async (req, res) => {
  try {
    const { apartmentId, residentId, amount, date, source, notes } = req.body;
    const newCredit = await db.insert(credits).values({
      apartmentId,
      residentId: residentId || null,
      originalAmount: amount.toString(),
      remainingAmount: amount.toString(),
      date: date ? new Date(date) : new Date(),
      source,
      notes
    }).returning();
    res.json(newCredit[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- General Pumping ---
router.get('/general-pumping', async (req, res) => {
  try {
    const records = await db.query.generalPumping.findMany({
      orderBy: (generalPumping, { desc }) => [desc(generalPumping.date)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/general-pumping', async (req, res) => {
  try {
    const { date, time, supervisor, initialReading, finalReading, consumption, electricityPrice, totalCost, notes } = req.body;
    
    // We should use a transaction, inserting expense to cash fund
    const newRecord = await db.insert(generalPumping).values({
      date: date ? new Date(date) : new Date(),
      time,
      supervisor,
      initialReading: initialReading.toString(),
      finalReading: finalReading.toString(),
      consumption: consumption.toString(),
      electricityPrice: electricityPrice?.toString(),
      totalCost: totalCost?.toString(),
      notes
    }).returning();
    
    // Create an expense
    if (totalCost && parseFloat(totalCost) > 0) {
        // building lookup
        let building = await db.query.buildings.findFirst();
        let exp = await db.insert(expenses).values({
            buildingId: building?.id || 1,
            category: 'PUMPING',
            description: \`تكلفة الضخ العام بتاريخ \${date}\`,
            amount: totalCost.toString(),
            date: date ? new Date(date) : new Date(),
            createdById: req.userRecord?.id
        }).returning();
        
        // deduct from cash fund
        await db.insert(cashFund).values({
            type: 'EXPENSE',
            amount: totalCost.toString(),
            date: date ? new Date(date) : new Date(),
            source: 'PUMPING',
            referenceId: exp[0].id,
            notes: \`تكلفة الضخ العام بتاريخ \${date}\`,
            createdById: req.userRecord?.id
        });
    }

    res.json(newRecord[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Rent Contracts ---
router.get('/rent-contracts', async (req, res) => {
  try {
    const records = await db.query.rentContracts.findMany({
      with: { apartment: true, tenant: true },
      orderBy: (rentContracts, { desc }) => [desc(rentContracts.startDate)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/rent-contracts', async (req, res) => {
  try {
    const { apartmentId, tenantId, startDate, endDate, monthlyRent, dueDay, securityDeposit, status, notes } = req.body;
    const newRecord = await db.insert(rentContracts).values({
      apartmentId,
      tenantId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlyRent: monthlyRent.toString(),
      dueDay: dueDay || 1,
      securityDeposit: securityDeposit?.toString(),
      status: status || 'ACTIVE',
      notes
    }).returning();
    res.json(newRecord[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Projects ---
router.get('/projects', async (req, res) => {
  try {
    const records = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.startDate)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const { name, description, startDate, budget, status, notes } = req.body;
    const newRecord = await db.insert(projects).values({
      name,
      description,
      startDate: startDate ? new Date(startDate) : new Date(),
      budget: budget?.toString(),
      status: status || 'PLANNED',
      notes,
      managerId: req.userRecord?.id
    }).returning();
    res.json(newRecord[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Cash Fund ---
router.get('/cash-fund', async (req, res) => {
  try {
    const records = await db.query.cashFund.findMany({
      with: { apartment: true, project: true },
      orderBy: (cashFund, { desc }) => [desc(cashFund.date)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Announcements ---
router.get('/announcements', async (req, res) => {
  try {
    const records = await db.query.announcements.findMany({
      orderBy: (announcements, { desc }) => [desc(announcements.date)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content, date, audience, status } = req.body;
    const newRecord = await db.insert(announcements).values({
      title,
      content,
      date: date ? new Date(date) : new Date(),
      audience: audience || 'ALL',
      status: status || 'PUBLISHED',
      createdById: req.userRecord?.id
    }).returning();
    res.json(newRecord[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Visits & Gifts ---
router.get('/visits-gifts', async (req, res) => {
  try {
    const records = await db.query.visitsGifts.findMany({
      orderBy: (visitsGifts, { desc }) => [desc(visitsGifts.date)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/visits-gifts', async (req, res) => {
  try {
    const { type, beneficiary, amount, date, description } = req.body;
    const newRecord = await db.insert(visitsGifts).values({
      type,
      beneficiary,
      amount: amount.toString(),
      date: date ? new Date(date) : new Date(),
      description,
      createdById: req.userRecord?.id
    }).returning();
    
    // Insert into cash fund as expense
    await db.insert(cashFund).values({
        type: 'EXPENSE',
        amount: amount.toString(),
        date: date ? new Date(date) : new Date(),
        source: 'VISIT_GIFT',
        notes: description,
        createdById: req.userRecord?.id
    });
    
    res.json(newRecord[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
`;

const schemaImportRegex = /import \{ (.*) \} from '\.\.\/\.\.\/db\/schema\.js';/;
const schemaMatch = indexCode.match(schemaImportRegex);
if (schemaMatch) {
    const newImports = `import { ${schemaMatch[1]}, credits, generalPumping, rentContracts, projects, cashFund, announcements, visitsGifts, notifications, expenses } from '../../db/schema.js';`;
    indexCode = indexCode.replace(schemaImportRegex, newImports);
} else {
    // try importing expenses
    indexCode = `import { expenses, credits, generalPumping, rentContracts, projects, cashFund, announcements, visitsGifts, notifications } from '../../db/schema.js';\n` + indexCode;
}

indexCode = indexCode.replace("export default router;", newRoutes + "\nexport default router;");

fs.writeFileSync('src/server/routes/index.ts', indexCode);
console.log("Routes patched with new features");
