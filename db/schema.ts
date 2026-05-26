import { pgTable, text, timestamp, boolean, integer, numeric, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
					id: text("id").primaryKey(),
					name: text("name").notNull(),
					email: text("email").notNull().unique(),
					emailVerified: boolean("emailVerified").notNull(),
					image: text("image"),
					role: text("role").notNull().default("guest"),
					isBanned: boolean("isBanned").notNull().default(false),
					createdAt: timestamp("createdAt").notNull(),
					updatedAt: timestamp("updatedAt").notNull()
				});

export const session = pgTable("session", {
					id: text("id").primaryKey(),
					expiresAt: timestamp("expiresAt").notNull(),
					token: text("token").notNull().unique(),
					createdAt: timestamp("createdAt").notNull(),
					updatedAt: timestamp("updatedAt").notNull(),
					ipAddress: text("ipAddress"),
					userAgent: text("userAgent"),
					userId: text("userId").notNull().references(() => user.id)
				});

export const account = pgTable("account", {
					id: text("id").primaryKey(),
					accountId: text("accountId").notNull(),
					providerId: text("providerId").notNull(),
					userId: text("userId").notNull().references(() => user.id),
					accessToken: text("accessToken"),
					refreshToken: text("refreshToken"),
					idToken: text("idToken"),
					accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
					refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
					scope: text("scope"),
					password: text("password"),
					createdAt: timestamp("createdAt").notNull(),
					updatedAt: timestamp("updatedAt").notNull()
				});

export const verification = pgTable("verification", {
					id: text("id").primaryKey(),
					identifier: text("identifier").notNull(),
					value: text("value").notNull(),
					expiresAt: timestamp("expiresAt").notNull(),
					createdAt: timestamp("createdAt"),
					updatedAt: timestamp("updatedAt")
				});

