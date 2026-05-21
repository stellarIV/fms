import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
import * as dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { DEFAULT_FEES } from '../lib/constants';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding 100 students...");

  const prefixes = ["K1", "K2", "K3", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"];
  const students = [];
  const payments = [];

  for (let i = 0; i < 100; i++) {
    const prefix = prefixes[i % prefixes.length];
    const num = Math.floor(i / prefixes.length) + 1;
    const padNum = num.toString().padStart(3, '0');
    const paymentCode = `${prefix}${padNum}`;
    const studentId = randomUUID();

    students.push({
      id: studentId,
      rollNo: `R-${paymentCode}`,
      name: `Student ${paymentCode}`,
      paymentCode: paymentCode,
      isRegistrationPaid: false,
    });

    const usesTransport = parseInt(paymentCode.replace(/\D/g, "") || "1", 10) % 3 !== 0;
    const transportFee = usesTransport ? DEFAULT_FEES.transport : 0;

    // Create initial payment for Month 1, Year 2017 (Ethiopian)
    payments.push({
      id: randomUUID(),
      studentId: studentId,
      month: 1,
      year: 2017,
      prevPending: 0,
      registrationFee: DEFAULT_FEES.registration,
      tuitionFee: DEFAULT_FEES.tuition,
      transportFee: transportFee,
      penaltyFee: 0,
      totalMonthlyFee: DEFAULT_FEES.registration + DEFAULT_FEES.tuition + transportFee,
      totalPayment: 0,
      pendingFee: DEFAULT_FEES.registration + DEFAULT_FEES.tuition + transportFee,
    });
  }

  // Batch insert
  await db.insert(schema.student).values(students);
  await db.insert(schema.monthlyPayment).values(payments);

  console.log("Seeding complete! Added 100 students and their initial payment records.");
}

seed().catch(console.error);
