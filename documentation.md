# Haile Mariam Mamo School - Finance Management System (FMS) Documentation

## 1. Executive Summary & Purpose
The Finance Management System (FMS) is a dedicated, role-enforced web application designed to establish rigid financial accountability, procedural compliance, and transparent record-keeping at Haile Mariam Mamo School. It completely replaces informal communication with a highly structured, digitally audited workflow for procurement, revenue collection, and payroll processing.

---

## 2. Exhaustive Role Analysis & Detailed Activities

The system is built on an absolute separation of powers. No single user can initiate, process, and finalize a transaction. Each role operates within distinct digital boundaries (enforced by routing and Server Actions).

### 2.1 The Principal (The Initiator & Roster Manager)
The Principal represents the ground-level administration of the school. They operate the frontend of the procurement and HR processes but never handle direct finances.

* **Dashboard & Metrics (`/principal/dashboard`):** 
  * Views high-level summaries of their personal operational actions, allowing them to track the status of their pending requests and staff counts.
* **Procurement Initiation (`/principal/expense-request` - "Paper 1"):** 
  * Identifies material or operational needs. They do not buy items. Instead, they submit a formal Expense Request.
  * *Required Data Entry:* They must strictly define the `Object Type` (e.g., Stationery, Hardware), `Object Description` (specific details), `Measure` (pieces, boxes, kg), `Quantity`, and a detailed `Request Purpose`.
  * *Constraint:* Once submitted, the request is locked and forwarded to the School Manager.
* **Human Resources & Payroll Foundation (`/principal/payroll`):** 
  * Maintains the foundational HR roster. 
  * *Required Data Entry:* The Principal inputs and edits core employee metrics: `Employee Name`, `Position/Title`, and `Account Working Days` (usually 30).
  * *Constraint:* They do not see salaries. They only manage *who* works and *how long* they worked.
* **Audit Trail Accountability (`/principal/audit-log`):** 
  * Every single time the Principal alters an employee's core data (e.g., modifying working days due to absence), the system logs it immutably. The Principal uses this page to review their own historical edits.
* **Sectional Student Information (`/principal/students-info`):** 
  * Principal-level read access to the student revenue ledger.
  * *Constraint:* The data is automatically filtered by their assigned section (e.g., a KG Principal only sees KG students). They can view payment statuses (tuition, transport) to ensure administrative compliance but cannot process payments.

### 2.2 The School Manager (The Operational Authorizer)
The School Manager acts as the strategic and budgetary gatekeeper between the school's needs and the accounting department.

* **Budget Planning (`/school-manager/budget-plan`):** 
  * Oversees the high-level budget allocations for the school to ensure incoming requests map against available funds.
* **Procurement Authorization (`/school-manager/purchase-orders` - "Paper 2"):** 
  * Evaluates the Principal's pending "Paper 1" requests. They do not merely click "approve."
  * *Required Data Entry:* They must formally draft and issue an **Authorization Letter**. They specify:
    * `Addressed To`: The specific vendor or department the school is dealing with.
    * `Responsible Person`: Legally delegating a staff member to handle the physical purchase.
    * `Target Section`: The department receiving the goods.
    * `Amount to Buy` & `Authorized Pay Amount`: The absolute maximum ETB budget ceiling authorized.
* **Global Oversight (`/school-manager/payroll` & `/school-manager/payments`):** 
  * Global read-access to the entire school's payroll output and student payment ledgers to track the overall financial health of the institution.

### 2.3 The Accountant (The Processor & Mathematical Core)
The Accountant is the heavy-lifting processor of the system. They execute the authorized actions and handle all direct financial data entry.

