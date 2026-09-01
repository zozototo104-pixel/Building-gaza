import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { supabaseAdmin as supabase } from './src/lib/supabase-admin.js';
import { db } from './src/db/index.js';
import { users } from './src/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import apiRoutes from './src/server/routes/index.js';
import setupRoutes from './src/server/routes/setup.js';

// ES Module Path Resolution
const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath((import.meta as any).url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

async function ensureSchema() {
  try {
    await db.execute(sql`
      DO $$ 
      BEGIN
        BEGIN
          ALTER TABLE rent_contracts ALTER COLUMN apartment_id DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE rent_contracts ALTER COLUMN tenant_id DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE rent_contracts ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE rent_contracts ADD COLUMN IF NOT EXISTS tenant_phone VARCHAR(50);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE rent_contracts ADD COLUMN IF NOT EXISTS unit_description VARCHAR(255);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE rent_contracts ADD COLUMN IF NOT EXISTS paid_months JSONB;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- Residents statement document columns
        BEGIN
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS statement_file_url TEXT;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS statement_file_name VARCHAR(255);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS statement_file_type VARCHAR(100);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS statement_file_size VARCHAR(50);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS statement_uploaded_at TIMESTAMP;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS statement_notes TEXT;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS statement_documents JSONB;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- Access codes for Apartments & Residents
        BEGIN
          ALTER TABLE apartments ADD COLUMN IF NOT EXISTS access_code VARCHAR(100) DEFAULT '123456';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE residents ADD COLUMN IF NOT EXISTS access_code VARCHAR(100) DEFAULT '123456';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          UPDATE apartments SET access_code = '123456' WHERE access_code IS NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          UPDATE residents SET access_code = '123456' WHERE access_code IS NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- Services & Service Transactions
        BEGIN
          ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE services ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'BUILDING';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          CREATE TABLE IF NOT EXISTS service_transactions (
            id SERIAL PRIMARY KEY,
            service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
            service_name VARCHAR(255) NOT NULL,
            scope VARCHAR(50) DEFAULT 'BUILDING' NOT NULL,
            apartment_id INTEGER REFERENCES apartments(id) ON DELETE SET NULL,
            cost NUMERIC(12, 2) DEFAULT 0 NOT NULL,
            date TIMESTAMP DEFAULT NOW() NOT NULL,
            day_name VARCHAR(50),
            expense_id INTEGER REFERENCES expenses(id) ON DELETE SET NULL,
            debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL,
            is_paid BOOLEAN DEFAULT FALSE,
            payment_method VARCHAR(50),
            notes TEXT,
            attachment_url TEXT,
            created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          CREATE TABLE IF NOT EXISTS subscriptions (
            id SERIAL PRIMARY KEY,
            apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE NOT NULL,
            month VARCHAR(20) NOT NULL,
            due_amount NUMERIC(12, 2) DEFAULT 50 NOT NULL,
            paid_amount NUMERIC(12, 2) DEFAULT 0 NOT NULL,
            payment_method VARCHAR(50) DEFAULT 'نقدي' NOT NULL,
            collected_by VARCHAR(255),
            receipt_number VARCHAR(100),
            status VARCHAR(50) DEFAULT 'UNPAID' NOT NULL,
            notes TEXT,
            date TIMESTAMP DEFAULT NOW() NOT NULL,
            debt_id INTEGER REFERENCES debts(id) ON DELETE SET NULL,
            payment_id INTEGER REFERENCES payments(id) ON DELETE SET NULL,
            created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS fill_date TIMESTAMP DEFAULT NOW();
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS day_name VARCHAR(50);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS fill_time VARCHAR(50);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS liters_quantity NUMERIC(12, 2) DEFAULT 1000;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS manual_cycle_start VARCHAR(100);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS manual_cycle_end VARCHAR(100);
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'UNPAID';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS fill_status VARCHAR(50) DEFAULT 'SUCCESS';
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE water_readings ADD COLUMN IF NOT EXISTS stumble_reason TEXT;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        -- Community and Projects Tables
        BEGIN
          CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            start_date TIMESTAMP DEFAULT NOW(),
            budget NUMERIC(12, 2) DEFAULT 0,
            status VARCHAR(50) DEFAULT 'PLANNED' NOT NULL,
            manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            notes TEXT,
            attachment_url TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          CREATE TABLE IF NOT EXISTS announcements (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            date TIMESTAMP DEFAULT NOW() NOT NULL,
            audience VARCHAR(100) DEFAULT 'ALL',
            status VARCHAR(50) DEFAULT 'PUBLISHED' NOT NULL,
            attachment_url TEXT,
            created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          CREATE TABLE IF NOT EXISTS visits_gifts (
            id SERIAL PRIMARY KEY,
            type VARCHAR(100) NOT NULL,
            beneficiary VARCHAR(255) NOT NULL,
            amount NUMERIC(12, 2) DEFAULT 0 NOT NULL,
            date TIMESTAMP DEFAULT NOW() NOT NULL,
            description TEXT,
            attachment_url TEXT,
            created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          CREATE TABLE IF NOT EXISTS votes (
            id SERIAL PRIMARY KEY,
            question TEXT NOT NULL,
            options JSONB NOT NULL,
            start_date TIMESTAMP DEFAULT NOW() NOT NULL,
            end_date TIMESTAMP,
            audience VARCHAR(50) DEFAULT 'ALL',
            status VARCHAR(50) DEFAULT 'ACTIVE' NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          CREATE TABLE IF NOT EXISTS vote_responses (
            id SERIAL PRIMARY KEY,
            vote_id INTEGER REFERENCES votes(id) ON DELETE CASCADE NOT NULL,
            apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE NOT NULL,
            option_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        BEGIN
          CREATE TABLE IF NOT EXISTS meetings (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            date TIMESTAMP DEFAULT NOW() NOT NULL,
            location VARCHAR(255),
            attendees TEXT,
            agenda TEXT,
            decisions TEXT,
            notes TEXT,
            attachment_url TEXT,
            created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END $$;
    `);
  } catch (err) {
    console.error('Error verifying database columns:', err);
  }
}

async function startServer() {
  await ensureSchema();
  const app = express();
  const PORT = parseInt(process.env.PORT as string) || 3000;
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Middleware to verify Supabase Auth Token or Tenant Token
  const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    // Check if it is a Tenant Authentication Token
    if (token.startsWith('TENANT_AUTH_')) {
      try {
        const parts = token.split('_');
        const aptId = parseInt(parts[2]);
        const resId = parseInt(parts[3]);
        
        const { apartments, residents } = await import('./src/db/schema.js');
        const apt = await db.query.apartments.findFirst({
          where: eq(apartments.id, aptId),
          with: { residents: true }
        });
        
        if (!apt) {
          res.status(401).json({ error: 'Tenant session invalid' });
          return;
        }
        
        const resident = (apt.residents && apt.residents.find((r: any) => r.id === resId)) || (apt.residents && apt.residents[0]) || null;
        
        const tenantUserRecord = {
          id: resident?.id || apt.id,
          authId: `tenant_apt_${apt.id}`,
          email: `apt${apt.number}@building.local`,
          name: resident ? resident.name : `ساكن شقة ${apt.number}`,
          role: 'tenant',
          apartmentId: apt.id,
          apartmentNumber: apt.number,
          residentId: resident?.id || null,
          isActive: true
        };
        
        (req as any).user = { id: tenantUserRecord.authId, email: tenantUserRecord.email, user_metadata: { full_name: tenantUserRecord.name } };
        (req as any).userRecord = tenantUserRecord;
        next();
        return;
      } catch (err) {
        console.error('Error verifying tenant token:', err);
        res.status(401).json({ error: 'Tenant session invalid' });
        return;
      }
    }
    
    try {
      if (!supabase) throw new Error("Supabase is not configured on the server");
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        throw error || new Error("User not found");
      }
      
      let userRecord: any = await db.query.users.findFirst({
        where: eq(users.authId, user.id)
      });
      
      if (userRecord && userRecord.role === 'tenant') {
        const { residents } = await import('./src/db/schema.js');
        const residentRecord = await db.query.residents.findFirst({
          where: eq(residents.userId, userRecord.id)
        });
        if (residentRecord) {
          userRecord.apartmentId = residentRecord.apartmentId;
        }
      }

      if (userRecord && !userRecord.isActive) {
        res.status(403).json({ error: 'Account is disabled' });
        return;
      }
      
      (req as any).user = user;
      (req as any).userRecord = userRecord;
      next();
    } catch (error: any) {
      if (error?.message && (error.message.includes('invalid JWT') || error.message.includes('jwt expired'))) {
        res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
      } else {
        console.error('Error verifying auth token', error?.message || error);
        res.status(401).json({ error: 'Unauthorized' });
      }
    }
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Mount unauthenticated routes
  app.use('/api/setup', setupRoutes);
  
  app.get('/api/me', authenticateUser, async (req, res) => {
    const authId = (req as any).user.id;
    const email = (req as any).user.email;
    const name = (req as any).user.user_metadata?.full_name || (req as any).user.user_metadata?.name || email?.split('@')[0] || 'Unknown';
    
    try {
      let userRecord = (req as any).userRecord;
      
      if (!userRecord) {
        // First time login
        const result = await db.insert(users).values({
          authId,
          email,
          name: name,
          role: 'viewer', // Default to viewer
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
