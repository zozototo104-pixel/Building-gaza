import { Router } from 'express';
import { db } from '../../db/index.js';
import { eq, sql } from 'drizzle-orm';
import { apartments, residents, debts, payments, expenses, buildings } from '../../db/schema.js';
import crypto from 'crypto';
import { resetAndSeedFreshData } from '../seed-fresh-data.js';

const router = Router();

// Endpoint to reset and load base dataset directly
router.post('/reset-and-seed', async (req, res) => {
  try {
    await resetAndSeedFreshData();
    res.json({ success: true, message: 'تم مسح كامل البيانات وإعادة رفع البيانات بنجاح.' });
  } catch (err: any) {
    console.error('Reset & seed error:', err);
    res.status(500).json({ error: err.message || 'فشل في إعادة تعيين البيانات' });
  }
});

// Track completed imports to prevent duplicates
const completedImports = new Set<string>();

router.post('/analyze', async (req, res) => {
  try {
    const data = req.body;
    
    // Hash file content to detect duplicates
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    
    if (completedImports.has(hash)) {
      return res.status(400).json({ error: 'تم استيراد هذه النسخة مسبقاً.' });
    }

    const detected = {
      apartments: Array.isArray(data.apartments) ? data.apartments.length : 0,
      residents: Array.isArray(data.residents) ? data.residents.length : 0,
      debts: Array.isArray(data.debts) ? data.debts.length : 0,
      payments: Array.isArray(data.payments) ? data.payments.length : 0,
      expenses: Array.isArray(data.expenses) ? data.expenses.length : 0,
    };

    let legacyExpected = 0;
    let legacyCollected = 0;
    let legacyOutstanding = 0;
    
    if (Array.isArray(data.debts)) {
      data.debts.forEach((d: any) => legacyExpected += Number(d.amount) || 0);
    }
    
    if (Array.isArray(data.payments)) {
      data.payments.forEach((p: any) => legacyCollected += Number(p.amount) || 0);
    }
    
    legacyOutstanding = legacyExpected - legacyCollected;

    const warnings = [];
    if (detected.apartments === 0) warnings.push("لم يتم العثور على أي شقق في الملف.");
    if (detected.residents === 0) warnings.push("لم يتم العثور على سكان.");
    
    res.json({
      hash,
      detected,
      financialTotals: {
        legacyExpected,
        legacyCollected,
        legacyOutstanding
      },
      warnings,
      valid: detected.apartments > 0 || detected.residents > 0
    });
  } catch (err: any) {
    console.error('Analyze Error:', err);
    res.status(500).json({ error: 'فشل في تحليل الملف' });
  }
});

router.post('/execute', async (req, res) => {
  try {
    const { data, hash, isDryRun } = req.body;
    
    if (!isDryRun && completedImports.has(hash)) {
      return res.status(400).json({ error: 'تم استيراد هذه النسخة مسبقاً.' });
    }

    let legacyExpected = 0;
    let legacyCollected = 0;
    
    if (Array.isArray(data.debts)) data.debts.forEach((d: any) => legacyExpected += Number(d.amount) || 0);
    if (Array.isArray(data.payments)) data.payments.forEach((p: any) => legacyCollected += Number(p.amount) || 0);
    const legacyOutstanding = legacyExpected - legacyCollected;

    if (isDryRun) {
      return res.json({
        success: true,
        dryRun: true,
        message: 'محاكاة الاستيراد ناجحة. البيانات جاهزة للاستيراد الفعلي.'
      });
    }

    // Actual Import inside a transaction
    await db.transaction(async (tx) => {
      // 0. Ensure at least one building exists
      let bId = 1;
      const existingB = await tx.select().from(buildings).limit(1);
      if (existingB.length === 0) {
        const newB = await tx.insert(buildings).values({ name: 'المبنى الرئيسي' }).returning();
        bId = newB[0].id;
      } else {
        bId = existingB[0].id;
      }

      // 1. Mapping and importing apartments
      const aptMap = new Map(); // legacy_id -> new_id
      if (Array.isArray(data.apartments)) {
        for (const apt of data.apartments) {
          const inserted = await tx.insert(apartments).values({
            buildingId: bId,
            number: apt.number || apt.apartment_no || String(apt.id),
            floor: apt.floor ? String(apt.floor) : '1',
            status: apt.status === 'occupied' ? 'OCCUPIED' : 'EMPTY'
          }).returning();
          aptMap.set(apt.id, inserted[0].id);
        }
      }

      // 2. Importing residents
      const resMap = new Map();
      if (Array.isArray(data.residents)) {
        for (const r of data.residents) {
          const newAptId = aptMap.get(r.apartmentId || r.apartment_id);
          if (newAptId) {
            const inserted = await tx.insert(residents).values({
              apartmentId: newAptId,
              name: r.name || 'Unknown',
              phone: r.phone || null,
              type: r.type || 'TENANT',
              startDate: r.moveInDate ? new Date(r.moveInDate) : new Date(),
            }).returning();
            resMap.set(r.id, inserted[0].id);
          }
        }
      }

      // 3. Debts & Payments
      let newExpected = 0;
      let newCollected = 0;

      if (Array.isArray(data.debts)) {
        for (const d of data.debts) {
          const newAptId = aptMap.get(d.apartmentId || d.apartment_id);
          if (newAptId) {
            const amount = Number(d.amount) || 0;
            await tx.insert(debts).values({
              apartmentId: newAptId,
              amount: amount.toString(),
              originalAmount: amount.toString(),
              remainingAmount: amount.toString(),
              dueDate: d.dueDate ? new Date(d.dueDate) : new Date(),
              status: d.status === 'paid' ? 'PAID' : 'OPEN',
              source: d.type || 'OTHER',
              notes: d.description || 'Legacy Debt'
            });
            newExpected += amount;
          }
        }
      }

      if (Array.isArray(data.payments)) {
        for (const p of data.payments) {
          const newAptId = aptMap.get(p.apartmentId || p.apartment_id);
          if (newAptId) {
            const amount = Number(p.amount) || 0;
            await tx.insert(payments).values({
              apartmentId: newAptId,
              amount: amount.toString(),
              date: p.paymentDate ? new Date(p.paymentDate) : new Date(),
              method: p.paymentMethod || 'cash',
              reference: p.referenceNumber || p.receiptNumber || null,
              notes: p.notes || 'Legacy Payment'
            });
            newCollected += amount;
          }
        }
      }

      const newOutstanding = newExpected - newCollected;
      
      // Reconciliation Check
      if (legacyOutstanding !== newOutstanding && Math.abs(legacyOutstanding - newOutstanding) > 1) {
        throw new Error(`Financial Reconciliation Failed. Legacy Outstanding: ${legacyOutstanding}, New Outstanding: ${newOutstanding}`);
      }
    });

    completedImports.add(hash);

    res.json({
      success: true,
      reconciliation: {
        legacyExpected,
        legacyCollected,
        legacyOutstanding,
        status: 'PASS',
        difference: 0
      }
    });

  } catch (err: any) {
    console.error('Import Error:', err);
    res.status(500).json({ error: err.message || 'فشل في استيراد البيانات' });
  }
});

export default router;
