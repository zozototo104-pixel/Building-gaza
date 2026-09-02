import express from 'express';
import { supabaseAdmin as supabase } from '../src/lib/supabase-admin.js';
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';
import apiRoutes from '../src/server/routes/index.js';
import setupRoutes from '../src/server/routes/setup.js';

const app = express();
app.use(express.json());

// Middleware to verify Supabase Auth Token
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    if (!supabase) {
      throw new Error("Supabase is not configured on the server");
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw error || new Error("User not found");
    }

    let userRecord = await db.query.users.findFirst({
      where: eq(users.authId, user.id)
    });

    if (userRecord && !userRecord.isActive) {
      res.status(403).json({ error: 'Account is disabled' });
      return;
    }
    
    (req as any).user = user;
    (req as any).userRecord = userRecord;
    next();
  } catch (error) {
    console.error('Error verifying auth token', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Mount unauthenticated routes
app.use('/api/setup', setupRoutes);

app.get('/api/me', authenticateUser, async (req, res) => {
  const authId = (req as any).user.id;
  const email = (req as any).user.email;
  const name = (req as any).user.user_metadata?.ful_name || (req as any).user.user_metadata?.name || email?.split('@')[0] || 'Unknown';
  
  try {
    let userRecord = (req as any).userRecord;
    
    if (!userRecord) {
      // First time login for users NOT created by admin yet
      // This should be rare if we are inviting users, but we'll default them to viewer.
      const result = await db.insert(users).values({
        authId,
        email,
        name: name,
        role: 'viewer',
        isActive: true
      }).returning();
      userRecord = result[0];
    }
    
    res.json({ user: userRecord });
  } catch (err) {
    console.error("Error in /api/me:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.use('/api', authenticateUser, apiRoutes);

export default function handler(req: express.Request, res: express.Response) {
  return app(req, res);
}
