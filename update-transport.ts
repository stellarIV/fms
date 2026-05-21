import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function run() {
  const students = await db.query.student.findMany({ with: { payments: true } });
  let count = 0;
  for (const student of students) {
    const usesTransport = parseInt(student.paymentCode.replace(/\D/g, '') || '1', 10) % 3 !== 0;
    const transportFee = usesTransport ? 800 : 0;
    
    for (const payment of student.payments) {
      if (payment.transportFee !== transportFee) {
        const newTotal = payment.registrationFee + payment.tuitionFee + transportFee + payment.penaltyFee;
        await db.update(schema.monthlyPayment)
          .set({ transportFee, totalMonthlyFee: newTotal })
          .where(eq(schema.monthlyPayment.id, payment.id));
        count++;
      }
    }
  }
  console.log('Updated ' + count + ' payment records.');
}
run().catch(console.error);
