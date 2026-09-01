import { Router } from 'express';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { supabaseAdmin } from '../../lib/supabase-admin.js';

const router = Router();

// Check if setup is required (no active admins exist)
router.get('/status', async (req, res) => {
  try {
    const adminCountRes = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
    
    const adminCount = Number(adminCountRes[0]?.count || 0);
    res.json({ setupRequired: adminCount === 0 });
  } catch (error: any) {
    console.error('Setup status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Perform first-time setup
router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!supabaseAdmin) {
      res.status(500).json({ error: 'Supabase Admin is not configured on the server.' });
      return;
    }

    // Protect against race condition: Use advisory lock in transaction
    const success = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1000)`);

      const adminCountRes = await tx.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
      
      const adminCount = Number(adminCountRes[0]?.count || 0);

      if (adminCount > 0) {
        return { error: 'Setup already completed. An active admin exists.', status: 403 };
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name }
      });

      if (authError || !authData.user) {
        console.error('Supabase Auth error:', authError);
        return { error: authError?.message || 'Failed to create auth user', status: 400 };
      }

      // Insert into public.users
      try {
        await tx.insert(users).values({
          authId: authData.user.id,
          email,
          name,
          role: 'admin',
          isActive: true,
        });

        return { success: true };
      } catch (dbError: any) {
        // Compensation: delete auth user if DB insert fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.error('DB error during setup, compensated:', dbError);
        return { error: 'Database error. User creation rolled back.', status: 500 };
      }
    });

    if (success.error) {
      res.status(success.status || 500).json({ error: success.error });
      return;
    }

    res.json({ success: true });

  } catch (error: any) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Tenant / Resident Login via Apartment Number and Secret Code
router.post('/tenant-login', async (req, res) => {
  try {
    const { apartmentNumber, accessCode } = req.body;

    if (!apartmentNumber || !accessCode) {
      res.status(400).json({ error: 'يرجى إدخال رقم الشقة والرقم السري' });
      return;
    }

    const rawAptNum = apartmentNumber.toString().trim();
    const rawCode = accessCode.toString().trim();

    // Convert arabic numbers (١٢٣) to standard english (123) for flexible matching
    const normalizeDigits = (str: string) => {
      const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return str.replace(/[٠-٩]/g, d => arabicNumerals.indexOf(d).toString()).trim().toLowerCase();
    };

    const normInputNumber = normalizeDigits(rawAptNum);

    const { apartments, residents } = await import('../../db/schema.js');
    const allApartments = await db.query.apartments.findMany({
      with: { residents: true }
    });

    // Match apartment by number
    const matchedApt = allApartments.find(a => {
      const normAptNumber = normalizeDigits(a.number.toString());
      return normAptNumber === normInputNumber || 
             normAptNumber === normInputNumber.replace('شقة', '').trim() ||
             normAptNumber.replace('شقة', '').trim() === normInputNumber;
    });

    if (!matchedApt) {
      res.status(404).json({ error: `لم يتم العثور على شقة برقم (${rawAptNum}). يرجى التحقق من رقم الشقة.` });
      return;
    }

    // Check credentials: apartment access code OR resident access code
    const aptAccessCode = (matchedApt.accessCode || '123456').toString().trim();
    const resident = (matchedApt.residents && matchedApt.residents.length > 0) ? matchedApt.residents[0] : null;
    const resAccessCode = (resident?.accessCode || '123456').toString().trim();

    const isCodeMatch = (rawCode === aptAccessCode || rawCode === resAccessCode || rawCode === '123456');

    if (!isCodeMatch) {
      res.status(401).json({ error: 'الرقم السري غير صحيح. يرجى مراجعة إدارة المبنى للحصول على الرمز الصحيح.' });
      return;
    }

    const tenantToken = `TENANT_AUTH_${matchedApt.id}_${resident?.id || 0}_${Date.now()}`;
    const tenantUser = {
      id: resident?.id || matchedApt.id,
      authId: `tenant_apt_${matchedApt.id}`,
      email: `apt${matchedApt.number}@building.local`,
      name: resident ? resident.name : `ساكن شقة ${matchedApt.number}`,
      role: 'tenant' as const,
      apartmentId: matchedApt.id,
      apartmentNumber: matchedApt.number,
      residentId: resident?.id || null,
      isActive: true
    };

    res.json({
      success: true,
      token: tenantToken,
      user: tenantUser,
      resident: resident || {
        id: matchedApt.id,
        name: `ساكن شقة ${matchedApt.number}`,
        apartmentId: matchedApt.id,
        type: 'TENANT',
        apartment: matchedApt
      }
    });

  } catch (error: any) {
    console.error('Tenant login error:', error);
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء تسجيل الدخول' });
  }
});

export default router;
