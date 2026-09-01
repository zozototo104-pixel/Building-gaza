import { Router } from 'express';
import { db } from '../../db/index.js';
import { users } from '../../db/schema.js';
import { eq, and, sql, not } from 'drizzle-orm';
import { supabaseAdmin } from '../../lib/supabase-admin.js';

const router = Router();

// Require admin middleware
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.userRecord || req.userRecord.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

router.use(requireAdmin);

// List users
router.get('/', async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    res.json(allUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const validRoles = ['admin', 'manager', 'accountant', 'viewer', 'tenant'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email exists
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) {
      return res.status(400).json({ error: 'يوجد مستخدم مسجل بهذا البريد الإلكتروني.' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase Admin is not configured' });
    }

    // Generate random password or leave empty and send invite? 
    // We will use admin.createUser and send an invite, or just set a random password and send invite.
    // Supabase allows sending an invite email:
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name }
    });

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message || 'Failed to invite user' });
    }

    try {
      const newUser = await db.insert(users).values({
        authId: authData.user.id,
        email,
        name,
        role: role as any,
        isActive: true,
      }).returning();

      res.json(newUser[0]);
    } catch (dbError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error(dbError);
      res.status(500).json({ error: 'Database error. User creation rolled back.' });
    }

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user (change role, toggle active)
router.put('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role, isActive } = req.body;
    const currentUserId = (req as any).userRecord.id;

    const validRoles = ['admin', 'manager', 'accountant', 'viewer', 'tenant'];
    
    // Get target user
    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Protect last admin
    if (targetUser.role === 'admin' && (role !== 'admin' || isActive === false)) {
      // Trying to demote or disable an admin. Check if they are the last active admin.
      const isOk = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT pg_advisory_xact_lock(1001)`);
        const adminCountRes = await tx.select({ count: sql<number>`count(*)` })
          .from(users)
          .where(and(eq(users.role, 'admin'), eq(users.isActive, true)));
        const adminCount = Number(adminCountRes[0]?.count || 0);
        // If count is 1 and we are modifying that 1 admin, block it.
        if (adminCount <= 1 && targetUser.isActive) {
          return false;
        }
        return true;
      });

      if (!isOk) {
        return res.status(403).json({ error: 'لا يمكن تعطيل أو تغيير دور آخر مدير فعال في النظام.' });
      }
    }

    const updates: any = {};
    if (role && validRoles.includes(role)) updates.role = role;
    if (typeof isActive === 'boolean') updates.isActive = isActive;

    const updatedUser = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    res.json(updatedUser[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reset password invite
router.post('/:id/reset-password', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const targetUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase Admin is not configured' });
    }

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(targetUser.email);
    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
