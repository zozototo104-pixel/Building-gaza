import fs from 'fs';
let content = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

const queryReplacements = [
  {
    find: `const allDebts = await db.query.debts.findMany({
      where: inArray(debts.status, ['OPEN', 'PARTIALLY_PAID']),
      with: { apartment: true, resident: true }
    });`,
    replace: `
    const userRole = (req as any).userRecord?.role;
    const userAptId = (req as any).userRecord?.apartmentId;
    let whereClause: any = inArray(debts.status, ['OPEN', 'PARTIALLY_PAID']);
    if (userRole === 'tenant' && userAptId) {
      whereClause = and(whereClause, eq(debts.apartmentId, userAptId));
    }
    const allDebts = await db.query.debts.findMany({
      where: whereClause,
      with: { apartment: true, resident: true }
    });`
  },
  {
    find: `    const data = await db.query.debts.findMany({
      with: { apartment: true, resident: true },
      orderBy: (debts, { desc }) => [desc(debts.createdAt)]
    });`,
    replace: `
    const userRole = (req as any).userRecord?.role;
    const userAptId = (req as any).userRecord?.apartmentId;
    let whereClause: any = undefined;
    if (userRole === 'tenant' && userAptId) {
      whereClause = eq(debts.apartmentId, userAptId);
    }
    const data = await db.query.debts.findMany({
      where: whereClause,
      with: { apartment: true, resident: true },
      orderBy: (debts, { desc }) => [desc(debts.createdAt)]
    });`
  },
  {
    find: `    const data = await db.query.payments.findMany({
      with: { apartment: true, resident: true },
      orderBy: (payments, { desc }) => [desc(payments.createdAt)]
    });`,
    replace: `
    const userRole = (req as any).userRecord?.role;
    const userAptId = (req as any).userRecord?.apartmentId;
    let whereClause: any = undefined;
    if (userRole === 'tenant' && userAptId) {
      whereClause = eq(payments.apartmentId, userAptId);
    }
    const data = await db.query.payments.findMany({
      where: whereClause,
      with: { apartment: true, resident: true },
      orderBy: (payments, { desc }) => [desc(payments.createdAt)]
    });`
  },
  {
    find: `    const data = await db.query.waterReadings.findMany({
      with: { apartment: true },
      orderBy: (waterReadings, { desc }) => [desc(waterReadings.createdAt)]
    });`,
    replace: `
    const userRole = (req as any).userRecord?.role;
    const userAptId = (req as any).userRecord?.apartmentId;
    let whereClause: any = undefined;
    if (userRole === 'tenant' && userAptId) {
      whereClause = eq(waterReadings.apartmentId, userAptId);
    }
    const data = await db.query.waterReadings.findMany({
      where: whereClause,
      with: { apartment: true },
      orderBy: (waterReadings, { desc }) => [desc(waterReadings.createdAt)]
    });`
  },
  {
    find: `    const data = await db.query.rentContracts.findMany({
      with: { apartment: true, tenant: true },
      orderBy: (rentContracts, { desc }) => [desc(rentContracts.createdAt)]
    });`,
    replace: `
    const userRole = (req as any).userRecord?.role;
    const userAptId = (req as any).userRecord?.apartmentId;
    let whereClause: any = undefined;
    if (userRole === 'tenant' && userAptId) {
      whereClause = eq(rentContracts.apartmentId, userAptId);
    }
    const data = await db.query.rentContracts.findMany({
      where: whereClause,
      with: { apartment: true, tenant: true },
      orderBy: (rentContracts, { desc }) => [desc(rentContracts.createdAt)]
    });`
  }
];

for (const rep of queryReplacements) {
  content = content.replace(rep.find, rep.replace);
}

// ensure "and" is imported
if (!content.includes('and,')) {
  content = content.replace('eq, sql', 'eq, sql, and');
}

fs.writeFileSync('src/server/routes/index.ts', content);
console.log("Tenant route filters added");
