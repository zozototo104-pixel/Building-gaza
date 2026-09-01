const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

const additionalRelations = `
export const waterReadingsRelations = relations(waterReadings, ({ one }) => ({
  apartment: one(apartments, {
    fields: [waterReadings.apartmentId],
    references: [apartments.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  building: one(buildings, {
    fields: [expenses.buildingId],
    references: [buildings.id],
  }),
  createdBy: one(users, {
    fields: [expenses.createdById],
    references: [users.id],
  }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  building: one(buildings, {
    fields: [services.buildingId],
    references: [buildings.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const paymentAllocationsRelations = relations(paymentAllocations, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentAllocations.paymentId],
    references: [payments.id],
  }),
  debt: one(debts, {
    fields: [paymentAllocations.debtId],
    references: [debts.id],
  }),
}));
`;

code = code + additionalRelations;

fs.writeFileSync('src/db/schema.ts', code);
console.log("schema relations patched");
