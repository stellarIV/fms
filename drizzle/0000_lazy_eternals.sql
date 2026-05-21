CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_report" (
	"id" text PRIMARY KEY NOT NULL,
	"reportDate" timestamp NOT NULL,
	"reporterEmail" text NOT NULL,
	"reporterName" text,
	"csvData" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"studentId" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"prevPending" integer DEFAULT 0 NOT NULL,
	"registrationFee" integer DEFAULT 0 NOT NULL,
	"tuitionFee" integer DEFAULT 1500 NOT NULL,
	"transportFee" integer DEFAULT 800 NOT NULL,
	"penaltyFee" integer DEFAULT 0 NOT NULL,
	"totalMonthlyFee" integer DEFAULT 0 NOT NULL,
	"totalPayment" integer DEFAULT 0 NOT NULL,
	"pendingFee" integer DEFAULT 0 NOT NULL,
	"receiptNumber" text,
	"bankDate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_payment_receiptNumber_unique" UNIQUE("receiptNumber")
);
--> statement-breakpoint
CREATE TABLE "payroll" (
	"id" text PRIMARY KEY NOT NULL,
	"no" integer NOT NULL,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"section" text NOT NULL,
	"basicSalary" integer NOT NULL,
	"forPensionContributionDeductionPurpose" integer NOT NULL,
	"accWorkingDate" integer DEFAULT 30 NOT NULL,
	"allowanceForServiceAssistance" integer DEFAULT 0 NOT NULL,
	"allowanceForOvertime" integer DEFAULT 0 NOT NULL,
	"taxableIncome" integer DEFAULT 0 NOT NULL,
	"grossSalary" integer DEFAULT 0 NOT NULL,
	"receivable" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" text PRIMARY KEY NOT NULL,
	"rollNo" text NOT NULL,
	"name" text NOT NULL,
	"paymentCode" text NOT NULL,
	"isRegistrationPaid" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "student_rollNo_unique" UNIQUE("rollNo"),
	CONSTRAINT "student_paymentCode_unique" UNIQUE("paymentCode")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"role" text DEFAULT 'guest' NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_payment" ADD CONSTRAINT "monthly_payment_studentId_student_id_fk" FOREIGN KEY ("studentId") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;