export const student = pgTable("student", {
	id: text("id").primaryKey(),
	rollNo: text("rollNo").notNull().unique(),
	name: text("name").notNull(),
	paymentCode: text("paymentCode").notNull().unique(),
	isRegistrationPaid: boolean("isRegistrationPaid").notNull().default(false),
	isLibraryFeePaid: boolean("isLibraryFeePaid").notNull().default(false),
	userId: text("userId").references(() => user.id),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

export const monthlyPayment = pgTable("monthly_payment", {
	id: text("id").primaryKey(),
	studentId: text("studentId").notNull().references(() => student.id),
	month: integer("month").notNull(), // 1-12 (Ethiopian Calendar: 1 = Meskerem)
	year: integer("year").notNull(), // Ethiopian Year
	prevPending: integer("prevPending").notNull().default(0),
	registrationFee: integer("registrationFee").notNull().default(0),
	libraryFee: integer("libraryFee").notNull().default(0),
	tuitionFee: integer("tuitionFee").notNull().default(1500),
	transportFee: integer("transportFee").notNull().default(800),
	penaltyFee: integer("penaltyFee").notNull().default(0),
	totalMonthlyFee: integer("totalMonthlyFee").notNull().default(0),
	totalPayment: integer("totalPayment").notNull().default(0),
	pendingFee: integer("pendingFee").notNull().default(0),
	receiptNumber: text("receiptNumber").unique(), // Auto-saves on leave
	bankDate: timestamp("bankDate"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

export const studentRelations = relations(student, ({ many }) => ({
	payments: many(monthlyPayment),
}));

export const monthlyPaymentRelations = relations(monthlyPayment, ({ one }) => ({
	student: one(student, {
		fields: [monthlyPayment.studentId],
		references: [student.id],
	}),
}));

export const dailyReport = pgTable("daily_report", {
	id: text("id").primaryKey(),
	reportDate: timestamp("reportDate").notNull(),
	reporterEmail: text("reporterEmail").notNull(),
	reporterName: text("reporterName"),
	csvData: text("csvData").notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

export const payroll = pgTable("payroll", {
	id: text("id").primaryKey(),
	no: integer("no").notNull().unique(),
	name: text("name").notNull(),
	position: text("position").notNull(),
	section: text("section").notNull(),
	basicSalary: doublePrecision("basicSalary").notNull(),
	forPensionContributionDeductionPurpose: doublePrecision("forPensionContributionDeductionPurpose").notNull(),
	accWorkingDate: doublePrecision("accWorkingDate").notNull().default(30),
	allowanceForServiceAssistance: doublePrecision("allowanceForServiceAssistance").notNull().default(0),
	allowanceForOvertime: doublePrecision("allowanceForOvertime").notNull().default(0),
	taxableIncome: doublePrecision("taxableIncome").notNull().default(0),
	grossSalary: doublePrecision("grossSalary").notNull().default(0),
	receivable: doublePrecision("receivable").notNull().default(0),
	email: text("email"),
	bankAccount: text("bankAccount"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

export const auditLog = pgTable("audit_log", {
	id: text("id").primaryKey(),
	changeDescription: text("changeDescription").notNull(),
	changerName: text("changerName").notNull(),
	changerRole: text("changerRole").notNull(),
	employeeNo: integer("employeeNo").notNull(),
	fieldChanged: text("fieldChanged").notNull(), // "name" | "position" | "accWorkingDate"
	oldValue: text("oldValue").notNull(),
	newValue: text("newValue").notNull(),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const expenseRequest = pgTable("expense_request", {
	id: text("id").primaryKey(),
	no: integer("no").notNull().unique(), // We'll auto-increment this in logic or use sequence
	objectType: text("objectType").notNull(),
	objectDescription: text("objectDescription").notNull(),
	measure: text("measure").notNull(),
	requestPurpose: text("requestPurpose").notNull(),
	quantity: integer("quantity").notNull(),
	evaluation: text("evaluation"), // Filled by other roles
	status: text("status").notNull().default("Draft"), // Draft, Pending, Approved, Rejected
	requesterId: text("requesterId").notNull().references(() => user.id),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

export const monthlyPaymentStatus = pgTable("monthly_payment_status", {
	id: text("id").primaryKey(),
	month: integer("month").notNull(),
	year: integer("year").notNull(),
	status: text("status").notNull().default("Pending"), // Pending, Approved, Rejected
	rejectionReason: text("rejectionReason"),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

// Paper 2: School Manager's Letter (filled by future School Manager role; prepped now)
export const managerLetter = pgTable("manager_letter", {
	id: text("id").primaryKey(),
	expenseRequestId: text("expenseRequestId").notNull().references(() => expenseRequest.id, { onDelete: "cascade" }).unique(),
	refNumber: text("refNumber"),
	addressedTo: text("addressedTo"),
	responsiblePerson: text("responsiblePerson"),
	amountToBuy: integer("amountToBuy"),
	measure: text("measure"),
	targetSection: text("targetSection"),
	purpose: text("purpose"),
	payAmount: doublePrecision("payAmount"),
	status: text("status").notNull().default("Draft"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

// Paper 3: Accountant Purchase Order (filled by accountant based on manager letter)
export const purchaseOrder = pgTable("purchase_order", {
	id: text("id").primaryKey(),
	expenseRequestId: text("expenseRequestId").notNull().references(() => expenseRequest.id, { onDelete: "cascade" }).unique(),
	// Mirror fields from manager letter for the accountant to confirm/fill
	addressedTo: text("addressedTo"),
	responsiblePerson: text("responsiblePerson"),
	targetSection: text("targetSection"),
	purpose: text("purpose"),
	itemDescription: text("itemDescription"),
	measure: text("measure"),
	quantity: integer("quantity"),
	unitPrice: doublePrecision("unitPrice"),
	totalAmount: doublePrecision("totalAmount"),
	// Payment details
	paymentMethod: text("paymentMethod"), // Cash, Bank Transfer, etc.
	receiptNumber: text("receiptNumber"),
	notes: text("notes"),
	// Status: Draft, Submitted, Approved
	status: text("status").notNull().default("Draft"),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

// Relations
export const expenseRequestRelations = relations(expenseRequest, ({ one }) => ({
	managerLetter: one(managerLetter, {
		fields: [expenseRequest.id],
		references: [managerLetter.expenseRequestId],
	}),
	purchaseOrder: one(purchaseOrder, {
		fields: [expenseRequest.id],
		references: [purchaseOrder.expenseRequestId],
	}),
}));

export const managerLetterRelations = relations(managerLetter, ({ one }) => ({
	expenseRequest: one(expenseRequest, {
		fields: [managerLetter.expenseRequestId],
		references: [expenseRequest.id],
	}),
}));

export const purchaseOrderRelations = relations(purchaseOrder, ({ one }) => ({
	expenseRequest: one(expenseRequest, {
		fields: [purchaseOrder.expenseRequestId],
		references: [expenseRequest.id],
	}),
}));

// School Budgeting & General Ledger System Tables
export const budget = pgTable("budget", {
	id: text("id").primaryKey(),
	category: text("category").notNull(), // "payroll", "stationery", "maintenance", "utility", "transport", "assets", "other"
	allocated: doublePrecision("allocated").notNull().default(0),
	year: integer("year").notNull().default(2026),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
	updatedAt: timestamp("updatedAt").notNull().defaultNow()
});

export const manualJournalEntry = pgTable("manual_journal_entry", {
	id: text("id").primaryKey(),
	date: timestamp("date").notNull().defaultNow(),
	description: text("description").notNull(),
	accountCode: text("accountCode").notNull(), // e.g. "1000" (Cash), "1100" (A/R), "1500" (Fixed Assets), "4000" (Revenue), etc.
	debit: doublePrecision("debit").notNull().default(0),
	credit: doublePrecision("credit").notNull().default(0),
	reference: text("reference"), // e.g. "JV-2026-001"
	createdAt: timestamp("createdAt").notNull().defaultNow()
});

