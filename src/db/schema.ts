import { 
  pgTable, 
  serial, 
  text, 
  varchar, 
  timestamp, 
  boolean, 
  integer,
  numeric,
  json,
  pgEnum
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'accountant', 'viewer', 'tenant']);
export const debtStatusEnum = pgEnum('debt_status', ['OPEN', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']);
export const serviceTypeEnum = pgEnum('service_type', ['FIXED', 'VARIABLE']);
export const serviceFrequencyEnum = pgEnum('service_frequency', ['MONTHLY', 'PERIODIC', 'ONE_TIME']);


// New Enums
export const cashFundTypeEnum = pgEnum('cash_fund_type', ['INCOME', 'EXPENSE']);
export const rentContractStatusEnum = pgEnum('rent_contract_status', ['ACTIVE', 'ENDED', 'SUSPENDED']);
export const projectStatusEnum = pgEnum('project_status', ['PLANNED', 'ACTIVE', 'COMPLETED', 'ON_HOLD']);
export const announcementStatusEnum = pgEnum('announcement_status', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  authId: varchar("auth_id", { length: 128 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").default('viewer').notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Buildings
export const buildings = pgTable("buildings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Apartments
export const apartments = pgTable("apartments", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").references(() => buildings.id).notNull(),
  number: varchar("number", { length: 50 }).notNull(),
  floor: varchar("floor", { length: 50 }),
  status: varchar("status", { length: 50 }).default('EMPTY'), // EMPTY, OCCUPIED
  waterMeterReading: numeric("water_meter_reading", { precision: 10, scale: 2 }).default('0'),
  accessCode: varchar("access_code", { length: 100 }).default('123456'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Residents
export const residents = pgTable("residents", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id),
  userId: integer("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  type: varchar("type", { length: 50 }).notNull(), // OWNER, TENANT
  familyMembers: integer("family_members").default(1),
  startDate: timestamp("start_date"),
  notes: text("notes"),
  accessCode: varchar("access_code", { length: 100 }).default('123456'),
  statementFileUrl: text("statement_file_url"),
  statementFileName: varchar("statement_file_name", { length: 255 }),
  statementFileType: varchar("statement_file_type", { length: 100 }),
  statementFileSize: varchar("statement_file_size", { length: 50 }),
  statementUploadedAt: timestamp("statement_uploaded_at"),
  statementNotes: text("statement_notes"),
  statementDocuments: json("statement_documents"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").references(() => buildings.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  scope: varchar("scope", { length: 50 }).default('BUILDING'), // BUILDING, APARTMENT, GENERAL
  type: serviceTypeEnum("type").default('FIXED').notNull(),
  frequency: serviceFrequencyEnum("frequency").default('MONTHLY').notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).default('0').notNull(),
  startDate: timestamp("start_date"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Service Transactions (معاملات الخدمات)
export const serviceTransactions = pgTable("service_transactions", {
  id: serial("id").primaryKey(),
  serviceId: integer("service_id").references(() => services.id, { onDelete: 'set null' }),
  serviceName: varchar("service_name", { length: 255 }).notNull(),
  scope: varchar("scope", { length: 50 }).default('BUILDING').notNull(), // BUILDING, APARTMENT
  apartmentId: integer("apartment_id").references(() => apartments.id, { onDelete: 'set null' }),
  cost: numeric("cost", { precision: 12, scale: 2 }).default('0').notNull(),
  date: timestamp("date").defaultNow().notNull(),
  dayName: varchar("day_name", { length: 50 }),
  expenseId: integer("expense_id").references(() => expenses.id, { onDelete: 'set null' }),
  debtId: integer("debt_id").references(() => debts.id, { onDelete: 'set null' }),
  isPaid: boolean("is_paid").default(false),
  paymentMethod: varchar("payment_method", { length: 50 }),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions (الاشتراكات الشهرية والدورية)
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id, { onDelete: 'cascade' }).notNull(),
  month: varchar("month", { length: 20 }).notNull(), // e.g. "2026-08"
  dueAmount: numeric("due_amount", { precision: 12, scale: 2 }).default('50').notNull(),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).default('0').notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default('نقدي').notNull(),
  collectedBy: varchar("collected_by", { length: 255 }), // التوقيع الإلكتروني أو اسم المستلم
  receiptNumber: varchar("receipt_number", { length: 100 }),
  status: varchar("status", { length: 50 }).default('UNPAID').notNull(), // PAID, PARTIAL, UNPAID
  notes: text("notes"),
  date: timestamp("date").defaultNow().notNull(),
  debtId: integer("debt_id").references(() => debts.id, { onDelete: 'set null' }),
  paymentId: integer("payment_id").references(() => payments.id, { onDelete: 'set null' }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Debts
export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id).notNull(),
  residentId: integer("resident_id").references(() => residents.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: numeric("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  status: debtStatusEnum("status").default('OPEN').notNull(),
  source: varchar("source", { length: 100 }), // SERVICE, WATER, RENT, OTHER
  sourceId: integer("source_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id).notNull(),
  residentId: integer("resident_id").references(() => residents.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  method: varchar("method", { length: 50 }),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment Allocations
export const paymentAllocations = pgTable("payment_allocations", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id).notNull(),
  debtId: integer("debt_id").references(() => debts.id).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  buildingId: integer("building_id").references(() => buildings.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  payee: varchar("payee", { length: 255 }),
  method: varchar("method", { length: 50 }),
  attachmentUrl: text("attachment_url"),
  notes: text("notes"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Water Readings
export const waterReadings = pgTable("water_readings", {
  id: serial("id").primaryKey(),
  apartmentId: integer("apartment_id").references(() => apartments.id).notNull(),
  fillDate: timestamp("fill_date").defaultNow(),
  dayName: varchar("day_name", { length: 50 }),
  fillTime: varchar("fill_time", { length: 50 }),
  litersQuantity: numeric("liters_quantity", { precision: 12, scale: 2 }).default('1000'),
  previousReading: numeric("previous_reading", { precision: 10, scale: 2 }).notNull(),
  newReading: numeric("new_reading", { precision: 10, scale: 2 }).notNull(),
  manualCycleStart: varchar("manual_cycle_start", { length: 100 }),
  manualCycleEnd: varchar("manual_cycle_end", { length: 100 }),
  consumption: numeric("consumption", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  isPaid: boolean("is_paid").default(false),
  paymentMethod: varchar("payment_method", { length: 50 }).default('UNPAID'),
  fillStatus: varchar("fill_status", { length: 50 }).default('SUCCESS'),
  stumbleReason: text("stumble_reason"),
  notes: text("notes"),
  debtId: integer("debt_id").references(() => debts.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit Logs
// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: integer("entity_id").notNull(),
  oldValues: json("old_values"),
  newValues: json("new_values"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  apartment: one(apartments, {
    fields: [payments.apartmentId],
    references: [apartments.id],
  }),
  resident: one(residents, {
    fields: [payments.residentId],
    references: [residents.id],
  }),
  allocations: many(paymentAllocations),
}));

export const debtsRelations = relations(debts, ({ one, many }) => ({
  apartment: one(apartments, {
    fields: [debts.apartmentId],
    references: [apartments.id],
  }),
  resident: one(residents, {
    fields: [debts.residentId],
    references: [residents.id],
  }),
  paymentAllocations: many(paymentAllocations),
}));

export const apartmentsRelations = relations(apartments, ({ one, many }) => ({
  building: one(buildings, {
    fields: [apartments.buildingId],
    references: [buildings.id],
  }),
  residents: many(residents),
  debts: many(debts),
  payments: many(payments),
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  apartment: one(apartments, {
    fields: [subscriptions.apartmentId],
    references: [apartments.id],
  }),
  debt: one(debts, {
    fields: [subscriptions.debtId],
    references: [debts.id],
  }),
  payment: one(payments, {
    fields: [subscriptions.paymentId],
    references: [payments.id],
  }),
  createdBy: one(users, {
    fields: [subscriptions.createdById],
    references: [users.id],
  }),
}));

export const residentsRelations = relations(residents, ({ one, many }) => ({
  apartment: one(apartments, {
    fields: [residents.apartmentId],
    references: [apartments.id],
  }),
  debts: many(debts),
  payments: many(payments),
}));


export const waterReadingsRelations = relations(waterReadings, ({ one }) => ({
  apartment: one(apartments, {
    fields: [waterReadings.apartmentId],
    references: [apartments.id],
  }),
  debt: one(debts, {
    fields: [waterReadings.debtId],
    references: [debts.id],
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

export const servicesRelations = relations(services, ({ one, many }) => ({
  building: one(buildings, {
    fields: [services.buildingId],
    references: [buildings.id],
  }),
  transactions: many(serviceTransactions),
}));

export const serviceTransactionsRelations = relations(serviceTransactions, ({ one }) => ({
  service: one(services, {
    fields: [serviceTransactions.serviceId],
    references: [services.id],
  }),
  apartment: one(apartments, {
    fields: [serviceTransactions.apartmentId],
    references: [apartments.id],
  }),
  expense: one(expenses, {
    fields: [serviceTransactions.expenseId],
    references: [expenses.id],
  }),
  debt: one(debts, {
    fields: [serviceTransactions.debtId],
    references: [debts.id],
  }),
  createdBy: one(users, {
    fields: [serviceTransactions.createdById],
    references: [users.id],
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

export const buildingsRelations = relations(buildings, ({ many }) => ({
  apartments: many(apartments),
  services: many(services),
  expenses: many(expenses),
}));

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLogs),
  expenses: many(expenses),
  payments: many(payments),
}));



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

// General Pumping (الضخ العام وبراميل البناية)
export const generalPumping = pgTable("general_pumping", {
  id: serial("id").primaryKey(),
  date: timestamp("date").defaultNow().notNull(),
  dayName: varchar("day_name", { length: 50 }),
  startTime: varchar("start_time", { length: 50 }),
  endTime: varchar("end_time", { length: 50 }),
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
  apartmentId: integer("apartment_id").references(() => apartments.id),
  tenantId: integer("tenant_id").references(() => residents.id),
  tenantName: varchar("tenant_name", { length: 255 }),
  tenantPhone: varchar("tenant_phone", { length: 50 }),
  unitDescription: varchar("unit_description", { length: 255 }),
  paidMonths: json("paid_months"),
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

// Monthly Closings (الإقفال الشهري)
export const monthlyClosings = pgTable("monthly_closings", {
  id: serial("id").primaryKey(),
  month: varchar("month", { length: 7 }).notNull().unique(), // YYYY-MM
  closedAt: timestamp("closed_at").defaultNow().notNull(),
  closedById: integer("closed_by_id").references(() => users.id),
  notes: text("notes"),
});

export const voteStatusEnum = pgEnum('vote_status', ['ACTIVE', 'CLOSED']);

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: json("options").notNull(), // Array of {id, text}
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  audience: varchar("audience", { length: 50 }).default('ALL'),
  status: voteStatusEnum("status").default('ACTIVE').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voteResponses = pgTable("vote_responses", {
  id: serial("id").primaryKey(),
  voteId: integer("vote_id").references(() => votes.id, { onDelete: 'cascade' }).notNull(),
  apartmentId: integer("apartment_id").references(() => apartments.id, { onDelete: 'cascade' }).notNull(),
  optionId: integer("option_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Meetings (محاضر الاجتماعات)
export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  location: varchar("location", { length: 255 }),
  attendees: text("attendees"),
  agenda: text("agenda"),
  decisions: text("decisions"),
  notes: text("notes"),
  attachmentUrl: text("attachment_url"),
  createdById: integer("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

