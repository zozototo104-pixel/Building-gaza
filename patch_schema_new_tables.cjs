const fs = require('fs');

let schema = fs.readFileSync('src/db/schema.ts', 'utf8');

const newEnums = `
// New Enums
export const cashFundTypeEnum = pgEnum('cash_fund_type', ['INCOME', 'EXPENSE']);
export const rentContractStatusEnum = pgEnum('rent_contract_status', ['ACTIVE', 'ENDED', 'SUSPENDED']);
export const projectStatusEnum = pgEnum('project_status', ['PLANNED', 'ACTIVE', 'COMPLETED', 'ON_HOLD']);
export const announcementStatusEnum = pgEnum('announcement_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);
`;

const newTables = `
// Credits (الأرصدة الدائنة)
export const credits = pgTable("credits", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id).notNull(),
  residentId: integer("resident_id").references(() => residents.id),
  originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  source: varchar("source", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// General Pumping (الضخ العام)
export const generalPumping = pgTable("general_pumping", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  time: varchar("time", { length: 50 }),
  supervisor: varchar("supervisor", { length: 255 }),
  initialReading: numeric("initial_reading", { precision: 10, scale: 2 }).notNull(),
  finalReading: numeric("final_reading", { precision: 10, scale: 2 }).notNull(),
  consumption: numeric("consumption", { precision: 10, scale: 2 }).notNull(),
  electricityPrice: numeric("electricity_price", { precision: 10, scale: 2 }),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Rent Contracts (عقود الإيجار)
export const rentContracts = pgTable("rent_contracts", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id).notNull(),
  tenantId: integer("tenant_id").references(() => residents.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  monthlyRent: numeric("monthly_rent", { precision: 12, scale: 2 }).notNull(),
  dueDay: integer("due_day").default(1),
  securityDeposit: numeric("security_deposit", { precision: 12, scale: 2 }),
  status: rentContractStatusEnum("status").default('ACTIVE').notNull(),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects (المشاريع)
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  budget: numeric("budget", { precision: 12, scale: 2 }),
  status: projectStatusEnum("status").default('PLANNED').notNull(),
  managerId: integer("manager_id").references(() => users.id),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cash Fund / Ledger (الصندوق المالي)
export const cashFund = pgTable("cash_fund", {
  id: serial("id").primaryKey(),
  type: cashFundTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  source: varchar("source", { length: 100 }).notNull(), // PAYMENT, EXPENSE, PUMPING, INITIAL_BALANCE
  referenceId: integer("reference_id"), // ID from payments or expenses
  apartmentId: integer("apartment_id").references(() => apartments.id),
  projectId: integer("project_id").references(() => projects.id),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Announcements (الإعلانات)
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  audience: varchar("audience", { length: 100 }), // ALL, OWNERS, TENANTS
  status: announcementStatusEnum("status").default('PUBLISHED').notNull(),
  attachmentUrl: text("attachment_url"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Visits & Gifts (الزيارات والهدايا)
export const visitsGifts = pgTable("visits_gifts", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 100 }).notNull(),
  beneficiary: varchar("beneficiary", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  description: text("description"),
  attachmentUrl: text("attachment_url"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications (الإشعارات)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  apartmentId: integer("apartment_id").references(() => apartments.id),
  type: varchar("type", { length: 100 }).notNull(), // DEBT_REMINDER, ANNOUNCEMENT, etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const creditsRelations = relations(credits, ({ one }) => ({
  apartment: one(apartments, {
    fields: [credits.apartmentId],
    references: [apartments.id],
  }),
  resident: one(residents, {
    fields: [credits.residentId],
    references: [residents.id],
  }),
}));

export const rentContractsRelations = relations(rentContracts, ({ one }) => ({
  apartment: one(apartments, {
    fields: [rentContracts.apartmentId],
    references: [apartments.id],
  }),
  tenant: one(residents, {
    fields: [rentContracts.tenantId],
    references: [residents.id],
  }),
}));

export const cashFundRelations = relations(cashFund, ({ one }) => ({
  apartment: one(apartments, {
    fields: [cashFund.apartmentId],
    references: [apartments.id],
  }),
  project: one(projects, {
    fields: [cashFund.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [cashFund.createdById],
    references: [users.id],
  }),
}));
`;

// Insert newEnums after existing enums
schema = schema.replace("// Users", newEnums + "\n// Users");

// Append newTables
schema += "\n\n" + newTables;

fs.writeFileSync('src/db/schema.ts', schema);
console.log("Schema patched with new tables");
