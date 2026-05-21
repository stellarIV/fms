import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function run() {
  const payments = await db.query.monthlyPayment.findMany();
  let count = 0;
  for (const p of payments) {
    const penaltyFee = p.totalPayment === 0 ? 0 : p.totalPayment - p.totalMonthlyFee;
    if (p.penaltyFee !== penaltyFee) {
      await db.update(schema.monthlyPayment)
        .set({ penaltyFee })
        .where(eq(schema.monthlyPayment.id, p.id));
      count++;
    }
  }
  console.log('Updated ' + count + ' payment records for penalty fee logic.');
}
run().catch(console.error);
