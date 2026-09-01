import fs from 'fs';
let content = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

const routeStr = `
router.get('/monthly-closings', async (req, res) => {
  try {
    const data = await db.query.monthlyClosings.findMany({
      orderBy: (monthlyClosings, { desc }) => [desc(monthlyClosings.month)]
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/monthly-closings', async (req, res) => {
  try {
    const { month, notes } = req.body;
    const closedById = (req as any).userRecord?.id;
    
    // Check if already closed
    const existing = await db.query.monthlyClosings.findFirst({
      where: eq(monthlyClosings.month, month)
    });
    
    if (existing) {
      // Re-open if requested? Or maybe just error for now.
      return res.status(400).json({ error: 'الشهر مغلق مسبقاً' });
    }
    
    const result = await db.insert(monthlyClosings).values({
      month,
      notes,
      closedById
    }).returning();
    
    res.json(result[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.delete('/monthly-closings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(monthlyClosings).where(eq(monthlyClosings.id, Number(id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
`;

if (!content.includes('/monthly-closings')) {
  content = content.replace('export default router;', routeStr + '\nexport default router;');
  fs.writeFileSync('src/server/routes/index.ts', content);
  console.log("Monthly closings API added");
} else {
  console.log("Already exists");
}