* **Procurement Execution (`/accountant/expenses/orders` - "Paper 3"):** 
  * Receives the School Manager's Authorization Letter.
  * *Required Data Entry:* Translates the authorized budget into a real **Purchase Order**. They input the exact negotiated `Unit Price`, calculate the `Total Amount` (which cannot logically exceed the Manager's ceiling), specify the `Payment Method` (Cash, Cheque), and record the physical `Receipt Number` obtained from the vendor.
* **Payroll Computation (`/accountant/expenses/payroll`):** 
  * Takes the Principal's HR roster and applies the financial mathematics.
  * *Required Data Entry:* Inputs `Basic Salary`, `Allowances` (Overtime/Service), and `Receivables` (Deductions).
  * *Automated Actions:* The system instantly computes Taxable Income, applies strict Ethiopian progressive tax brackets, calculates Pension deductions (both 7% Employee and 11% Employer), and outputs the exact `Net Salary`.
* **Revenue Collection (`/accountant/revenue/payments`):** 
  * The sole receiver of school revenue. Pulls up student profiles via Roll Number or Payment Code.
  * *Automated Logic:* Automatically determines if `Registration Fees` apply (based on the start of the year), handles `Transport Fees` dynamically based on the student's route code, and carries over any unpaid `Pending Fees` from previous months.
  * *Penalty Engine:* If the payment is processed past the deadline, the system automatically applies a `Penalty Fee`.
  * *Constraint:* The Accountant *must* input an official bank receipt number to validate the digital entry.
* **Ledgers & Reporting (`/accountant/revenue/transactions`, `reports`, `invoices`):** 
  * Maintains the daily transaction ledger, prints formal physical invoices, and exports cumulative daily/monthly CSV reports for external bank reconciliation.

### 2.4 The Finance Head (The Final Clearing & Voucher Generator)
The Finance Head holds the ultimate financial authority. They operate in a read-only oversight capacity to audit the Accountant, stepping in only to give final authorization.

* **Procurement Finalization (`/finance-head/expenses/orders` - Payment Voucher):** 
  * Reviews the complete 3-paper chain (Principal's Request -> Manager's Letter -> Accountant's PO). 
  * *Required Data Entry:* Upon clicking "Approve", they are intercepted by the **Payment Voucher Dialog**. They must formally assign double-entry bookkeeping data before the order closes:
    * `ለ / TO` & `Purpose of Payment`.
    * `Bank Branch` & `Cheque No.` (if applicable).
    * `A/C Code`, `Debit`, `Credit`, and `Description` across a 3-row ledger table.
    * `Signatures`: Accountant, Finance Head, GM, Receiver, Payer.
  * *Automated Action:* Clicking "Approve & Download PDF" saves the accountant's submitted data, locks the transaction, moves it to the "Past Orders" archive table, and downloads a perfectly formatted PDF voucher for physical filing.
* **Payroll Finalization (`/finance-head/expenses/payroll`):** 
  * Reviews the Accountant's calculated tax, pension, and net pay figures.
  * *Action:* Must explicitly "Approve" the payroll before any funds are disbursed. If mathematical or entry errors are found, they "Reject" it back to the Accountant.
* **Global Audit (`/finance-head/revenue/*`):** 
  * Possesses full read-only access to the Accountant's dashboard, payments ledger, transaction logs, and reports to continuously monitor revenue integrity without possessing write-access, preserving separation of duties.

---

## 3. System Data Flow Pipelines

### Workflow A: The 4-Stage Procurement Pipeline
1. **Initiation (Principal):** Submits raw need. *(State: Draft -> Pending)*
2. **Delegation (School Manager):** Evaluates need, defines budget ceiling, issues letter. *(State: Authorized)*
3. **Execution (Accountant):** Sources items, defines exact price, drafts Purchase Order. *(State: Submitted)*
4. **Voucher & Clearing (Finance Head):** Verifies all data, fills out accounting ledgers on the Payment Voucher, approves, and downloads PDF. *(State: Approved / Past Orders)*

### Workflow B: The 3-Stage Payroll Pipeline
1. **Foundation (Principal):** Edits employee names and working days constantly throughout the month.
2. **Computation (Accountant):** At month-end, inputs base salary and allowances. System auto-calculates taxes/pensions.
3. **Clearing (Finance Head):** Audits the math and gives final approval to lock the payroll.

### Workflow C: The Automated Revenue Pipeline
1. **Identification:** Accountant selects a student via search.
2. **Calculation:** System computes base tuition, conditional transport, conditional registration, accumulated debts, and conditional late penalties.
3. **Processing:** Accountant inputs the physically paid amount and bank receipt number.
4. **Reconciliation:** Transaction is logged immutably. Accountant exports End-of-Day CSV for banking matching. Finance Head audits the ledger.

---

## 4. Technical Architecture Constraints
* **Authentication:** Next.js Better-Auth handles session tokens. Middleware ensures `/finance-head/*` cannot be accessed by `accountant` roles.
* **Database (PostgreSQL / Drizzle ORM):**
  * `ExpenseRequest` holds the core status.
  * `ManagerLetter` and `PurchaseOrder` tables maintain strict 1-to-1 foreign-key relationships with `ExpenseRequest`, utilizing `ON DELETE CASCADE` to prevent orphaned records.
* **Storage:** Temporary data (like un-submitted Payment Vouchers) is auto-saved to the Finance Head's browser `LocalStorage` to prevent data loss during the final approval stage.
