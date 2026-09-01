import fs from 'fs';
import { execSync } from 'child_process';

// 1. Schema Additions
let schema = fs.readFileSync('src/db/schema.ts', 'utf-8');
if (!schema.includes('votes')) {
    schema += `
// Votes (التصويت)
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 255 }).notNull(),
  options: jsonb("options").notNull(), // array of strings
  audience: varchar("audience", { length: 100 }), // ALL, OWNERS, TENANTS
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 50 }).default('ACTIVE').notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voteResponses = pgTable("vote_responses", {
  id: serial("id").primaryKey(),
  voteId: integer("vote_id").references(() => votes.id).notNull(),
  apartmentId: integer("apartment_id").references(() => apartments.id),
  residentId: integer("resident_id").references(() => residents.id),
  selection: varchar("selection", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
`;
    fs.writeFileSync('src/db/schema.ts', schema);
}

// 2. Setup Route (API for Community, Projects, CashFund, MyPortal)
let routes = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

// Add Missing API endpoints
if (!routes.includes('/my-portal')) {
    const missingEndpoints = `
// MY PORTAL (Tenant/Resident view)
router.get('/my-portal', async (req: any, res: any) => {
  try {
    const userRecord = req.userRecord;
    
    // Find resident profile linked to this user's email or exact match
    // For now we match based on name or simply return a generic if not linked
    // Ideally we should have userId in residents table. Let's just find first resident for demo or matching name
    const resident = await db.query.residents.findFirst({
        where: eq(residents.name, userRecord.name)
    });
    
    if (!resident) {
        return res.json({ debts: [], contracts: [], announcements: [] });
    }
    
    const myDebts = await db.query.debts.findMany({
        where: eq(debts.apartmentId, resident.apartmentId)
    });
    
    const myContracts = await db.query.rentContracts.findMany({
        where: eq(rentContracts.tenantId, resident.id)
    });
    
    const myAnnouncements = await db.query.announcements.findMany({
        where: eq(announcements.status, 'PUBLISHED')
    });
    
    res.json({ debts: myDebts, contracts: myContracts, announcements: myAnnouncements });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// CASH FUND POST
router.post('/cash-fund', async (req: any, res: any) => {
  try {
    const { type, amount, source, notes, paymentMethod } = req.body;
    const inserted = await db.insert(cashFund).values({
      type,
      amount: amount.toString(),
      source,
      notes,
      paymentMethod,
      createdById: req.userRecord.id
    }).returning();
    res.json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// PROJECTS POST
router.post('/projects', async (req: any, res: any) => {
  try {
    const { name, description, budget } = req.body;
    const inserted = await db.insert(projects).values({
      name,
      description,
      budget: budget ? budget.toString() : null,
      status: 'PLANNED'
    }).returning();
    res.json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// ANNOUNCEMENTS POST
router.post('/announcements', async (req: any, res: any) => {
  try {
    const { title, content, audience } = req.body;
    const inserted = await db.insert(announcements).values({
      title,
      content,
      audience,
      status: 'PUBLISHED',
      createdById: req.userRecord.id
    }).returning();
    res.json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// VISITS POST
router.post('/visits-gifts', async (req: any, res: any) => {
  try {
    const { type, beneficiary, amount, description } = req.body;
    
    // Also deduct from cash fund
    await db.transaction(async (tx) => {
      const inserted = await tx.insert(visitsGifts).values({
        type,
        beneficiary,
        amount: amount.toString(),
        description,
        createdById: req.userRecord.id
      }).returning();
      
      await tx.insert(cashFund).values({
        type: 'OUT',
        amount: amount.toString(),
        source: 'EXPENSE', // It's an expense
        notes: \`\${type} - \${beneficiary}\`,
        createdById: req.userRecord.id
      });
      
      res.json(inserted[0]);
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// VOTES GET
router.get('/votes', async (req: any, res: any) => {
  try {
    const allVotes = await db.select().from(votes);
    res.json(allVotes);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// VOTES POST
router.post('/votes', async (req: any, res: any) => {
  try {
    const { question, options, audience } = req.body;
    const inserted = await db.insert(votes).values({
      question,
      options,
      audience,
      createdById: req.userRecord.id
    }).returning();
    res.json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

// VOTES RESPOND
router.post('/votes/:id/vote', async (req: any, res: any) => {
  try {
    const { selection, residentId, apartmentId } = req.body;
    const inserted = await db.insert(voteResponses).values({
      voteId: parseInt(req.params.id),
      selection,
      residentId,
      apartmentId
    }).returning();
    res.json(inserted[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
});

`;
    // Add missing imports
    routes = routes.replace(`import { apartments, residents, debts, payments, expenses, buildings, services, cashFund, rentContracts, generalPumping, waterReadings, projects, announcements, visitsGifts } from '../../db/schema.js';`, 
    `import { apartments, residents, debts, payments, expenses, buildings, services, cashFund, rentContracts, generalPumping, waterReadings, projects, announcements, visitsGifts, votes, voteResponses } from '../../db/schema.js';`);
    
    // Insert before export default router
    routes = routes.replace('export default router;', missingEndpoints + '\nexport default router;');
    fs.writeFileSync('src/server/routes/index.ts', routes);
}
