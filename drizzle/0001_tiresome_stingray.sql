CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"changeDescription" text NOT NULL,
	"changerName" text NOT NULL,
	"changerRole" text NOT NULL,
	"employeeNo" integer NOT NULL,
	"fieldChanged" text NOT NULL,
	"oldValue" text NOT NULL,
	"newValue" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_request" (
	"id" text PRIMARY KEY NOT NULL,
	"no" integer NOT NULL,
	"objectType" text NOT NULL,
	"objectDescription" text NOT NULL,
	"measure" text NOT NULL,
	"requestPurpose" text NOT NULL,
	"quantity" integer NOT NULL,
	"evaluation" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"requesterId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "expense_request_no_unique" UNIQUE("no")
);
--> statement-breakpoint
CREATE TABLE "manager_letter" (
	"id" text PRIMARY KEY NOT NULL,
	"expenseRequestId" text NOT NULL,
	"refNumber" text,
	"addressedTo" text,
	"responsiblePerson" text,
	"amountToBuy" integer,
	"measure" text,
	"targetSection" text,
	"purpose" text,
	"payAmount" double precision,
	"status" text DEFAULT 'Draft' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "manager_letter_expenseRequestId_unique" UNIQUE("expenseRequestId")
);
--> statement-breakpoint
CREATE TABLE "monthly_payment_status" (
	"id" text PRIMARY KEY NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"status" text DEFAULT 'Pending' NOT NULL,
	"rejectionReason" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order" (
	"id" text PRIMARY KEY NOT NULL,
	"expenseRequestId" text NOT NULL,
	"addressedTo" text,
	"responsiblePerson" text,
	"targetSection" text,
	"purpose" text,
	"itemDescription" text,
	"measure" text,
	"quantity" integer,
	"unitPrice" double precision,
	"totalAmount" double precision,
	"paymentMethod" text,
	"receiptNumber" text,
	"notes" text,
	"status" text DEFAULT 'Draft' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_order_expenseRequestId_unique" UNIQUE("expenseRequestId")
);
--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "basicSalary" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "forPensionContributionDeductionPurpose" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "accWorkingDate" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "accWorkingDate" SET DEFAULT 30;--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "allowanceForServiceAssistance" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "allowanceForOvertime" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "taxableIncome" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "grossSalary" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "payroll" ALTER COLUMN "receivable" SET DATA TYPE double precision;--> statement-breakpoint
ALTER TABLE "monthly_payment" ADD COLUMN "libraryFee" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "student" ADD COLUMN "isLibraryFeePaid" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "isBanned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "expense_request" ADD CONSTRAINT "expense_request_requesterId_user_id_fk" FOREIGN KEY ("requesterId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manager_letter" ADD CONSTRAINT "manager_letter_expenseRequestId_expense_request_id_fk" FOREIGN KEY ("expenseRequestId") REFERENCES "public"."expense_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_expenseRequestId_expense_request_id_fk" FOREIGN KEY ("expenseRequestId") REFERENCES "public"."expense_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll" ADD CONSTRAINT "payroll_no_unique" UNIQUE("no");