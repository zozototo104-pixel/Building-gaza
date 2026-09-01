import { Router } from 'express';
import { db } from '../../db/index.js';
import { apartments, residents, buildings, services, serviceTransactions, subscriptions, debts, payments, waterReadings, credits, generalPumping, rentContracts, projects, cashFund, announcements, visitsGifts, notifications, expenses, paymentAllocations, votes, voteResponses, meetings } from '../../db/schema.js';
import { eq, desc, asc, sql, inArray, and, or, like } from 'drizzle-orm';

import { supabaseAdmin } from '../../lib/supabase-admin.js';

import setupRoutes from './setup.js';
import usersRoutes from './users.js';
import importRoutes from './import.js';


import { monthlyClosings } from '../../db/schema.js';

// Helper to check if a date falls in a closed month
async function checkMonthlyClosing(dateObj: Date | string | null | undefined) {
  if (!dateObj) return false;
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return false;
  const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const closed = await db.query.monthlyClosings.findFirst({
    where: eq(monthlyClosings.month, monthStr)
  });
  if (closed) {
    throw new Error(`لا يمكن إضافة أو تعديل بيانات في شهر مقفل (${monthStr}).`);
  }
}

const router = Router();

// Setup is public
router.use('/setup', setupRoutes);

// Users management (requires auth, and specifically admin)
router.use('/users', usersRoutes);

// Legacy Import
router.use('/import', importRoutes);

// Storage routes
router.post('/storage/upload-url', async (req, res) => {
  try {
    const { filename, bucketName } = req.body;
    if (!supabaseAdmin) throw new Error("Supabase is not configured on the server");
    
    // Admins and Managers can upload anywhere. Others might have restrictions.
    // Assuming bucketName is 'attachments'
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName || 'attachments')
      .createSignedUploadUrl(filename);
      
    if (error) throw error;
    res.json({ signedUrl: data.signedUrl, path: data.path, token: data.token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/storage/download-url', async (req, res) => {
  try {
    const { path, bucketName } = req.body;
    if (!supabaseAdmin) throw new Error("Supabase is not configured on the server");
    
    // Admins and Managers can view anything. 
    // Tenants can only view files related to their apartment/payments. (simplified for now)
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName || 'attachments')
      .createSignedUrl(path, 60 * 60); // 1 hour expiry
      
    if (error) throw error;
    res.json({ signedUrl: data.signedUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Building Information & Settings ---
router.get('/building', async (req, res) => {
  try {
    const existing = await db.select().from(buildings).limit(1);
    let building = existing[0];
    if (!building) {
      const created = await db.insert(buildings).values({
        name: 'برج الأمل السكني',
        address: ''
      }).returning();
      building = created[0];
    }
    res.json(building);
  } catch (error) {
    console.error('Error fetching building:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/building', async (req, res) => {
  try {
    const { name, address } = req.body;
    const existing = await db.select().from(buildings).limit(1);
    let building = existing[0];
    if (!building) {
      const created = await db.insert(buildings).values({
        name: name || 'العمارة السكنية',
        address: address || ''
      }).returning();
      building = created[0];
    } else {
      const updated = await db.update(buildings).set({
        name: name !== undefined ? name : building.name,
        address: address !== undefined ? address : building.address,
        updatedAt: new Date()
      }).where(eq(buildings.id, building.id)).returning();
      building = updated[0];
    }
    res.json(building);
  } catch (error) {
    console.error('Error updating building:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Dashboard ---
router.get('/dashboard', async (req, res) => {
  try {
    const apartmentsCount = await db.select({ count: sql<number>`count(*)` }).from(apartments);
    const residentsCount = await db.select({ count: sql<number>`count(*)` }).from(residents);
    const totalDebts = await db.select({ total: sql<number>`sum(remaining_amount)` }).from(debts).where(inArray(debts.status, ['OPEN', 'PARTIALLY_PAID']));
    
    // Calculate total fund balance (INCOME - EXPENSE)
    const incomeTotal = await db.select({ total: sql<number>`sum(amount)` }).from(cashFund).where(eq(cashFund.type, 'INCOME'));
    const expenseTotal = await db.select({ total: sql<number>`sum(amount)` }).from(cashFund).where(eq(cashFund.type, 'EXPENSE'));
    const currentBalance = (incomeTotal[0]?.total || 0) - (expenseTotal[0]?.total || 0);

    // Pumping metrics
    const pumpingStats = await db.select({
      count: sql<number>`count(*)`,
      totalConsumption: sql<number>`coalesce(sum(consumption), 0)`,
      totalCost: sql<number>`coalesce(sum(total_cost), 0)`
    }).from(generalPumping);

    // Recent pumping sessions
    const recentPumping = await db.query.generalPumping.findMany({
      limit: 4,
      orderBy: [desc(generalPumping.date)],
    });

    // Cash fund history for financial flow chart
    const cashTransactions = await db.select().from(cashFund).orderBy(asc(cashFund.date));
    
    // Group cash transactions by month
    const monthlyMap: Record<string, { income: number; expense: number }> = {};
    for (const tx of cashTransactions) {
      const d = new Date(tx.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expense: 0 };
      }
      const val = Number(tx.amount) || 0;
      if (tx.type === 'INCOME') {
        monthlyMap[monthKey].income += val;
      } else if (tx.type === 'EXPENSE') {
        monthlyMap[monthKey].expense += val;
      }
    }

    // Convert to sorted array with running cumulative balance
    const monthKeys = Object.keys(monthlyMap).sort();
    let cumulative = 0;
    const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    let financialFlow = monthKeys.map(key => {
      const [year, month] = key.split('-').map(Number);
      const data = monthlyMap[key];
      const net = data.income - data.expense;
      cumulative += net;
      return {
        monthKey: key,
        monthName: `${arabicMonths[month - 1]} ${year}`,
        income: Number(data.income.toFixed(2)),
        expense: Number(data.expense.toFixed(2)),
        net: Number(net.toFixed(2)),
        balance: Number(cumulative.toFixed(2)),
      };
    });

    // If no transactions yet, provide empty template for current month
    if (financialFlow.length === 0) {
      const now = new Date();
      financialFlow = [{
        monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        monthName: `${arabicMonths[now.getMonth()]} ${now.getFullYear()}`,
        income: Number(incomeTotal[0]?.total || 0),
        expense: Number(expenseTotal[0]?.total || 0),
        net: Number(currentBalance || 0),
        balance: Number(currentBalance || 0),
      }];
    }

    // Recent payments
    const recentPayments = await db.query.payments.findMany({
      limit: 5,
      orderBy: [desc(payments.createdAt)],
      with: {
        apartment: true,
        resident: true
      }
    });

    res.json({
      metrics: {
        apartments: apartmentsCount[0].count,
        residents: residentsCount[0].count,
        totalDebts: totalDebts[0].total || 0,
        fundBalance: currentBalance || 0,
        totalIncome: incomeTotal[0]?.total || 0,
        totalExpense: expenseTotal[0]?.total || 0,
        pumpingCount: pumpingStats[0]?.count || 0,
        pumpingConsumption: pumpingStats[0]?.totalConsumption || 0,
        pumpingCost: pumpingStats[0]?.totalCost || 0,
      },
      financialFlow,
      recentPumping,
      recentPayments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Apartments ---
router.get('/apartments', async (req, res) => {
  try {
    const allApartments = await db.query.apartments.findMany({
      with: {
        residents: true
      },
      orderBy: (apartments, { asc }) => [asc(apartments.number)],
    });
    res.json(allApartments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/apartments', async (req, res) => {
  try {
    const { number, floor, status, waterMeterReading, residentId, accessCode } = req.body;

    const existing = await db.query.apartments.findFirst({
      where: eq(apartments.number, number)
    });
    if (existing) {
      return res.status(400).json({ error: 'رقم الشقة موجود مسبقاً' });
    }
    
    // Check if building exists, if not create default
    let building: any = await db.query.buildings.findFirst();
    if (!building) {
      const bRes = await db.insert(buildings).values({ name: 'المبنى الرئيسي' }).returning();
      building = bRes[0];
    }

    const newApartment = await db.insert(apartments).values({
      buildingId: building.id as number,
      number,
      floor,
      status: status || (residentId ? 'OCCUPIED' : 'EMPTY'),
      waterMeterReading: waterMeterReading ? waterMeterReading.toString() : '0',
      accessCode: accessCode ? accessCode.toString().trim() : '123456',
    }).returning();

    // If residentId was provided, link the resident to this apartment
    if (residentId) {
      await db.update(residents).set({
        apartmentId: newApartment[0].id,
        updatedAt: new Date()
      }).where(eq(residents.id, parseInt(residentId)));
    }
    
    res.json(newApartment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Apartment
router.put('/apartments/:id', async (req, res) => {
  try {
    const aptId = parseInt(req.params.id);
    const { number, floor, status, waterMeterReading, residentId, accessCode } = req.body;

    const existing = await db.query.apartments.findFirst({
      where: eq(apartments.id, aptId)
    });
    if (!existing) {
      return res.status(404).json({ error: 'الشقة غير موجودة' });
    }

    // If number changed, verify uniqueness
    if (number && number !== existing.number) {
      const duplicate = await db.query.apartments.findFirst({
        where: eq(apartments.number, number)
      });
      if (duplicate) {
        return res.status(400).json({ error: 'رقم الشقة موجود مسبقاً' });
      }
    }

    const updated = await db.update(apartments).set({
      ...(number !== undefined && { number }),
      ...(floor !== undefined && { floor }),
      ...(status !== undefined && { status }),
      ...(waterMeterReading !== undefined && { waterMeterReading: waterMeterReading.toString() }),
      ...(accessCode !== undefined && { accessCode: accessCode ? accessCode.toString().trim() : '123456' }),
      updatedAt: new Date()
    }).where(eq(apartments.id, aptId)).returning();

    // If residentId is passed, link or unlink
    if (residentId !== undefined) {
      if (residentId) {
        await db.update(residents).set({
          apartmentId: aptId,
          updatedAt: new Date()
        }).where(eq(residents.id, parseInt(residentId)));
        
        // Auto mark occupied
        await db.update(apartments).set({ status: 'OCCUPIED' }).where(eq(apartments.id, aptId));
      }
    }

    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete Apartment
router.delete('/apartments/:id', async (req, res) => {
  try {
    const aptId = parseInt(req.params.id);
    
    // Unlink residents
    await db.update(residents).set({ apartmentId: null }).where(eq(residents.apartmentId, aptId));
    // Delete allocations for debts of this apt
    const aptDebts = await db.query.debts.findMany({ where: eq(debts.apartmentId, aptId) });
    for (const d of aptDebts) {
      await db.delete(paymentAllocations).where(eq(paymentAllocations.debtId, d.id));
    }
    // Delete debts
    await db.delete(debts).where(eq(debts.apartmentId, aptId));
    // Delete payments
    await db.delete(payments).where(eq(payments.apartmentId, aptId));
    // Delete water readings
    await db.delete(waterReadings).where(eq(waterReadings.apartmentId, aptId));
    // Delete credits
    await db.delete(credits).where(eq(credits.apartmentId, aptId));
    // Delete rent contracts
    await db.delete(rentContracts).where(eq(rentContracts.apartmentId, aptId));
    
    // Finally delete apartment
    await db.delete(apartments).where(eq(apartments.id, aptId));
    
    res.json({ success: true, message: 'تم حذف الشقة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Residents ---
router.get('/residents', async (req, res) => {
  try {
    const allResidents = await db.query.residents.findMany({
      with: {
        apartment: true
      },
      orderBy: (residents, { asc }) => [asc(residents.name)],
    });

    // Also calculate credit balance for each resident
    const allCredits = await db.query.credits.findMany();
    const result = allResidents.map(r => {
      const residentCredits = allCredits.filter(c => 
        (c.residentId === r.id) || (r.apartmentId && c.apartmentId === r.apartmentId)
      );
      const creditBalance = residentCredits.reduce((acc, curr) => acc + (parseFloat(String(curr.remainingAmount || '0')) || 0), 0);
      return {
        ...r,
        creditBalance: Number(creditBalance.toFixed(2))
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/residents', async (req, res) => {
  try {
    const { name, phone, type, apartmentId, familyMembers, startDate, notes, accessCode } = req.body;
    
    const parsedAptId = apartmentId ? parseInt(apartmentId) : null;

    const newResident = await db.insert(residents).values({
      name,
      phone,
      type: type || 'TENANT',
      apartmentId: parsedAptId,
      familyMembers: familyMembers ? parseInt(familyMembers) : 1,
      startDate: startDate ? new Date(startDate) : null,
      notes: notes || null,
      accessCode: accessCode ? accessCode.toString().trim() : '123456',
    }).returning();
    
    // If assigned to an apartment, set that apartment's status to OCCUPIED
    if (parsedAptId) {
      await db.update(apartments).set({
        status: 'OCCUPIED',
        updatedAt: new Date()
      }).where(eq(apartments.id, parsedAptId));
    }

    res.json(newResident[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Update Resident
router.put('/residents/:id', async (req, res) => {
  try {
    const residentId = parseInt(req.params.id);
    const { name, phone, type, apartmentId, familyMembers, startDate, notes, accessCode } = req.body;

    const existing = await db.query.residents.findFirst({
      where: eq(residents.id, residentId)
    });
    if (!existing) {
      return res.status(404).json({ error: 'الساكن غير موجود' });
    }

    const newAptId = apartmentId !== undefined ? (apartmentId ? parseInt(apartmentId) : null) : existing.apartmentId;

    const updated = await db.update(residents).set({
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(type !== undefined && { type }),
      ...(apartmentId !== undefined && { apartmentId: newAptId }),
      ...(familyMembers !== undefined && { familyMembers: parseInt(familyMembers) || 1 }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(notes !== undefined && { notes }),
      ...(accessCode !== undefined && { accessCode: accessCode ? accessCode.toString().trim() : '123456' }),
      updatedAt: new Date()
    }).where(eq(residents.id, residentId)).returning();

    // Update apartment occupancy status
    if (newAptId) {
      await db.update(apartments).set({
        status: 'OCCUPIED',
        updatedAt: new Date()
      }).where(eq(apartments.id, newAptId));
    }

    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete Resident
router.delete('/residents/:id', async (req, res) => {
  try {
    const residentId = parseInt(req.params.id);
    
    const existing = await db.query.residents.findFirst({
      where: eq(residents.id, residentId)
    });
    if (!existing) {
      return res.status(404).json({ error: 'الساكن غير موجود' });
    }

    // Unlink resident from debts and payments
    await db.update(debts).set({ residentId: null }).where(eq(debts.residentId, residentId));
    await db.update(payments).set({ residentId: null }).where(eq(payments.residentId, residentId));
    await db.update(credits).set({ residentId: null }).where(eq(credits.residentId, residentId));
    await db.delete(rentContracts).where(eq(rentContracts.tenantId, residentId));

    // Delete resident
    await db.delete(residents).where(eq(residents.id, residentId));

    // If apartment has no other residents, check if we should update apartment status
    if (existing.apartmentId) {
      const remainingResidents = await db.query.residents.findMany({
        where: eq(residents.apartmentId, existing.apartmentId)
      });
      if (remainingResidents.length === 0) {
        await db.update(apartments).set({ status: 'EMPTY' }).where(eq(apartments.id, existing.apartmentId));
      }
    }

    res.json({ success: true, message: 'تم حذف الساكن بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Upload / Add Document to Resident Profile (Excel, Word, PDF)
router.post('/residents/:id/documents', async (req: any, res: any) => {
  try {
    const residentId = parseInt(req.params.id);
    const { title, fileName, fileType, fileSize, fileData, notes } = req.body;

    if (!fileData || !fileName) {
      return res.status(400).json({ error: 'الملف واسم الملف مطلوبان' });
    }

    const resident = await db.query.residents.findFirst({
      where: eq(residents.id, residentId)
    });

    if (!resident) {
      return res.status(404).json({ error: 'الساكن غير موجود' });
    }

    const existingDocs: any[] = Array.isArray(resident.statementDocuments) ? resident.statementDocuments : [];
    
    const newDocId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newDoc = {
      id: newDocId,
      title: title || fileName,
      fileName,
      fileType: fileType || 'application/octet-stream',
      fileSize: fileSize || '',
      fileData,
      notes: notes || '',
      uploadedAt: new Date().toISOString(),
      uploadedBy: req.userRecord?.name || 'الإدارة'
    };

    const updatedDocs = [newDoc, ...existingDocs];

    const updatedResident = await db.update(residents).set({
      statementDocuments: updatedDocs,
      statementFileUrl: fileData,
      statementFileName: fileName,
      statementFileType: fileType,
      statementFileSize: fileSize,
      statementUploadedAt: new Date(),
      statementNotes: notes || title || '',
      updatedAt: new Date()
    }).where(eq(residents.id, residentId)).returning();

    res.json({
      success: true,
      document: newDoc,
      resident: updatedResident[0]
    });
  } catch (error) {
    console.error('Error uploading resident document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Delete a Document from Resident Profile
router.delete('/residents/:id/documents/:docId', async (req: any, res: any) => {
  try {
    const residentId = parseInt(req.params.id);
    const docId = req.params.docId;

    const resident = await db.query.residents.findFirst({
      where: eq(residents.id, residentId)
    });

    if (!resident) {
      return res.status(404).json({ error: 'الساكن غير موجود' });
    }

    const existingDocs: any[] = Array.isArray(resident.statementDocuments) ? resident.statementDocuments : [];
    const filteredDocs = existingDocs.filter(d => d.id !== docId);

    const latestDoc = filteredDocs[0] || null;

    const updatedResident = await db.update(residents).set({
      statementDocuments: filteredDocs,
      statementFileUrl: latestDoc ? latestDoc.fileData : null,
      statementFileName: latestDoc ? latestDoc.fileName : null,
      statementFileType: latestDoc ? latestDoc.fileType : null,
      statementFileSize: latestDoc ? latestDoc.fileSize : null,
      statementUploadedAt: latestDoc ? new Date(latestDoc.uploadedAt) : null,
      statementNotes: latestDoc ? latestDoc.notes : null,
      updatedAt: new Date()
    }).where(eq(residents.id, residentId)).returning();

    res.json({
      success: true,
      resident: updatedResident[0]
    });
  } catch (error) {
    console.error('Error deleting resident document:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Resident / Tenant Portal Endpoint ---
router.get('/my-portal', async (req: any, res: any) => {
  try {
    const requestedResidentId = req.query.residentId ? parseInt(req.query.residentId as string) : null;
    const userRecord = (req as any).userRecord;

    // Fetch all residents with apartment details
    const allResidents = await db.query.residents.findMany({
      with: {
        apartment: true,
      },
      orderBy: (residents, { asc }) => [asc(residents.name)],
    });

    let currentResident: any = null;

    if (requestedResidentId) {
      currentResident = allResidents.find(r => r.id === requestedResidentId);
    }

    if (!currentResident) {
      if (userRecord?.role === 'tenant') {
        if (userRecord.residentId) {
          currentResident = allResidents.find(r => r.id === userRecord.residentId);
        }
        if (!currentResident && userRecord.apartmentId) {
          currentResident = allResidents.find(r => r.apartmentId === userRecord.apartmentId);
        }
      } else {
        // Admin / Manager / Viewer: default to first resident or null
        currentResident = allResidents[0] || null;
      }
    }

    // If still no resident record found (e.g., virtual tenant on apartment)
    if (!currentResident && userRecord?.apartmentId) {
      const apt = await db.query.apartments.findFirst({
        where: eq(apartments.id, userRecord.apartmentId),
      });
      if (apt) {
        currentResident = {
          id: apt.id,
          name: userRecord.name || `ساكن شقة ${apt.number}`,
          phone: '',
          type: 'TENANT',
          apartmentId: apt.id,
          apartment: apt,
          statementDocuments: [],
        };
      }
    }

    let debtsList: any[] = [];
    let creditsList: any[] = [];
    let contractsList: any[] = [];
    let announcementsList: any[] = [];

    if (currentResident) {
      const resId = currentResident.id;
      const aptId = currentResident.apartmentId;

      // Debts
      const allDebts = await db.query.debts.findMany({
        orderBy: [desc(debts.createdAt)],
      });
      debtsList = allDebts.filter(d => 
        (aptId && d.apartmentId === aptId) || (d.residentId === resId)
      );

      // Credits
      const allCredits = await db.query.credits.findMany({
        orderBy: [desc(credits.createdAt)],
      });
      creditsList = allCredits.filter(c => 
        (aptId && c.apartmentId === aptId) || (c.residentId === resId)
      );

      // Contracts
      const allContracts = await db.query.rentContracts.findMany({
        orderBy: [desc(rentContracts.createdAt)],
      });
      contractsList = allContracts.filter(c => 
        (aptId && c.apartmentId === aptId) || 
        (c.tenantId === resId) || 
        (currentResident.name && c.tenantName && c.tenantName.trim().toLowerCase() === currentResident.name.trim().toLowerCase())
      );
    }

    // Announcements
    const allAnnouncements = await db.query.announcements.findMany({
      where: eq(announcements.status, 'PUBLISHED'),
      orderBy: [desc(announcements.date)],
    });

    const isOwner = currentResident?.type === 'OWNER';
    announcementsList = allAnnouncements.filter(a => {
      if (!a.audience || a.audience === 'ALL') return true;
      if (isOwner && (a.audience === 'OWNERS' || a.audience === 'OWNER')) return true;
      if (!isOwner && (a.audience === 'TENANTS' || a.audience === 'TENANT')) return true;
      return false;
    });

    res.json({
      resident: currentResident,
      allResidents,
      debts: debtsList,
      credits: creditsList,
      contracts: contractsList,
      announcements: announcementsList,
    });
  } catch (error: any) {
    console.error('Error fetching portal data:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
});

// --- Services (دليل وتعريف الخدمات) ---
router.get('/services', async (req, res) => {
  try {
    const allServices = await db.query.services.findMany({
      with: {
        transactions: {
          with: {
            apartment: true
          }
        }
      },
      orderBy: (services, { asc }) => [asc(services.name)],
    });
    res.json(allServices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/services', async (req, res) => {
  try {
    const { name, description, scope, type, frequency, amount, startDate, isActive, notes } = req.body;
    
    let building: any = await db.query.buildings.findFirst();
    if (!building) {
      const bRes = await db.insert(buildings).values({ name: 'المبنى الرئيسي' }).returning();
      building = bRes[0];
    }

    const newService = await db.insert(services).values({
      buildingId: building.id as number,
      name,
      description: description || null,
      scope: scope || 'BUILDING',
      type: type || 'FIXED',
      frequency: frequency || 'MONTHLY',
      amount: (amount || 0).toString(),
      startDate: startDate ? new Date(startDate) : null,
      isActive: isActive !== false,
      notes: notes || null
    }).returning();
    
    res.json(newService[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, scope, type, frequency, amount, startDate, isActive, notes } = req.body;
    
    const updated = await db.update(services).set({
      name,
      description: description !== undefined ? description : undefined,
      scope: scope || 'BUILDING',
      type: type || 'FIXED',
      frequency: frequency || 'MONTHLY',
      amount: amount !== undefined ? amount.toString() : undefined,
      startDate: startDate ? new Date(startDate) : null,
      isActive: isActive !== undefined ? isActive : true,
      notes: notes !== undefined ? notes : undefined,
      updatedAt: new Date()
    }).where(eq(services.id, id)).returning();
    
    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/services/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(services).where(eq(services.id, id));
    res.json({ success: true, message: 'تم حذف الخدمة بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Service Transactions (معاملات الخدمات) ---
router.get('/service-transactions', async (req, res) => {
  try {
    const transactions = await db.query.serviceTransactions.findMany({
      with: {
        service: true,
        apartment: {
          with: {
            residents: true
          }
        },
        expense: true,
        debt: true,
        createdBy: true
      },
      orderBy: (serviceTransactions, { desc }) => [desc(serviceTransactions.date), desc(serviceTransactions.id)],
    });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/service-transactions', async (req, res) => {
  try {
    const { 
      serviceId, 
      serviceName: customServiceName, 
      scope, 
      apartmentId, 
      cost, 
      date, 
      dayName, 
      notes, 
      isPaid, 
      paymentMethod,
      deductFromCredit 
    } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    await checkMonthlyClosing(parsedDate);

    let finalServiceName = customServiceName || 'خدمة عامة';
    if (serviceId) {
      const foundService = await db.query.services.findFirst({
        where: eq(services.id, parseInt(serviceId))
      });
      if (foundService) {
        finalServiceName = foundService.name;
      }
    }

    const numCost = Math.max(0, parseFloat(cost) || 0);
    const finalScope = scope || 'BUILDING';
    const targetAptId = apartmentId ? parseInt(apartmentId) : null;
    let expenseId: number | null = null;
    let debtId: number | null = null;
    let transactionPaid = Boolean(isPaid);

    // 1. If Scope is BUILDING: Automatically record as building Expense and deduct from Cash Fund
    if (finalScope === 'BUILDING' && numCost > 0) {
      let building = await db.query.buildings.findFirst();
      const expRes = await db.insert(expenses).values({
        buildingId: (building?.id || 1) as number,
        category: 'خدمات وصيانة المبنى',
        description: `معاملة خدمة للمبنى: ${finalServiceName}${notes ? ' - ' + notes : ''}`,
        amount: numCost.toFixed(2),
        date: parsedDate,
        method: paymentMethod || 'CASH',
        notes: notes || null,
        createdById: (req as any).userRecord?.id
      }).returning();
      
      expenseId = expRes[0].id;

      // Deduct from Cash Fund Ledger
      await db.insert(cashFund).values({
        type: 'EXPENSE',
        amount: numCost.toFixed(2),
        date: parsedDate,
        source: 'EXPENSE',
        referenceId: expenseId,
        notes: `مصروف معاملة خدمة المبنى: ${finalServiceName}`,
        createdById: (req as any).userRecord?.id
      });
    }

    // 2. If Scope is APARTMENT: Check if deducted from credit, paid immediately, or recorded as debt
    if (finalScope === 'APARTMENT' && targetAptId && numCost > 0) {
      let targetResidentId: number | null = null;
      const apt = await db.query.apartments.findFirst({
        where: eq(apartments.id, targetAptId),
        with: { residents: true }
      });
      if (apt?.residents && apt.residents.length > 0) {
        targetResidentId = apt.residents[0].id;
      }

      if (deductFromCredit) {
        // Try to deduct from active credit
        const availableCredits = await db.query.credits.findMany({
          where: eq(credits.apartmentId, targetAptId),
          orderBy: [asc(credits.date)]
        });
        
        let remainingToDeduct = numCost;
        for (const cred of availableCredits) {
          const credRem = parseFloat(cred.remainingAmount);
          if (credRem > 0 && remainingToDeduct > 0) {
            const deduct = Math.min(credRem, remainingToDeduct);
            await db.update(credits)
              .set({ remainingAmount: (credRem - deduct).toFixed(2), updatedAt: new Date() })
              .where(eq(credits.id, cred.id));
            remainingToDeduct -= deduct;
          }
        }
        transactionPaid = true;
      } else if (transactionPaid) {
        // Paid immediately in cash -> record as paid debt and cash fund income
        const debtRes = await db.insert(debts).values({
          apartmentId: targetAptId,
          residentId: targetResidentId,
          amount: numCost.toFixed(2),
          originalAmount: numCost.toFixed(2),
          remainingAmount: '0.00',
          dueDate: parsedDate,
          status: 'PAID',
          source: 'SERVICE',
          notes: `معاملة خدمة مسددة: ${finalServiceName}${notes ? ' - ' + notes : ''}`
        }).returning();
        debtId = debtRes[0].id;

        const payRes = await db.insert(payments).values({
          apartmentId: targetAptId,
          residentId: targetResidentId,
          amount: numCost.toFixed(2),
          date: parsedDate,
          method: paymentMethod || 'CASH',
          notes: `سداد فوري لمعاملة خدمة: ${finalServiceName}`,
          createdById: (req as any).userRecord?.id
        }).returning();

        await db.insert(paymentAllocations).values({
          paymentId: payRes[0].id,
          debtId: debtId,
          amount: numCost.toFixed(2)
        });

        await db.insert(cashFund).values({
          type: 'INCOME',
          amount: numCost.toFixed(2),
          date: parsedDate,
          source: 'PAYMENT',
          referenceId: payRes[0].id,
          apartmentId: targetAptId,
          paymentMethod: paymentMethod || 'CASH',
          notes: `إيراد سداد خدمة شقة (${apt?.number || targetAptId}): ${finalServiceName}`,
          createdById: (req as any).userRecord?.id
        });
      } else {
        // Recorded as open debt on apartment
        const debtRes = await db.insert(debts).values({
          apartmentId: targetAptId,
          residentId: targetResidentId,
          amount: numCost.toFixed(2),
          originalAmount: numCost.toFixed(2),
          remainingAmount: numCost.toFixed(2),
          dueDate: parsedDate,
          status: 'OPEN',
          source: 'SERVICE',
          notes: `مطالبة معاملة خدمة: ${finalServiceName}${notes ? ' - ' + notes : ''}`
        }).returning();
        debtId = debtRes[0].id;
      }
    }

    // Insert Service Transaction record
    const newTx = await db.insert(serviceTransactions).values({
      serviceId: serviceId ? parseInt(serviceId) : null,
      serviceName: finalServiceName,
      scope: finalScope,
      apartmentId: targetAptId,
      cost: numCost.toFixed(2),
      date: parsedDate,
      dayName: dayName || null,
      expenseId: expenseId,
      debtId: debtId,
      isPaid: transactionPaid,
      paymentMethod: paymentMethod || (finalScope === 'BUILDING' ? 'CASH' : (transactionPaid ? 'CASH' : 'UNPAID')),
      notes: notes || null,
      createdById: (req as any).userRecord?.id
    }).returning();

    // Fetch complete transaction with relations
    const fullRecord = await db.query.serviceTransactions.findFirst({
      where: eq(serviceTransactions.id, newTx[0].id),
      with: {
        service: true,
        apartment: {
          with: {
            residents: true
          }
        },
        expense: true,
        debt: true,
        createdBy: true
      }
    });

    res.json(fullRecord);
  } catch (error: any) {
    console.error('Error creating service transaction:', error);
    res.status(400).json({ error: error.message || 'حدث خطأ أثناء حفظ المعاملة' });
  }
});

router.delete('/service-transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const tx = await db.query.serviceTransactions.findFirst({
      where: eq(serviceTransactions.id, id)
    });

    if (!tx) {
      return res.status(404).json({ error: 'المعاملة غير موجودة' });
    }

    await checkMonthlyClosing(tx.date);

    // If it was linked to an expense, delete expense & cash_fund entry
    if (tx.expenseId) {
      await db.delete(cashFund).where(
        and(eq(cashFund.source, 'EXPENSE'), eq(cashFund.referenceId, tx.expenseId))
      );
      await db.delete(expenses).where(eq(expenses.id, tx.expenseId));
    }

    // If it was linked to a debt, delete debt & allocations
    if (tx.debtId) {
      await db.delete(paymentAllocations).where(eq(paymentAllocations.debtId, tx.debtId));
      await db.delete(debts).where(eq(debts.id, tx.debtId));
    }

    await db.delete(serviceTransactions).where(eq(serviceTransactions.id, id));
    res.json({ success: true, message: 'تم حذف المعاملة وتحديث القيود المالية المرتبطة بها بنجاح' });
  } catch (error: any) {
    console.error('Error deleting service transaction:', error);
    res.status(400).json({ error: error.message || 'حدث خطأ أثناء حذف المعاملة' });
  }
});

// --- Subscriptions (الاشتراكات الشهرية) ---
router.get('/subscriptions', async (req, res) => {
  try {
    const allSubscriptions = await db.query.subscriptions.findMany({
      with: {
        apartment: {
          with: {
            residents: true
          }
        },
        debt: true,
        payment: true,
        createdBy: true
      },
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.month), desc(subscriptions.date), desc(subscriptions.id)],
    });
    res.json(allSubscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/subscriptions', async (req, res) => {
  try {
    const {
      apartmentId,
      month,
      dueAmount,
      paidAmount,
      paymentMethod,
      collectedBy,
      notes,
      date,
      deductFromCredit
    } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    await checkMonthlyClosing(parsedDate);

    const targetAptId = parseInt(apartmentId);
    if (!targetAptId) {
      return res.status(400).json({ error: 'يرجى اختيار الشقة المرتبطة بالاشتراك' });
    }

    const apt = await db.query.apartments.findFirst({
      where: eq(apartments.id, targetAptId),
      with: { residents: true }
    });

    if (!apt) {
      return res.status(404).json({ error: 'الشقة غير موجودة' });
    }

    const targetResidentId = apt.residents && apt.residents.length > 0 ? apt.residents[0].id : null;
    const numDue = Math.max(0, parseFloat(dueAmount) || 0);
    const numPaid = Math.max(0, parseFloat(paidAmount) || 0);
    const remainingDiff = Math.max(0, numDue - numPaid);
    const formattedMonth = month || new Date().toISOString().slice(0, 7);
    const receiptNum = `REC-SUB-${Date.now().toString().slice(-6)}`;

    let debtId: number | null = null;
    let paymentId: number | null = null;
    let status = 'UNPAID';

    if (numPaid >= numDue && numDue > 0) {
      status = 'PAID';
    } else if (numPaid > 0) {
      status = 'PARTIAL';
    } else {
      status = 'UNPAID';
    }

    // 1. If paid using resident's credit (رصيد دائن)
    if (deductFromCredit && numPaid > 0) {
      const availableCredits = await db.query.credits.findMany({
        where: eq(credits.apartmentId, targetAptId),
        orderBy: [asc(credits.date)]
      });

      let remainingToDeduct = numPaid;
      for (const cred of availableCredits) {
        const credRem = parseFloat(cred.remainingAmount);
        if (credRem > 0 && remainingToDeduct > 0) {
          const deduct = Math.min(credRem, remainingToDeduct);
          await db.update(credits)
            .set({ remainingAmount: (credRem - deduct).toFixed(2), updatedAt: new Date() })
            .where(eq(credits.id, cred.id));
          remainingToDeduct -= deduct;
        }
      }
    } else if (numPaid > 0) {
      // Paid in cash or bank transfer -> Record payment and income to cash fund
      const payRes = await db.insert(payments).values({
        apartmentId: targetAptId,
        residentId: targetResidentId,
        amount: numPaid.toFixed(2),
        date: parsedDate,
        method: paymentMethod || 'CASH',
        notes: `تحصيل اشتراك شهري (${formattedMonth}) - شقة ${apt.number}${collectedBy ? ' - المستلم: ' + collectedBy : ''}`,
        createdById: (req as any).userRecord?.id
      }).returning();
      paymentId = payRes[0].id;

      // Add to Cash Fund
      await db.insert(cashFund).values({
        type: 'INCOME',
        amount: numPaid.toFixed(2),
        date: parsedDate,
        source: 'PAYMENT',
        referenceId: paymentId,
        apartmentId: targetAptId,
        paymentMethod: paymentMethod || 'CASH',
        notes: `إيراد اشتراك شهري (${formattedMonth}) شقة ${apt.number} (إيصال #${receiptNum})`,
        createdById: (req as any).userRecord?.id
      });
    }

    // 2. If there is remaining unpaid amount, record as open debt on the apartment
    if (remainingDiff > 0) {
      const debtRes = await db.insert(debts).values({
        apartmentId: targetAptId,
        residentId: targetResidentId,
        amount: remainingDiff.toFixed(2),
        originalAmount: numDue.toFixed(2),
        remainingAmount: remainingDiff.toFixed(2),
        dueDate: parsedDate,
        status: numPaid > 0 ? 'PARTIALLY_PAID' : 'OPEN',
        source: 'SERVICE',
        notes: `متبقي اشتراك شهري شهر (${formattedMonth}) شقة ${apt.number}`
      }).returning();
      debtId = debtRes[0].id;
    }

    // 3. Create Subscription Record
    const newSub = await db.insert(subscriptions).values({
      apartmentId: targetAptId,
      month: formattedMonth,
      dueAmount: numDue.toFixed(2),
      paidAmount: numPaid.toFixed(2),
      paymentMethod: paymentMethod || 'نقدي',
      collectedBy: collectedBy || null,
      receiptNumber: receiptNum,
      status: status,
      notes: notes || null,
      date: parsedDate,
      debtId: debtId,
      paymentId: paymentId,
      createdById: (req as any).userRecord?.id
    }).returning();

    // Fetch full object with relations
    const fullSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, newSub[0].id),
      with: {
        apartment: {
          with: {
            residents: true
          }
        },
        debt: true,
        payment: true,
        createdBy: true
      }
    });

    res.json(fullSub);
  } catch (error: any) {
    console.error('Error recording subscription collection:', error);
    res.status(400).json({ error: error.message || 'حدث خطأ أثناء تسجيل تحصيل الاشتراك' });
  }
});

router.post('/subscriptions/generate-batch', async (req, res) => {
  try {
    const { month, dueAmount, notes } = req.body;
    const formattedMonth = month || new Date().toISOString().slice(0, 7);
    const numDue = Math.max(0, parseFloat(dueAmount) || 50);

    const allApts = await db.query.apartments.findMany({
      with: { residents: true }
    });

    let generatedCount = 0;
    for (const apt of allApts) {
      // Check if subscription already exists for this apartment & month
      const existing = await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.apartmentId, apt.id),
          eq(subscriptions.month, formattedMonth)
        )
      });

      if (!existing) {
        const targetResidentId = apt.residents && apt.residents.length > 0 ? apt.residents[0].id : null;
        
        // Create open debt
        const debtRes = await db.insert(debts).values({
          apartmentId: apt.id,
          residentId: targetResidentId,
          amount: numDue.toFixed(2),
          originalAmount: numDue.toFixed(2),
          remainingAmount: numDue.toFixed(2),
          dueDate: new Date(),
          status: 'OPEN',
          source: 'SERVICE',
          notes: `اشتراك شهري مستحق لشهر (${formattedMonth}) - شقة ${apt.number}`
        }).returning();

        // Create subscription entry
        await db.insert(subscriptions).values({
          apartmentId: apt.id,
          month: formattedMonth,
          dueAmount: numDue.toFixed(2),
          paidAmount: '0.00',
          paymentMethod: 'نقدي',
          status: 'UNPAID',
          notes: notes || `استحقاق اشتراك شهري ${formattedMonth}`,
          debtId: debtRes[0].id,
          createdById: (req as any).userRecord?.id
        });

        generatedCount++;
      }
    }

    res.json({ success: true, count: generatedCount, message: `تم توليد استحقاقات الاشتراك لـ ${generatedCount} شقة بنجاح لشهر ${formattedMonth}` });
  } catch (error: any) {
    console.error('Error generating batch subscriptions:', error);
    res.status(400).json({ error: error.message || 'حدث خطأ أثناء توليد الاشتراكات' });
  }
});

router.delete('/subscriptions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, id)
    });

    if (!sub) {
      return res.status(404).json({ error: 'سجل الاشتراك غير موجود' });
    }

    await checkMonthlyClosing(sub.date);

    // If payment exists, delete cashFund and payment
    if (sub.paymentId) {
      await db.delete(cashFund).where(
        and(eq(cashFund.source, 'PAYMENT'), eq(cashFund.referenceId, sub.paymentId))
      );
      await db.delete(paymentAllocations).where(eq(paymentAllocations.paymentId, sub.paymentId));
      await db.delete(payments).where(eq(payments.id, sub.paymentId));
    }

    // If debt exists, delete debt
    if (sub.debtId) {
      await db.delete(paymentAllocations).where(eq(paymentAllocations.debtId, sub.debtId));
      await db.delete(debts).where(eq(debts.id, sub.debtId));
    }

    await db.delete(subscriptions).where(eq(subscriptions.id, id));
    res.json({ success: true, message: 'تم حذف سجل الاشتراك وتحديث القيود المالية بنجاح' });
  } catch (error: any) {
    console.error('Error deleting subscription:', error);
    res.status(400).json({ error: error.message || 'حدث خطأ أثناء حذف سجل الاشتراك' });
  }
});

// --- Water ---
router.get('/water', async (req, res) => {
  try {
    const allReadings = await db.query.waterReadings.findMany({
      with: {
        apartment: true,
        debt: true
      },
      orderBy: (waterReadings, { desc }) => [desc(waterReadings.date)],
    });

    // Backwards compatibility check: if any reading doesn't have debtId, link it to existing water debt or create one
    for (const r of allReadings) {
      if (!r.debtId || !r.debt) {
        let foundDebt = await db.query.debts.findFirst({
          where: and(
            eq(debts.source, 'WATER'),
            or(
              eq(debts.sourceId, r.id),
              eq(debts.id, r.debtId || 0)
            )
          )
        });

        if (!foundDebt) {
          try {
            const costVal = parseFloat(r.amount || '10.00') || 10;
            const isPaid = r.isPaid;
            const remVal = isPaid ? 0 : costVal;
            const [newDebt] = await db.insert(debts).values({
              apartmentId: r.apartmentId,
              amount: costVal.toFixed(2),
              originalAmount: costVal.toFixed(2),
              remainingAmount: remVal.toFixed(2),
              dueDate: new Date(new Date(r.fillDate || r.date).getTime() + 14 * 24 * 60 * 60 * 1000),
              status: isPaid ? 'PAID' : 'OPEN',
              source: 'WATER',
              sourceId: r.id,
              notes: r.notes ? `تعبئة مياه (${r.litersQuantity || 1000} لتر) - ${r.notes}` : `تعبئة مياه (${r.litersQuantity || 1000} لتر)`
            }).returning();
            foundDebt = newDebt;
          } catch (err) {
            console.error('Failed to auto-create water debt:', err);
          }
        }

        if (foundDebt) {
          (r as any).debt = foundDebt;
          (r as any).debtId = foundDebt.id;
          try {
            await db.update(waterReadings).set({ debtId: foundDebt.id }).where(eq(waterReadings.id, r.id));
            if (!foundDebt.sourceId) {
              await db.update(debts).set({ sourceId: r.id }).where(eq(debts.id, foundDebt.id));
            }
          } catch (e) {
            // ignore
          }
        }
      }
    }

    res.json(allReadings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/water', async (req, res) => {
  try {
    await checkMonthlyClosing(new Date());
    const { 
      apartmentId, 
      fillDate, 
      dayName, 
      fillTime, 
      litersQuantity,
      previousReading, 
      newReading, 
      manualCycleStart, 
      manualCycleEnd,
      consumption, 
      unitPrice, 
      amount, 
      isPaid,
      fillStatus,
      stumbleReason,
      notes, 
      deductFromCredit 
    } = req.body;
    
    const parsedAptId = parseInt(apartmentId);
    const amountVal = parseFloat(amount) || 0;
    const consVal = parseFloat(consumption) || 0;
    const litersVal = parseFloat(litersQuantity) || 1000;
    const parsedFillDate = fillDate ? new Date(fillDate) : new Date();

    // Find resident for apartment if any
    const aptWithResidents = await db.query.apartments.findFirst({
      where: eq(apartments.id, parsedAptId),
      with: { residents: true }
    });
    const residentId = aptWithResidents?.residents?.[0]?.id || null;

    // 1. Create the debt record for this water bill
    const newDebt = await db.insert(debts).values({
      apartmentId: parsedAptId,
      residentId,
      amount: amountVal.toString(),
      originalAmount: amountVal.toString(),
      remainingAmount: amountVal.toString(),
      dueDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'OPEN',
      source: 'WATER',
      notes: notes ? `تعبئة مياه (${litersVal} لتر / ${consVal} وحدة) - ${notes}` : `تعبئة مياه (${litersVal} لتر)`
    }).returning();

    let finalIsPaid = false;
    let finalPaymentMethod = 'UNPAID';
    let deductedAmount = 0;
    let resultingDebt = newDebt[0];

    // 2. Handle immediate payment options:
    // Option A: Deduct from credit balance
    if (deductFromCredit && amountVal > 0) {
      const activeCredits = await db.query.credits.findMany({
        where: eq(credits.apartmentId, parsedAptId),
        orderBy: (credits, { asc }) => [asc(credits.date)]
      });

      const totalAvailCredit = activeCredits.reduce((sum, c) => sum + parseFloat(c.remainingAmount || '0'), 0);
      if (totalAvailCredit > 0) {
        deductedAmount = Math.min(amountVal, totalAvailCredit);
        let amountToDeduct = deductedAmount;

        for (const c of activeCredits) {
          const remaining = parseFloat(c.remainingAmount || '0');
          if (remaining > 0) {
            const deduct = Math.min(remaining, amountToDeduct);
            await db.update(credits).set({
              remainingAmount: (remaining - deduct).toString(),
              updatedAt: new Date()
            }).where(eq(credits.id, c.id));
            amountToDeduct -= deduct;
            if (amountToDeduct <= 0) break;
          }
        }

        // Record the credit payment
        const newPayment = await db.insert(payments).values({
          apartmentId: parsedAptId,
          residentId,
          amount: deductedAmount.toString(),
          method: 'CREDIT',
          reference: `WATER_FILL_${newDebt[0].id}`,
          notes: `خصم من الرصيد الدائن لتسوية فاتورة مياه (${litersVal} لتر)`,
          createdById: (req as any).userRecord?.id
        }).returning();

        // Create payment allocation
        await db.insert(paymentAllocations).values({
          paymentId: newPayment[0].id,
          debtId: newDebt[0].id,
          amount: deductedAmount.toString()
        });

        // Update debt status
        const remDebt = Math.max(0, amountVal - deductedAmount);
        const updatedDebts = await db.update(debts).set({
          remainingAmount: remDebt.toString(),
          status: remDebt <= 0 ? 'PAID' : 'PARTIALLY_PAID',
          updatedAt: new Date()
        }).where(eq(debts.id, newDebt[0].id)).returning();

        if (updatedDebts.length > 0) {
          resultingDebt = updatedDebts[0];
        }

        finalIsPaid = remDebt <= 0;
        finalPaymentMethod = 'CREDIT';
      }
    } 
    // Option B: User marked "تم الدفع — أضف المبلغ إلى الصندوق" (Cash Payment into Fund)
    else if (isPaid && amountVal > 0) {
      // 1. Record payment
      const newPayment = await db.insert(payments).values({
        apartmentId: parsedAptId,
        residentId,
        amount: amountVal.toString(),
        method: 'CASH',
        reference: `WATER_FILL_${newDebt[0].id}`,
        notes: `سداد نقدي عند تعبئة مياه (${litersVal} لتر)`,
        createdById: (req as any).userRecord?.id
      }).returning();

      // 2. Allocate payment to debt
      await db.insert(paymentAllocations).values({
        paymentId: newPayment[0].id,
        debtId: newDebt[0].id,
        amount: amountVal.toString()
      });

      // 3. Add to Cash Fund (Income)
      await db.insert(cashFund).values({
        type: 'INCOME',
        amount: amountVal.toString(),
        date: parsedFillDate,
        source: 'PAYMENT',
        referenceId: newPayment[0].id,
        apartmentId: parsedAptId,
        paymentMethod: 'CASH',
        notes: `سداد نقدي مباشر لتعبئة مياه شقة ${aptWithResidents?.number || parsedAptId}`,
        createdById: (req as any).userRecord?.id
      });

      // 4. Update Debt as PAID
      const updatedDebts = await db.update(debts).set({
        remainingAmount: '0',
        status: 'PAID',
        updatedAt: new Date()
      }).where(eq(debts.id, newDebt[0].id)).returning();

      if (updatedDebts.length > 0) {
        resultingDebt = updatedDebts[0];
      }

      finalIsPaid = true;
      finalPaymentMethod = 'CASH';
    }

    // 3. Create the water reading record linking the debtId and all details
    const newRecord = await db.insert(waterReadings).values({
      apartmentId: parsedAptId,
      fillDate: parsedFillDate,
      dayName: dayName || null,
      fillTime: fillTime || null,
      litersQuantity: litersVal.toString(),
      previousReading: (previousReading || 0).toString(),
      newReading: (newReading || 0).toString(),
      manualCycleStart: manualCycleStart || null,
      manualCycleEnd: manualCycleEnd || null,
      consumption: consVal.toString(),
      unitPrice: (unitPrice || 0).toString(),
      amount: amountVal.toString(),
      isPaid: finalIsPaid,
      paymentMethod: finalPaymentMethod,
      fillStatus: fillStatus || 'SUCCESS',
      stumbleReason: stumbleReason || null,
      notes: notes || null,
      debtId: newDebt[0].id
    }).returning();
    
    // Link debt sourceId to water reading id
    await db.update(debts).set({
      sourceId: newRecord[0].id
    }).where(eq(debts.id, newDebt[0].id));

    // 4. Update apartment water meter reading if newReading provided
    if (parseFloat(newReading) > 0) {
      await db.update(apartments).set({
        waterMeterReading: newReading.toString(),
        updatedAt: new Date()
      }).where(eq(apartments.id, parsedAptId));
    }
    
    res.json({
      ...newRecord[0],
      debtId: newDebt[0].id,
      debt: resultingDebt,
      deductedAmount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/water/:id', async (req, res) => {
  try {
    const readingId = parseInt(req.params.id);
    const reading = await db.query.waterReadings.findFirst({
      where: eq(waterReadings.id, readingId)
    });

    if (!reading) {
      res.status(404).json({ error: 'سجل التعبئة غير موجود' });
      return;
    }

    // Delete associated debt and allocations if any
    if (reading.debtId) {
      const debtAllocs = await db.query.paymentAllocations.findMany({
        where: eq(paymentAllocations.debtId, reading.debtId)
      });
      for (const alloc of debtAllocs) {
        await db.delete(paymentAllocations).where(eq(paymentAllocations.id, alloc.id));
        await db.delete(payments).where(eq(payments.id, alloc.paymentId));
        await db.delete(cashFund).where(eq(cashFund.referenceId, alloc.paymentId));
      }
      await db.delete(debts).where(eq(debts.id, reading.debtId));
    }

    await db.delete(waterReadings).where(eq(waterReadings.id, readingId));
    res.json({ success: true, message: 'تم حذف السجل بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف السجل' });
  }
});

router.put('/water/:id', async (req, res) => {
  try {
    const readingId = parseInt(req.params.id);
    const reading = await db.query.waterReadings.findFirst({
      where: eq(waterReadings.id, readingId)
    });

    if (!reading) {
      return res.status(404).json({ error: 'سجل التعبئة غير موجود' });
    }

    const {
      fillDate,
      dayName,
      fillTime,
      litersQuantity,
      previousReading,
      newReading,
      consumption,
      unitPrice,
      amount,
      notes,
      fillStatus,
      stumbleReason
    } = req.body;

    const parsedDate = fillDate ? new Date(fillDate) : reading.fillDate;
    await checkMonthlyClosing(parsedDate);

    const numAmount = amount !== undefined ? parseFloat(amount) : parseFloat(reading.amount || '0');

    // Update water reading
    const updatedReading = await db.update(waterReadings).set({
      ...(fillDate !== undefined && { fillDate: parsedDate }),
      ...(dayName !== undefined && { dayName }),
      ...(fillTime !== undefined && { fillTime }),
      ...(litersQuantity !== undefined && { litersQuantity: litersQuantity.toString() }),
      ...(previousReading !== undefined && { previousReading: previousReading.toString() }),
      ...(newReading !== undefined && { newReading: newReading.toString() }),
      ...(consumption !== undefined && { consumption: consumption.toString() }),
      ...(unitPrice !== undefined && { unitPrice: unitPrice.toString() }),
      ...(amount !== undefined && { amount: numAmount.toFixed(2) }),
      ...(notes !== undefined && { notes }),
      ...(fillStatus !== undefined && { fillStatus }),
      ...(stumbleReason !== undefined && { stumbleReason }),
    }).where(eq(waterReadings.id, readingId)).returning();

    // If associated debt exists, update debt amount and dates
    if (reading.debtId) {
      const existingDebt = await db.query.debts.findFirst({
        where: eq(debts.id, reading.debtId)
      });
      if (existingDebt) {
        const oldPaid = Math.max(0, parseFloat(existingDebt.originalAmount) - parseFloat(existingDebt.remainingAmount));
        const newRemaining = Math.max(0, numAmount - oldPaid);
        const newStatus = newRemaining <= 0 ? 'PAID' : (newRemaining < numAmount ? 'PARTIALLY_PAID' : 'OPEN');

        await db.update(debts).set({
          amount: numAmount.toFixed(2),
          originalAmount: numAmount.toFixed(2),
          remainingAmount: newRemaining.toFixed(2),
          status: newStatus,
          createdAt: parsedDate,
          dueDate: parsedDate,
          notes: notes || `تعبئة مياه - استهلاك ${consumption || reading.consumption} م³`,
          updatedAt: new Date()
        }).where(eq(debts.id, reading.debtId));
      }
    }

    res.json({ success: true, reading: updatedReading[0] });
  } catch (error: any) {
    console.error('Error in PUT /water/:id:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء تعديل سجل التعبئة' });
  }
});


// --- Debts Summary ---
router.get('/debts/summary', async (req, res) => {
  try {
    const userRole = (req as any).userRecord?.role;
    const userAptId = (req as any).userRecord?.apartmentId;
    let whereClause: any = inArray(debts.status, ['OPEN', 'PARTIALLY_PAID']);
    if (userRole === 'tenant' && userAptId) {
      whereClause = and(whereClause, eq(debts.apartmentId, userAptId));
    }
    
    // Fetch all apartments with their residents
    const allApts = await db.query.apartments.findMany({
      with: {
        residents: true
      },
      orderBy: (apartments, { asc }) => [asc(apartments.number)],
    });

    const allResidentsList = await db.query.residents.findMany({
      orderBy: (residents, { desc }) => [desc(residents.createdAt)]
    });

    const allCreditsList = await db.query.credits.findMany();

    const allDebts = await db.query.debts.findMany({
      where: whereClause,
      with: { apartment: true, resident: true },
      orderBy: (debts, { desc }) => [desc(debts.createdAt)]
    });
    
    // Group by apartment
    const summary = new Map();
    
    // Initialize map for all apartments
    allApts.forEach(apt => {
      // Find resident from apt.residents, or from allResidentsList
      let primaryResident = (apt.residents && apt.residents.length > 0) ? apt.residents[0] : null;
      if (!primaryResident) {
        primaryResident = allResidentsList.find(r => r.apartmentId === apt.id) || null;
      }

      // Calculate credit balance for this apartment and resident
      const aptCredits = allCreditsList.filter(c => 
        (c.apartmentId === apt.id) || (primaryResident && c.residentId === primaryResident.id)
      );
      const creditBalance = aptCredits.reduce((acc, curr) => acc + (parseFloat(String(curr.remainingAmount || '0')) || 0), 0);

      summary.set(apt.id, {
        apartmentId: apt.id,
        apartmentNumber: apt.number,
        floor: apt.floor || '-',
        residentId: primaryResident?.id || null,
        residentName: primaryResident?.name || 'لا يوجد ساكن مسجل',
        residentType: primaryResident ? primaryResident.type : null,
        residentPhone: primaryResident?.phone || '',
        creditBalance: Number(creditBalance.toFixed(2)),
        totalDebt: 0,
        itemsCount: 0,
        breakdown: {
          previous: 0,
          water: 0,
          service: 0,
          rent: 0,
          extra: 0,
        },
        details: []
      });
    });

    allDebts.forEach(debt => {
      const aptId = debt.apartmentId;
      if (!summary.has(aptId)) {
        // Calculate credit balance if apartment wasn't in list
        const aptCredits = allCreditsList.filter(c => 
          (c.apartmentId === aptId) || (debt.residentId && c.residentId === debt.residentId)
        );
        const creditBalance = aptCredits.reduce((acc, curr) => acc + (parseFloat(String(curr.remainingAmount || '0')) || 0), 0);

        summary.set(aptId, {
          apartmentId: aptId,
          apartmentNumber: debt.apartment?.number || '-',
          floor: debt.apartment?.floor || '-',
          residentId: debt.resident?.id || null,
          residentName: debt.resident?.name || 'غير معروف',
          residentType: debt.resident ? debt.resident.type : null,
          residentPhone: debt.resident?.phone || '',
          creditBalance: Number(creditBalance.toFixed(2)),
          totalDebt: 0,
          itemsCount: 0,
          breakdown: {
            previous: 0,
            water: 0,
            service: 0,
            rent: 0,
            extra: 0,
          },
          details: []
        });
      }
      
      const item = summary.get(aptId);

      // If item residentName was 'لا يوجد ساكن مسجل' but debt has resident info, update it
      if ((item.residentName === 'لا يوجد ساكن مسجل' || item.residentName === 'غير معروف') && debt.resident?.name) {
        item.residentId = debt.resident.id;
        item.residentName = debt.resident.name;
        item.residentType = debt.resident.type || item.residentType;
        item.residentPhone = debt.resident.phone || item.residentPhone;
      }

      const rem = parseFloat(debt.remainingAmount) || 0;
      const orig = parseFloat(debt.originalAmount) || 0;
      const paid = Math.max(0, orig - rem);

      item.totalDebt += rem;
      item.itemsCount += 1;

      // Classify breakdown
      const src = (debt.source || 'OTHER').toUpperCase();
      if (src === 'PREVIOUS' || src === 'PRIOR_DEBT' || src === 'PREV') {
        item.breakdown.previous += rem;
      } else if (src === 'WATER') {
        item.breakdown.water += rem;
      } else if (src === 'SERVICE' || src === 'SUBSCRIPTION') {
        item.breakdown.service += rem;
      } else if (src === 'RENT') {
        item.breakdown.rent += rem;
      } else {
        item.breakdown.extra += rem;
      }

      item.details.push({
        ...debt,
        paidAmount: paid.toFixed(2),
        source: debt.source || 'OTHER'
      });
    });
    
    // If tenant, only return that tenant's apt, otherwise return all or those with/without debt
    let result = Array.from(summary.values());
    if (userRole === 'tenant' && userAptId) {
      result = result.filter(r => r.apartmentId === userAptId);
    }
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Debts ---
router.get('/debts', async (req, res) => {
  try {
    const allDebts = await db.query.debts.findMany({
      with: {
        apartment: true,
        resident: true
      },
      orderBy: (debts, { desc }) => [desc(debts.createdAt)],
    });
    res.json(allDebts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/debts', async (req, res) => {
  try {
    const { apartmentId, residentId, amount, originalAmount, dueDate, date, createdAt, notes, source } = req.body;
    
    const aptId = parseInt(apartmentId);
    if (isNaN(aptId)) {
      return res.status(400).json({ error: 'يرجى تحديد الشقة بشكل صحيح' });
    }

    const numAmount = parseFloat(originalAmount || amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح أكبر من الصفر' });
    }
    const finalAmount = numAmount.toFixed(2);

    let parsedDueDate: Date | null = null;
    const rawDueDate = dueDate || date || createdAt;
    if (rawDueDate && typeof rawDueDate === 'string' && rawDueDate.trim() !== '') {
      const d = new Date(rawDueDate);
      if (!isNaN(d.getTime())) {
        parsedDueDate = d;
      }
    }

    let parsedCreatedAt: Date = new Date();
    const rawCreatedAt = createdAt || date || dueDate;
    if (rawCreatedAt && typeof rawCreatedAt === 'string' && rawCreatedAt.trim() !== '') {
      const d = new Date(rawCreatedAt);
      if (!isNaN(d.getTime())) {
        parsedCreatedAt = d;
      }
    }

    await checkMonthlyClosing(parsedDueDate || parsedCreatedAt || new Date());

    // Auto-discover active resident for the apartment if not provided
    let targetResidentId = residentId ? parseInt(residentId) : null;
    if ((!targetResidentId || isNaN(targetResidentId)) && aptId) {
      const apt = await db.query.apartments.findFirst({
        where: eq(apartments.id, aptId),
        with: {
          residents: true
        }
      });
      if (apt && apt.residents && apt.residents.length > 0) {
        targetResidentId = apt.residents[0].id;
      } else {
        targetResidentId = null;
      }
    }

    const newDebt = await db.insert(debts).values({
      apartmentId: aptId,
      residentId: targetResidentId,
      amount: finalAmount,
      originalAmount: finalAmount,
      remainingAmount: finalAmount,
      dueDate: parsedDueDate || parsedCreatedAt,
      createdAt: parsedCreatedAt,
      notes: notes ? notes.trim() : 'بند مالي جديد',
      source: source || 'OTHER',
      status: 'OPEN'
    }).returning();
    
    res.json(newDebt[0]);
  } catch (error: any) {
    console.error('Error in POST /debts:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء حفظ البند المالي' });
  }
});

// Update a single debt record
router.put('/debts/:id', async (req, res) => {
  try {
    const debtId = parseInt(req.params.id);
    const { amount, originalAmount, remainingAmount, notes, dueDate, date, createdAt, source, status } = req.body;
    
    const existing = await db.query.debts.findFirst({
      where: eq(debts.id, debtId)
    });
    if (!existing) {
      return res.status(404).json({ error: 'سجل الدين غير موجود' });
    }

    let parsedDueDate = existing.dueDate;
    if (dueDate !== undefined) {
      if (dueDate && typeof dueDate === 'string' && dueDate.trim() !== '') {
        const d = new Date(dueDate);
        parsedDueDate = isNaN(d.getTime()) ? null : d;
      } else if (dueDate === null || dueDate === '') {
        parsedDueDate = null;
      }
    }

    let parsedCreatedAt = existing.createdAt;
    const incomingCreated = createdAt || date;
    if (incomingCreated !== undefined) {
      if (incomingCreated && typeof incomingCreated === 'string' && incomingCreated.trim() !== '') {
        const d = new Date(incomingCreated);
        if (!isNaN(d.getTime())) {
          parsedCreatedAt = d;
        }
      }
    } else if (dueDate !== undefined && parsedDueDate) {
      // If user updated dueDate and createdAt was not explicitly sent, also keep createdAt in sync if requested
      parsedCreatedAt = parsedDueDate;
    }

    let newOriginalAmount = existing.originalAmount;
    let newRemainingAmount = existing.remainingAmount;
    let newStatus = existing.status;

    if (originalAmount !== undefined || amount !== undefined) {
      const numOriginal = parseFloat(originalAmount || amount);
      if (!isNaN(numOriginal) && numOriginal >= 0) {
        newOriginalAmount = numOriginal.toFixed(2);
        if (remainingAmount !== undefined) {
          newRemainingAmount = parseFloat(remainingAmount).toFixed(2);
        } else {
          // Preserve payment difference if already partially paid
          const oldPaid = Math.max(0, parseFloat(existing.originalAmount) - parseFloat(existing.remainingAmount));
          const calculatedRemaining = Math.max(0, numOriginal - oldPaid);
          newRemainingAmount = calculatedRemaining.toFixed(2);
        }
        newStatus = parseFloat(newRemainingAmount) <= 0 ? 'PAID' : (parseFloat(newRemainingAmount) < parseFloat(newOriginalAmount) ? 'PARTIALLY_PAID' : 'OPEN');
      }
    } else if (remainingAmount !== undefined) {
      newRemainingAmount = parseFloat(remainingAmount).toFixed(2);
      newStatus = parseFloat(newRemainingAmount) <= 0 ? 'PAID' : (parseFloat(newRemainingAmount) < parseFloat(newOriginalAmount) ? 'PARTIALLY_PAID' : 'OPEN');
    }

    if (status !== undefined) {
      newStatus = status;
    }

    const updated = await db.update(debts).set({
      originalAmount: newOriginalAmount,
      amount: newOriginalAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
      ...(notes !== undefined && { notes: notes ? notes.trim() : '' }),
      dueDate: parsedDueDate,
      createdAt: parsedCreatedAt,
      ...(source !== undefined && { source }),
      updatedAt: new Date()
    }).where(eq(debts.id, debtId)).returning();

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error in PUT /debts/:id:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Delete a single debt record
router.delete('/debts/:id', async (req, res) => {
  try {
    const debtId = parseInt(req.params.id);
    // Delete payment allocations first
    await db.delete(paymentAllocations).where(eq(paymentAllocations.debtId, debtId));
    // Delete debt
    await db.delete(debts).where(eq(debts.id, debtId));
    res.json({ success: true, message: 'تم حذف بند الدين بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get payment history / allocations for a specific debt
router.get('/debts/:id/payments', async (req, res) => {
  try {
    const debtId = parseInt(req.params.id);
    const allocations = await db.query.paymentAllocations.findMany({
      where: eq(paymentAllocations.debtId, debtId),
      with: {
        payment: {
          with: {
            resident: true,
            apartment: true
          }
        }
      },
      orderBy: (pa, { desc }) => [desc(pa.createdAt)]
    });
    res.json(allocations);
  } catch (error) {
    console.error('Error fetching debt payments:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Pay a specific individual debt item (Partial, Full, or Split with Credit)
router.post('/debts/:id/pay', async (req, res) => {
  try {
    const debtId = parseInt(req.params.id);
    const { 
      amount, 
      method = 'CASH', 
      reference, 
      notes, 
      residentId, 
      date,
      split = false, 
      creditAmount = 0, 
      secondaryAmount = 0, 
      secondaryMethod = 'CASH',
      secondaryReference = '',
      secondaryNotes = ''
    } = req.body;
    
    const debtRecord = await db.query.debts.findFirst({
      where: eq(debts.id, debtId),
      with: { apartment: true, resident: true }
    });

    if (!debtRecord) {
      return res.status(404).json({ error: 'سجل الدين غير موجود' });
    }

    const payAmount = parseFloat(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'مبلغ السداد غير صالح' });
    }

    const payDate = date ? new Date(date) : new Date();
    await checkMonthlyClosing(payDate);

    const curRemaining = parseFloat(debtRecord.remainingAmount);
    const newRemaining = Math.max(0, curRemaining - payAmount);
    const newStatus = newRemaining <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    // 1. Update debt record
    const updatedDebt = await db.update(debts).set({
      remainingAmount: newRemaining.toFixed(2),
      status: newStatus,
      updatedAt: new Date()
    }).where(eq(debts.id, debtId)).returning();

    // Check if this is a split payment (e.g. part from credit + part from cash/bank/wallet)
    const isSplit = split || (method === 'CREDIT' && parseFloat(creditAmount) > 0 && parseFloat(secondaryAmount) > 0);

    let mainPaymentRecord = null;

    if (isSplit) {
      const cVal = parseFloat(creditAmount) || 0;
      const sVal = parseFloat(secondaryAmount) || 0;

      // 1. Credit Payment Portion
      if (cVal > 0) {
        const creditPay = await db.insert(payments).values({
          apartmentId: debtRecord.apartmentId,
          residentId: residentId || debtRecord.residentId || null,
          amount: cVal.toFixed(2),
          method: 'CREDIT',
          reference: reference || 'CREDIT_DEDUCTION',
          notes: notes || `خصم من الرصيد الدائن للساكن (سداد مركب لـ ${debtRecord.notes || debtRecord.source})`,
          createdById: (req as any).userRecord?.id
        }).returning();

        await db.insert(paymentAllocations).values({
          paymentId: creditPay[0].id,
          debtId: debtId,
          amount: cVal.toFixed(2)
        });

        // Deduct from credits table
        const activeCredits = await db.query.credits.findMany({
          where: eq(credits.apartmentId, debtRecord.apartmentId),
          orderBy: (credits, { asc }) => [asc(credits.date)]
        });
        let toDeduct = cVal;
        for (const c of activeCredits) {
          const rem = parseFloat(String(c.remainingAmount || '0'));
          if (rem > 0) {
            const deduct = Math.min(rem, toDeduct);
            await db.update(credits).set({
              remainingAmount: (rem - deduct).toFixed(2)
            }).where(eq(credits.id, c.id));
            toDeduct -= deduct;
            if (toDeduct <= 0) break;
          }
        }

        mainPaymentRecord = creditPay[0];
      }

      // 2. Secondary Payment Portion (Cash / Bank / E-Wallet / Cheque)
      if (sVal > 0) {
        const secPay = await db.insert(payments).values({
          apartmentId: debtRecord.apartmentId,
          residentId: residentId || debtRecord.residentId || null,
          amount: sVal.toFixed(2),
          method: secondaryMethod,
          reference: secondaryReference || reference || null,
          notes: secondaryNotes || `سداد مكمل (${secondaryMethod}) للبند ${debtRecord.notes || debtRecord.source}`,
          createdById: (req as any).userRecord?.id
        }).returning();

        await db.insert(paymentAllocations).values({
          paymentId: secPay[0].id,
          debtId: debtId,
          amount: sVal.toFixed(2)
        });

        // Add to Cash Fund if not credit
        if (secondaryMethod !== 'CREDIT') {
          await db.insert(cashFund).values({
            type: 'INCOME',
            amount: sVal.toFixed(2),
            date: new Date(),
            source: 'PAYMENT',
            referenceId: secPay[0].id,
            apartmentId: debtRecord.apartmentId,
            paymentMethod: secondaryMethod,
            notes: `سداد مكمل (${secondaryMethod}) - شقة ${debtRecord.apartment?.number || ''}: ${debtRecord.notes || debtRecord.source}`,
            createdById: (req as any).userRecord?.id
          });
        }

        if (!mainPaymentRecord) mainPaymentRecord = secPay[0];
      }

      return res.json({
        success: true,
        message: `تم السداد المركب بنجاح: خصم ₪${cVal.toFixed(2)} من رصيد الساكن + سداد ₪${sVal.toFixed(2)} (${secondaryMethod})`,
        debt: updatedDebt[0],
        payment: mainPaymentRecord
      });
    }

    // Standard Non-Split Payment
    const newPayment = await db.insert(payments).values({
      apartmentId: debtRecord.apartmentId,
      residentId: residentId || debtRecord.residentId || null,
      amount: payAmount.toFixed(2),
      method,
      reference: reference || null,
      notes: notes || `سداد بند: ${debtRecord.notes || debtRecord.source}`,
      createdById: (req as any).userRecord?.id
    }).returning();

    // Insert allocation
    await db.insert(paymentAllocations).values({
      paymentId: newPayment[0].id,
      debtId: debtId,
      amount: payAmount.toFixed(2)
    });

    // Update Cash Fund or Credits
    if (method === 'CREDIT') {
      const activeCredits = await db.query.credits.findMany({
        where: eq(credits.apartmentId, debtRecord.apartmentId),
        orderBy: (credits, { asc }) => [asc(credits.date)]
      });
      let toDeduct = payAmount;
      for (const c of activeCredits) {
        const rem = parseFloat(String(c.remainingAmount || '0'));
        if (rem > 0) {
          const deduct = Math.min(rem, toDeduct);
          await db.update(credits).set({
            remainingAmount: (rem - deduct).toFixed(2)
          }).where(eq(credits.id, c.id));
          toDeduct -= deduct;
          if (toDeduct <= 0) break;
        }
      }
    } else {
      await db.insert(cashFund).values({
        type: 'INCOME',
        amount: payAmount.toFixed(2),
        date: new Date(),
        source: 'PAYMENT',
        referenceId: newPayment[0].id,
        apartmentId: debtRecord.apartmentId,
        paymentMethod: method,
        notes: `سداد بند دين (${debtRecord.source}) - شقة ${debtRecord.apartment?.number || ''}: ${notes || ''}`,
        createdById: (req as any).userRecord?.id
      });
    }

    res.json({
      success: true,
      message: newRemaining <= 0 ? 'تم السداد بالكامل بنجاح' : 'تم تسجيل السداد الجزئي بنجاح',
      debt: updatedDebt[0],
      payment: newPayment[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Payments ---
router.get('/payments', async (req, res) => {
  try {
    const allPayments = await db.query.payments.findMany({
      with: {
        apartment: true,
        resident: true
      },
      orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    });
    res.json(allPayments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/payments', async (req, res) => {
  try {
    await checkMonthlyClosing(req.body.date || new Date());
    const { apartmentId, residentId, amount, method, reference, notes, debtId } = req.body;
    
    let resolvedAptId = apartmentId ? parseInt(apartmentId) : null;
    let resolvedResidentId = residentId ? parseInt(residentId) : null;

    let debtRecord: any = null;
    if (debtId) {
      debtRecord = await db.query.debts.findFirst({
        where: eq(debts.id, debtId)
      });
      if (debtRecord) {
        if (!resolvedAptId) resolvedAptId = debtRecord.apartmentId;
        if (!resolvedResidentId) resolvedResidentId = debtRecord.residentId;
      }
    }

    // Create payment
    const newPayment = await db.insert(payments).values({
      apartmentId: resolvedAptId,
      residentId: resolvedResidentId || null,
      amount: amount.toString(),
      method,
      reference,
      notes,
      createdById: (req as any).userRecord?.id
    }).returning();
    
    // Allocate debt
    if (debtId && debtRecord) {
      const remaining = parseFloat(debtRecord.remainingAmount) - parseFloat(amount);
      const status = remaining <= 0 ? 'PAID' : 'PARTIALLY_PAID';
      
      await db.update(debts).set({
        remainingAmount: Math.max(0, remaining).toString(),
        status,
        updatedAt: new Date()
      }).where(eq(debts.id, debtId));
      
      await db.insert(paymentAllocations).values({
        paymentId: newPayment[0].id,
        debtId: debtId,
        amount: amount.toString()
      });
    }
    
    if (method === 'CREDIT' && resolvedAptId) {
      // Find oldest active credit for this apartment
      const activeCredits = await db.query.credits.findMany({
        where: eq(credits.apartmentId, resolvedAptId),
        orderBy: (credits, { asc }) => [asc(credits.date)]
      });
      
      let amountToDeduct = parseFloat(amount.toString());
      for (const c of activeCredits) {
        const remaining = parseFloat(c.remainingAmount || '0');
        if (remaining > 0) {
          const deduct = Math.min(remaining, amountToDeduct);
          await db.update(credits).set({
             remainingAmount: (remaining - deduct).toString(),
             updatedAt: new Date()
          }).where(eq(credits.id, c.id));
          amountToDeduct -= deduct;
          if (amountToDeduct <= 0) break;
        }
      }
    } else if (method !== 'CREDIT') {
      // ADD TO CASH FUND (Income) - Only if not credit
      await db.insert(cashFund).values({
        type: 'INCOME',
        amount: amount.toString(),
        date: new Date(),
        source: 'PAYMENT',
        referenceId: newPayment[0].id,
        apartmentId: resolvedAptId,
        paymentMethod: method,
        notes,
        createdById: (req as any).userRecord?.id
      });
    }
    
    res.json(newPayment[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Credits ---
router.get('/credits', async (req, res) => {
  try {
    const allCredits = await db.query.credits.findMany({
      with: { apartment: true, resident: true },
      orderBy: (credits, { desc }) => [desc(credits.date)],
    });
    res.json(allCredits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/credits', async (req, res) => {
  try {
    const { apartmentId, residentId, amount, date, source, notes, addToCashFund = false } = req.body;
    
    let resolvedAptId = apartmentId ? parseInt(apartmentId) : null;
    let resolvedResidentId = residentId ? parseInt(residentId) : null;

    if (!resolvedAptId && resolvedResidentId) {
      const resRecord = await db.query.residents.findFirst({
        where: eq(residents.id, resolvedResidentId)
      });
      if (resRecord && resRecord.apartmentId) {
        resolvedAptId = resRecord.apartmentId;
      }
    } else if (resolvedAptId && !resolvedResidentId) {
      const resRecord = await db.query.residents.findFirst({
        where: eq(residents.apartmentId, resolvedAptId)
      });
      if (resRecord) {
        resolvedResidentId = resRecord.id;
      }
    }

    if (!resolvedAptId) {
      return res.status(400).json({ error: 'يجب تحديد الشقة أو الساكن المرتبط بها' });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'مبلغ الرصيد غير صالح' });
    }

    const newCredit = await db.insert(credits).values({
      apartmentId: resolvedAptId,
      residentId: resolvedResidentId,
      originalAmount: numAmount.toFixed(2),
      remainingAmount: numAmount.toFixed(2),
      date: date ? new Date(date) : new Date(),
      source: source || 'DEPOSIT',
      notes: notes || 'إضافة رصيد دائن للساكن/الشقة'
    }).returning();

    // If marked to add to cash fund (e.g. resident paid cash in advance into the building fund)
    if (addToCashFund) {
      await db.insert(cashFund).values({
        type: 'INCOME',
        amount: numAmount.toFixed(2),
        date: date ? new Date(date) : new Date(),
        source: 'OTHER',
        referenceId: newCredit[0].id,
        apartmentId: resolvedAptId,
        paymentMethod: 'CASH',
        notes: `دفعة مقدمة / رصيد دائن: ${notes || ''}`,
        createdById: (req as any).userRecord?.id
      });
    }

    res.json(newCredit[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/credits/:id', async (req, res) => {
  try {
    const creditId = parseInt(req.params.id);
    await db.delete(credits).where(eq(credits.id, creditId));
    res.json({ success: true, message: 'تم حذف سجل الرصيد الدائن بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- General Pumping ---
router.get('/general-pumping', async (req, res) => {
  try {
    const records = await db.query.generalPumping.findMany({
      orderBy: (generalPumping, { desc }) => [desc(generalPumping.date), desc(generalPumping.id)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/general-pumping', async (req, res) => {
  try {
    const { 
      date, 
      dayName, 
      startTime, 
      endTime, 
      time, 
      supervisor, 
      initialReading, 
      finalReading, 
      consumption, 
      electricityPrice, 
      totalCost, 
      notes 
    } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    await checkMonthlyClosing(parsedDate);

    const initRead = parseFloat(initialReading) || 0;
    const finRead = parseFloat(finalReading) || 0;
    const consVal = consumption !== undefined && consumption !== '' 
      ? (parseFloat(consumption) || 0) 
      : Math.max(0, finRead - initRead);
    const elecPrice = parseFloat(electricityPrice) || 0.50;
    const calculatedCost = totalCost !== undefined && totalCost !== '' 
      ? (parseFloat(totalCost) || 0) 
      : (consVal * elecPrice);
    
    const newRecord = await db.insert(generalPumping).values({
      date: parsedDate,
      dayName: dayName || null,
      startTime: startTime || null,
      endTime: endTime || null,
      time: time || (startTime ? `${startTime} - ${endTime || ''}` : null),
      supervisor: supervisor || null,
      initialReading: initRead.toString(),
      finalReading: finRead.toString(),
      consumption: consVal.toString(),
      electricityPrice: elecPrice.toString(),
      totalCost: calculatedCost.toString(),
      notes: notes || null
    }).returning();
    
    // Create an expense if cost > 0
    if (calculatedCost > 0) {
      let building = await db.query.buildings.findFirst();
      let exp = await db.insert(expenses).values({
        buildingId: (building?.id || 1) as number,
        category: 'PUMPING',
        description: `تكلفة تشغيل مضخة الضخ العام (المشرف: ${supervisor || 'غير محدد'})`,
        amount: calculatedCost.toFixed(2),
        date: parsedDate,
        createdById: (req as any).userRecord?.id
      }).returning();
      
      // deduct from cash fund
      await db.insert(cashFund).values({
        type: 'EXPENSE',
        amount: calculatedCost.toFixed(2),
        date: parsedDate,
        source: 'PUMPING',
        referenceId: exp[0].id,
        notes: `تكلفة الضخ العام بتاريخ ${parsedDate.toISOString().split('T')[0]} - كهرباء: ${consVal} ك.و * ₪${elecPrice}`,
        createdById: (req as any).userRecord?.id
      });
    }

    res.json(newRecord[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/general-pumping/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(generalPumping).where(eq(generalPumping.id, id));
    res.json({ success: true, message: 'تم حذف جلسة الضخ العام بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Rent Contracts ---

router.post('/rent-contracts/sync', async (req, res) => {
  try {
    const contracts = await db.query.rentContracts.findMany({
      where: eq(rentContracts.status, 'ACTIVE')
    });
    
    let generated = 0;
    const now = new Date();
    
    for (const contract of contracts) {
      if (!contract.apartmentId) continue;
      // Loop from startDate to min(endDate, now) by month
      let current = new Date(contract.startDate);
      const end = new Date(contract.endDate);
      const limit = end < now ? end : now;
      const paidMonthsList: string[] = Array.isArray(contract.paidMonths) ? contract.paidMonths : [];
      
      while (current <= limit) {
        // Create debt if not exists
        const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const noteStr = `إيجار شهر ${monthStr}`;
        const isAlreadyPaid = paidMonthsList.includes(monthStr);
        
        const existingDebt = await db.query.debts.findFirst({
          where: and(
            eq(debts.apartmentId, contract.apartmentId),
            eq(debts.source, 'RENT'),
            eq(debts.sourceId, contract.id),
            like(debts.notes, `%${monthStr}%`)
          )
        });
        
        if (!existingDebt) {
          const dueDate = new Date(current.getFullYear(), current.getMonth(), contract.dueDay || 1);
          await db.insert(debts).values({
            apartmentId: contract.apartmentId,
            residentId: contract.tenantId || null,
            amount: contract.monthlyRent,
            originalAmount: contract.monthlyRent,
            remainingAmount: isAlreadyPaid ? '0.00' : contract.monthlyRent,
            dueDate: dueDate,
            status: isAlreadyPaid ? 'PAID' : 'OPEN',
            source: 'RENT',
            sourceId: contract.id,
            notes: isAlreadyPaid ? `${noteStr} (مدفوع قبل التسجيل)` : noteStr
          });
          generated++;
        }
        
        current.setMonth(current.getMonth() + 1);
      }
    }
    
    res.json({ success: true, generated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/rent-contracts', async (req, res) => {
  try {
    const records = await db.query.rentContracts.findMany({
      with: { apartment: true, tenant: true },
      orderBy: (rentContracts, { desc }) => [desc(rentContracts.createdAt)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/rent-contracts', async (req, res) => {
  try {
    await checkMonthlyClosing(req.body.startDate || new Date());
    const { 
      apartmentId, 
      tenantId, 
      tenantName, 
      tenantPhone, 
      unitDescription, 
      startDate, 
      endDate, 
      monthlyRent, 
      dueDay, 
      securityDeposit, 
      status, 
      notes, 
      paidMonths 
    } = req.body;

    const aptId = apartmentId ? parseInt(apartmentId) : null;
    const tId = tenantId ? parseInt(tenantId) : null;
    const rentAmount = parseFloat(monthlyRent) || 0;
    const dueDayNum = parseInt(dueDay) || 1;
    const paidMonthsArray = Array.isArray(paidMonths) ? paidMonths : [];

    const newRecord = await db.insert(rentContracts).values({
      apartmentId: aptId,
      tenantId: tId,
      tenantName: tenantName || null,
      tenantPhone: tenantPhone || null,
      unitDescription: unitDescription || null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlyRent: rentAmount.toString(),
      dueDay: dueDayNum,
      securityDeposit: securityDeposit ? parseFloat(securityDeposit).toString() : '0.00',
      status: status || 'ACTIVE',
      notes: notes || null,
      paidMonths: paidMonthsArray
    }).returning();

    const createdContract = newRecord[0];

    // If an apartment is linked, generate debt records for past/current months up to today
    if (aptId && (status === 'ACTIVE' || !status)) {
      const now = new Date();
      let current = new Date(startDate);
      const end = new Date(endDate);
      const limit = end < now ? end : now;

      while (current <= limit) {
        const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const isPaid = paidMonthsArray.includes(monthStr);
        const noteStr = `إيجار شهر ${monthStr}`;
        const dueDate = new Date(current.getFullYear(), current.getMonth(), dueDayNum);

        await db.insert(debts).values({
          apartmentId: aptId,
          residentId: tId,
          amount: rentAmount.toString(),
          originalAmount: rentAmount.toString(),
          remainingAmount: isPaid ? '0.00' : rentAmount.toString(),
          dueDate: dueDate,
          status: isPaid ? 'PAID' : 'OPEN',
          source: 'RENT',
          sourceId: createdContract.id,
          notes: isPaid ? `${noteStr} (مدفوع قبل التسجيل)` : noteStr
        });

        current.setMonth(current.getMonth() + 1);
      }
    }

    res.json(createdContract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/rent-contracts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { 
      apartmentId, 
      tenantId, 
      tenantName, 
      tenantPhone, 
      unitDescription, 
      startDate, 
      endDate, 
      monthlyRent, 
      dueDay, 
      securityDeposit, 
      status, 
      notes, 
      paidMonths 
    } = req.body;

    const updated = await db.update(rentContracts).set({
      apartmentId: apartmentId ? parseInt(apartmentId) : null,
      tenantId: tenantId ? parseInt(tenantId) : null,
      tenantName: tenantName || null,
      tenantPhone: tenantPhone || null,
      unitDescription: unitDescription || null,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      monthlyRent: monthlyRent ? parseFloat(monthlyRent).toString() : undefined,
      dueDay: dueDay ? parseInt(dueDay) : undefined,
      securityDeposit: securityDeposit !== undefined ? parseFloat(securityDeposit || 0).toString() : undefined,
      status: status || undefined,
      notes: notes !== undefined ? notes : undefined,
      paidMonths: Array.isArray(paidMonths) ? paidMonths : undefined,
      updatedAt: new Date()
    }).where(eq(rentContracts.id, id)).returning();

    const contractRec = updated[0];

    // Synchronize debts with updated paidMonths / rent
    if (contractRec && contractRec.apartmentId && paidMonths !== undefined) {
      const paidMonthsArray: string[] = Array.isArray(paidMonths) ? paidMonths : [];
      const aptId = contractRec.apartmentId;
      const rentAmount = parseFloat(contractRec.monthlyRent);
      const dueDayNum = contractRec.dueDay || 1;

      // Find all existing debts for this contract
      const existingDebts = await db.query.debts.findMany({
        where: and(
          eq(debts.apartmentId, aptId),
          eq(debts.source, 'RENT'),
          eq(debts.sourceId, contractRec.id)
        ),
        with: {
          paymentAllocations: true
        }
      });

      const now = new Date();
      let current = new Date(contractRec.startDate);
      const end = new Date(contractRec.endDate);
      const limit = end < now ? end : now;

      while (current <= limit) {
        const monthStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        const isPaid = paidMonthsArray.includes(monthStr);
        const baseNote = `إيجار شهر ${monthStr}`;
        const desiredNote = isPaid ? `${baseNote} (مدفوع قبل التسجيل)` : baseNote;

        const debt = existingDebts.find(d => d.notes?.includes(monthStr));

        if (debt) {
          const hasRealAllocations = (debt as any).paymentAllocations && (debt as any).paymentAllocations.length > 0;
          if (!hasRealAllocations) {
            if (isPaid) {
              await db.update(debts).set({
                remainingAmount: '0.00',
                status: 'PAID',
                notes: desiredNote,
                updatedAt: new Date()
              }).where(eq(debts.id, debt.id));
            } else {
              await db.update(debts).set({
                remainingAmount: (debt.originalAmount || contractRec.monthlyRent).toString(),
                status: 'OPEN',
                notes: baseNote,
                updatedAt: new Date()
              }).where(eq(debts.id, debt.id));
            }
          }
        } else {
          const dueDate = new Date(current.getFullYear(), current.getMonth(), dueDayNum);
          await db.insert(debts).values({
            apartmentId: aptId,
            residentId: contractRec.tenantId || null,
            amount: rentAmount.toString(),
            originalAmount: rentAmount.toString(),
            remainingAmount: isPaid ? '0.00' : rentAmount.toString(),
            dueDate: dueDate,
            status: isPaid ? 'PAID' : 'OPEN',
            source: 'RENT',
            sourceId: contractRec.id,
            notes: desiredNote
          });
        }

        current.setMonth(current.getMonth() + 1);
      }
    }

    res.json(contractRec);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Toggle a specific month payment status for a rent contract
router.post('/rent-contracts/:id/toggle-month-status', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { monthKey, isPaid } = req.body;

    const contract = await db.query.rentContracts.findFirst({
      where: eq(rentContracts.id, id)
    });

    if (!contract) {
      return res.status(404).json({ error: 'العقد غير موجود' });
    }

    let paidMonthsList: string[] = Array.isArray(contract.paidMonths) ? [...contract.paidMonths] : [];
    if (isPaid) {
      if (!paidMonthsList.includes(monthKey)) {
        paidMonthsList.push(monthKey);
      }
    } else {
      paidMonthsList = paidMonthsList.filter(m => m !== monthKey);
    }

    await db.update(rentContracts).set({
      paidMonths: paidMonthsList,
      updatedAt: new Date()
    }).where(eq(rentContracts.id, id));

    const baseNote = `إيجار شهر ${monthKey}`;
    const desiredNote = isPaid ? `${baseNote} (مدفوع قبل التسجيل)` : baseNote;

    const existingDebt = await db.query.debts.findFirst({
      where: and(
        eq(debts.source, 'RENT'),
        eq(debts.sourceId, id),
        like(debts.notes, `%${monthKey}%`)
      )
    });

    if (existingDebt) {
      if (isPaid) {
        await db.update(debts).set({
          remainingAmount: '0.00',
          status: 'PAID',
          notes: desiredNote,
          updatedAt: new Date()
        }).where(eq(debts.id, existingDebt.id));
      } else {
        await db.update(debts).set({
          remainingAmount: (existingDebt.originalAmount || contract.monthlyRent).toString(),
          status: 'OPEN',
          notes: baseNote,
          updatedAt: new Date()
        }).where(eq(debts.id, existingDebt.id));
      }
    } else if (contract.apartmentId) {
      const parts = (monthKey || '').split('-');
      const y = parseInt(parts[0]) || new Date().getFullYear();
      const m = (parseInt(parts[1]) || 1) - 1;
      const dueDate = new Date(y, m, contract.dueDay || 1);

      await db.insert(debts).values({
        apartmentId: contract.apartmentId,
        residentId: contract.tenantId || null,
        amount: contract.monthlyRent,
        originalAmount: contract.monthlyRent,
        remainingAmount: isPaid ? '0.00' : contract.monthlyRent,
        dueDate: dueDate,
        status: isPaid ? 'PAID' : 'OPEN',
        source: 'RENT',
        sourceId: contract.id,
        notes: desiredNote
      });
    }

    res.json({ success: true, isPaid, monthKey });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/rent-contracts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Delete any un-paid debts associated with this contract
    await db.delete(debts).where(and(eq(debts.source, 'RENT'), eq(debts.sourceId, id), eq(debts.status, 'OPEN')));
    await db.delete(rentContracts).where(eq(rentContracts.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Projects ---
router.get('/projects', async (req, res) => {
  try {
    const records = await db.query.projects.findMany({
      orderBy: (projects, { desc }) => [desc(projects.startDate), desc(projects.createdAt)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/projects', async (req, res) => {
  try {
    const { name, description, startDate, budget, status, notes, attachmentUrl } = req.body;
    const newRecord = await db.insert(projects).values({
      name,
      description,
      startDate: startDate ? new Date(startDate) : new Date(),
      budget: budget?.toString() || '0',
      status: status || 'PLANNED',
      notes,
      attachmentUrl,
      managerId: (req as any).userRecord?.id
    }).returning();
    res.json(newRecord[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/projects/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, startDate, budget, status, notes, attachmentUrl } = req.body;
    const updated = await db.update(projects).set({
      name: name !== undefined ? name : undefined,
      description: description !== undefined ? description : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      budget: budget !== undefined ? budget.toString() : undefined,
      status: status !== undefined ? status : undefined,
      notes: notes !== undefined ? notes : undefined,
      attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : undefined,
      updatedAt: new Date()
    }).where(eq(projects.id, id)).returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }
    res.json(updated[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Disassociate or delete cashFund references if any
    await db.update(cashFund).set({ projectId: null }).where(eq(cashFund.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
    res.json({ success: true, message: 'تم حذف المشروع بنجاح' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Record direct project transaction (Contribution income or project expense)
router.post('/projects/:id/transaction', async (req: any, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const { type, amount, date, notes, apartmentId, paymentMethod, payee, item } = req.body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'المبلغ غير صالح' });
    }

    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
    if (!project) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }

    const parsedDate = date ? new Date(date) : new Date();
    await checkMonthlyClosing(parsedDate);

    let refExpenseId: number | null = null;
    if (type === 'EXPENSE') {
      let building = await db.query.buildings.findFirst();
      const exp = await db.insert(expenses).values({
        buildingId: (building?.id || 1) as number,
        category: 'صيانة ومشاريع',
        description: `مصروف مشروع [${project.name}]: ${item || notes || 'تكاليف ومواد'}`,
        amount: numAmount.toFixed(2),
        date: parsedDate,
        payee: payee || null,
        notes: notes || null,
        createdById: req.userRecord?.id
      }).returning();
      refExpenseId = exp[0].id;
    }

    const record = await db.insert(cashFund).values({
      type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      amount: numAmount.toFixed(2),
      date: parsedDate,
      source: type === 'INCOME' ? 'PAYMENT' : 'EXPENSE',
      referenceId: refExpenseId,
      apartmentId: apartmentId ? parseInt(apartmentId) : null,
      projectId: projectId,
      paymentMethod: paymentMethod || payee || 'نقدي',
      notes: notes ? `[مشروع: ${project.name}] ${notes}` : `[مشروع: ${project.name}]`,
      createdById: req.userRecord?.id
    }).returning();

    res.json({ success: true, transaction: record[0] });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});


// --- Cash Fund & Financial Settings ---
let financialSettingsData = {
  approvalThreshold: 500.0,
  requiredApprovals: 2
};

let expenseApprovalsList: Array<{
  id: number;
  description: string;
  category: string;
  amount: number;
  date: string;
  payee: string;
  notes: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvals: string[];
  createdAt: string;
}> = [];

router.get('/financial-settings', (req, res) => {
  res.json(financialSettingsData);
});

router.post('/financial-settings', (req, res) => {
  const { approvalThreshold, requiredApprovals } = req.body;
  if (approvalThreshold !== undefined) {
    financialSettingsData.approvalThreshold = parseFloat(approvalThreshold) || 500;
  }
  if (requiredApprovals !== undefined) {
    financialSettingsData.requiredApprovals = parseInt(requiredApprovals) || 2;
  }
  res.json({ success: true, settings: financialSettingsData });
});

router.get('/expense-approvals', (req, res) => {
  res.json(expenseApprovalsList);
});

router.post('/expense-approvals/:id/vote', async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const { action = 'APPROVE' } = req.body;
    const voterName = req.userRecord?.name || 'عضو مجلس الإدارة';

    const request = expenseApprovalsList.find(r => r.id === id);
    if (!request) {
      return res.status(404).json({ error: 'طلب الموافقة غير موجود' });
    }

    if (action === 'REJECT') {
      request.status = 'REJECTED';
      return res.json({ success: true, request });
    }

    if (!request.approvals.includes(voterName)) {
      request.approvals.push(voterName);
    }

    if (request.approvals.length >= financialSettingsData.requiredApprovals && request.status === 'PENDING') {
      request.status = 'APPROVED';
      // Execute the expense
      let building = await db.query.buildings.findFirst();
      const exp = await db.insert(expenses).values({
        buildingId: (building?.id || 1) as number,
        category: request.category || 'OTHER',
        description: request.description,
        amount: request.amount.toFixed(2),
        date: new Date(request.date),
        payee: request.payee,
        notes: request.notes,
        createdById: req.userRecord?.id
      }).returning();

      await db.insert(cashFund).values({
        type: 'EXPENSE',
        amount: request.amount.toFixed(2),
        date: new Date(request.date),
        source: 'EXPENSE',
        referenceId: exp[0].id,
        notes: `${request.description} (${request.payee ? 'المستلم: ' + request.payee : ''}) [معتمد من المجلس: ${request.approvals.join(', ')}]`,
        createdById: req.userRecord?.id
      });
    }

    res.json({ success: true, request });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

router.get('/cash-fund/opening-balance', async (req, res) => {
  try {
    const record = await db.query.cashFund.findFirst({
      where: eq(cashFund.source, 'INITIAL_BALANCE'),
      orderBy: [desc(cashFund.date)]
    });

    if (record) {
      res.json({
        id: record.id,
        amount: parseFloat(record.amount) || 0,
        date: record.date ? record.date.toISOString().split('T')[0] : '2026-08-24',
        custodian: record.paymentMethod || 'المهندس أبو بسام شعت',
        notes: record.notes || 'نقداً موجود لدى أمين الصندوق المهندس أبو بسام شعت'
      });
    } else {
      res.json({
        id: null,
        amount: 33.00,
        date: '2026-08-24',
        custodian: 'المهندس أبو بسام شعت',
        notes: 'نقداً موجود لدى أمين الصندوق المهندس أبو بسام شعت'
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/cash-fund/opening-balance', async (req: any, res) => {
  try {
    const { amount, date, custodian, notes } = req.body;
    const numAmount = parseFloat(amount) || 0;
    const parsedDate = date ? new Date(date) : new Date('2026-08-24');
    const custodianName = custodian || 'المهندس أبو بسام شعت';
    const noteText = notes || `نقداً موجود لدى أمين الصندوق ${custodianName}`;

    const existing = await db.query.cashFund.findFirst({
      where: eq(cashFund.source, 'INITIAL_BALANCE')
    });

    if (existing) {
      const updated = await db.update(cashFund).set({
        amount: numAmount.toFixed(2),
        date: parsedDate,
        paymentMethod: custodianName,
        notes: noteText
      }).where(eq(cashFund.id, existing.id)).returning();
      res.json(updated[0]);
    } else {
      const inserted = await db.insert(cashFund).values({
        type: 'INCOME',
        amount: numAmount.toFixed(2),
        date: parsedDate,
        source: 'INITIAL_BALANCE',
        paymentMethod: custodianName,
        notes: noteText,
        createdById: req.userRecord?.id
      }).returning();
      res.json(inserted[0]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.get('/cash-fund', async (req, res) => {
  try {
    const records = await db.query.cashFund.findMany({
      with: { apartment: true, project: true },
      orderBy: (cashFund, { desc }) => [desc(cashFund.date), desc(cashFund.id)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/cash-fund', async (req: any, res) => {
  try {
    const { 
      type, 
      amount, 
      date, 
      category, 
      item, 
      payee, 
      notes, 
      apartmentId, 
      projectId, 
      source = 'EXPENSE',
      forceApprove = false 
    } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    await checkMonthlyClosing(parsedDate);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'يرجى إدخال مبلغ صحيح أكبر من الصفر' });
    }

    const description = item || category || (type === 'INCOME' ? 'إيراد نقدي' : 'مصروف نقدي');

    // Check if expense requires board approval (> threshold)
    if (type === 'EXPENSE' && numAmount > financialSettingsData.approvalThreshold && !forceApprove) {
      const newApproval = {
        id: Date.now(),
        description,
        category: category || 'OTHER',
        amount: numAmount,
        date: parsedDate.toISOString(),
        payee: payee || '',
        notes: notes || '',
        requestedBy: req.userRecord?.name || 'مدير النظام',
        status: 'PENDING' as const,
        approvals: [req.userRecord?.name || 'المدير'],
        createdAt: new Date().toISOString()
      };
      expenseApprovalsList.unshift(newApproval);

      return res.json({ 
        requiresApproval: true, 
        message: `تم تحويل المصروف إلى طلب موافقة المجلس لتجاوزه حد ${financialSettingsData.approvalThreshold} شيكل.`,
        approval: newApproval 
      });
    }

    let referenceId: number | null = null;

    if (type === 'EXPENSE') {
      let building = await db.query.buildings.findFirst();
      const exp = await db.insert(expenses).values({
        buildingId: (building?.id || 1) as number,
        category: category || 'OTHER',
        description,
        amount: numAmount.toFixed(2),
        date: parsedDate,
        payee: payee || null,
        notes: notes || null,
        createdById: req.userRecord?.id
      }).returning();
      referenceId = exp[0].id;
    }

    const inserted = await db.insert(cashFund).values({
      type: type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      amount: numAmount.toFixed(2),
      date: parsedDate,
      source: type === 'INCOME' ? 'PAYMENT' : source,
      referenceId,
      apartmentId: apartmentId ? parseInt(apartmentId) : null,
      projectId: projectId ? parseInt(projectId) : null,
      paymentMethod: payee || null,
      notes: notes ? `${description} - ${notes}` : description,
      createdById: req.userRecord?.id
    }).returning();

    res.json(inserted[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.delete('/cash-fund/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.query.cashFund.findFirst({
      where: eq(cashFund.id, id)
    });
    if (!existing) {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }

    await checkMonthlyClosing(existing.date);

    if (existing.type === 'EXPENSE' && existing.referenceId) {
      await db.delete(expenses).where(eq(expenses.id, existing.referenceId));
    }

    await db.delete(cashFund).where(eq(cashFund.id, id));
    res.json({ success: true, message: 'تم حذف المعاملة بنجاح' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء حذف المعاملة' });
  }
});

router.put('/cash-fund/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await db.query.cashFund.findFirst({
      where: eq(cashFund.id, id)
    });
    if (!existing) {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }

    const { amount, date, notes, paymentMethod, type, category } = req.body;
    const parsedDate = date ? new Date(date) : existing.date;
    await checkMonthlyClosing(parsedDate);

    const numAmount = amount !== undefined ? parseFloat(amount) : parseFloat(existing.amount);

    const updated = await db.update(cashFund).set({
      ...(amount !== undefined && { amount: numAmount.toFixed(2) }),
      ...(date !== undefined && { date: parsedDate }),
      ...(notes !== undefined && { notes }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(type !== undefined && { type })
    }).where(eq(cashFund.id, id)).returning();

    // If linked to an expense record, update that expense too
    if (existing.type === 'EXPENSE' && existing.referenceId) {
      await db.update(expenses).set({
        ...(amount !== undefined && { amount: numAmount.toFixed(2) }),
        ...(date !== undefined && { date: parsedDate }),
        ...(notes !== undefined && { description: notes, notes }),
        ...(category !== undefined && { category }),
        ...(paymentMethod !== undefined && { payee: paymentMethod })
      }).where(eq(expenses.id, existing.referenceId));
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error in PUT /cash-fund/:id:', error);
    res.status(500).json({ error: error.message || 'حدث خطأ أثناء تعديل المعاملة' });
  }
});

router.post('/cash-fund/sync', async (req, res) => {
  try {
    // Return all records and stats
    const records = await db.query.cashFund.findMany({
      with: { apartment: true, project: true },
      orderBy: (cashFund, { desc }) => [desc(cashFund.date), desc(cashFund.id)],
    });
    res.json({ success: true, count: records.length, records });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// --- Announcements ---
router.get('/announcements', async (req, res) => {
  try {
    const records = await db.query.announcements.findMany({
      orderBy: (announcements, { desc }) => [desc(announcements.date), desc(announcements.createdAt)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content, date, audience, status, attachmentUrl } = req.body;
    const newRecord = await db.insert(announcements).values({
      title,
      content,
      date: date ? new Date(date) : new Date(),
      audience: audience || 'ALL',
      status: status || 'PUBLISHED',
      attachmentUrl: attachmentUrl || null,
      createdById: (req as any).userRecord?.id
    }).returning();
    res.json(newRecord[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, content, date, audience, status, attachmentUrl } = req.body;
    const updated = await db.update(announcements).set({
      title: title !== undefined ? title : undefined,
      content: content !== undefined ? content : undefined,
      date: date ? new Date(date) : undefined,
      audience: audience !== undefined ? audience : undefined,
      status: status !== undefined ? status : undefined,
      attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : undefined,
      updatedAt: new Date()
    }).where(eq(announcements.id, id)).returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }
    res.json(updated[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(announcements).where(eq(announcements.id, id));
    res.json({ success: true, message: 'تم حذف الإعلان بنجاح' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// --- Visits & Gifts ---
router.get('/visits-gifts', async (req, res) => {
  try {
    const records = await db.query.visitsGifts.findMany({
      orderBy: (visitsGifts, { desc }) => [desc(visitsGifts.date), desc(visitsGifts.createdAt)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/visits-gifts', async (req, res) => {
  try {
    const { type, beneficiary, amount, date, description, attachmentUrl, recordAsCashExpense = true } = req.body;
    const numAmount = parseFloat(amount) || 0;
    const parsedDate = date ? new Date(date) : new Date();

    const newRecord = await db.insert(visitsGifts).values({
      type,
      beneficiary,
      amount: numAmount.toFixed(2),
      date: parsedDate,
      description: description || null,
      attachmentUrl: attachmentUrl || null,
      createdById: (req as any).userRecord?.id
    }).returning();
    
    // Auto insert into cash fund as expense if requested and amount > 0
    if (recordAsCashExpense && numAmount > 0) {
      await db.insert(cashFund).values({
        type: 'EXPENSE',
        amount: numAmount.toFixed(2),
        date: parsedDate,
        source: 'VISIT_GIFT',
        notes: `[مناسبة/زيارة: ${type}] ${beneficiary} - ${description || ''}`,
        paymentMethod: 'نقدي',
        createdById: (req as any).userRecord?.id
      });
    }
    
    res.json(newRecord[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.put('/visits-gifts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type, beneficiary, amount, date, description, attachmentUrl } = req.body;
    const updated = await db.update(visitsGifts).set({
      type: type !== undefined ? type : undefined,
      beneficiary: beneficiary !== undefined ? beneficiary : undefined,
      amount: amount !== undefined ? parseFloat(amount).toFixed(2) : undefined,
      date: date ? new Date(date) : undefined,
      description: description !== undefined ? description : undefined,
      attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : undefined
    }).where(eq(visitsGifts.id, id)).returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'السجل غير موجود' });
    }
    res.json(updated[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.delete('/visits-gifts/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(visitsGifts).where(eq(visitsGifts.id, id));
    res.json({ success: true, message: 'تم حذف السجل بنجاح' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// --- Votes / Polls ---
router.get('/votes', async (req: any, res: any) => {
  try {
    const allVotes = await db.query.votes.findMany({
      orderBy: (votes, { desc }) => [desc(votes.startDate), desc(votes.createdAt)]
    });
    const allResponses = await db.query.voteResponses.findMany();

    const votesWithStats = allVotes.map(v => {
      const responses = allResponses.filter(r => r.voteId === v.id);
      return {
        ...v,
        responses,
        totalVotes: responses.length
      };
    });

    res.json(votesWithStats);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

router.post('/votes', async (req: any, res: any) => {
  try {
    const { question, options, audience = 'ALL', startDate, endDate, status = 'ACTIVE' } = req.body;
    let formattedOptions = options;
    if (typeof options === 'string') {
      formattedOptions = options.split(',').map((opt: string, idx: number) => ({
        id: idx + 1,
        text: opt.trim()
      })).filter((o: any) => o.text.length > 0);
    } else if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'string') {
      formattedOptions = options.map((opt: string, idx: number) => ({
        id: idx + 1,
        text: opt.trim()
      }));
    }

    const inserted = await db.insert(votes).values({
      question,
      options: formattedOptions,
      audience,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      status
    }).returning();
    res.json({ ...inserted[0], responses: [], totalVotes: 0 });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

router.put('/votes/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    const { question, options, audience, startDate, endDate, status } = req.body;

    const updated = await db.update(votes).set({
      question: question !== undefined ? question : undefined,
      options: options !== undefined ? options : undefined,
      audience: audience !== undefined ? audience : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status !== undefined ? status : undefined,
    }).where(eq(votes.id, id)).returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'التصويت غير موجود' });
    }
    res.json(updated[0]);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

router.delete('/votes/:id', async (req: any, res: any) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(voteResponses).where(eq(voteResponses.voteId, id));
    await db.delete(votes).where(eq(votes.id, id));
    res.json({ success: true, message: 'تم حذف التصويت' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

router.post('/votes/:id/vote', async (req: any, res: any) => {
  try {
    const voteId = parseInt(req.params.id);
    const { optionId, apartmentId } = req.body;

    const targetApartmentId = parseInt(apartmentId) || 1;
    const targetOptionId = parseInt(optionId);

    // Check if already voted from this apartment
    const existing = await db.query.voteResponses.findFirst({
      where: and(
        eq(voteResponses.voteId, voteId),
        eq(voteResponses.apartmentId, targetApartmentId)
      )
    });

    if (existing) {
      const updated = await db.update(voteResponses).set({
        optionId: targetOptionId
      }).where(eq(voteResponses.id, existing.id)).returning();
      return res.json({ success: true, message: 'تم تعديل صوتك بنجاح', response: updated[0] });
    }

    const inserted = await db.insert(voteResponses).values({
      voteId,
      optionId: targetOptionId,
      apartmentId: targetApartmentId
    }).returning();

    res.json({ success: true, message: 'تم تسجيل تصويتك بنجاح', response: inserted[0] });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// --- Meetings / Minutes ---
router.get('/meetings', async (req, res) => {
  try {
    const records = await db.query.meetings.findMany({
      orderBy: (meetings, { desc }) => [desc(meetings.date), desc(meetings.createdAt)],
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/meetings', async (req, res) => {
  try {
    const { title, date, location, attendees, agenda, decisions, notes, attachmentUrl } = req.body;
    const newRecord = await db.insert(meetings).values({
      title,
      date: date ? new Date(date) : new Date(),
      location: location || 'قاعة الاجتماعات / بهو العمارة',
      attendees: attendees || '',
      agenda: agenda || '',
      decisions: decisions || '',
      notes: notes || '',
      attachmentUrl: attachmentUrl || null,
      createdById: (req as any).userRecord?.id
    }).returning();
    res.json(newRecord[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.put('/meetings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, date, location, attendees, agenda, decisions, notes, attachmentUrl } = req.body;
    const updated = await db.update(meetings).set({
      title: title !== undefined ? title : undefined,
      date: date ? new Date(date) : undefined,
      location: location !== undefined ? location : undefined,
      attendees: attendees !== undefined ? attendees : undefined,
      agenda: agenda !== undefined ? agenda : undefined,
      decisions: decisions !== undefined ? decisions : undefined,
      notes: notes !== undefined ? notes : undefined,
      attachmentUrl: attachmentUrl !== undefined ? attachmentUrl : undefined,
      updatedAt: new Date()
    }).where(eq(meetings.id, id)).returning();

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'المحضر غير موجود' });
    }
    res.json(updated[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.delete('/meetings/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(meetings).where(eq(meetings.id, id));
    res.json({ success: true, message: 'تم حذف المحضر بنجاح' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});




router.get('/monthly-closings', async (req, res) => {
  try {
    const data = await db.query.monthlyClosings.findMany({
      orderBy: (monthlyClosings, { desc }) => [desc(monthlyClosings.month)]
    });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/monthly-closings', async (req, res) => {
  try {
    const { month, notes } = req.body;
    const closedById = (req as any).userRecord?.id;
    
    // Check if already closed
    const existing = await db.query.monthlyClosings.findFirst({
      where: eq(monthlyClosings.month, month)
    });
    
    if (existing) {
      // Re-open if requested? Or maybe just error for now.
      return res.status(400).json({ error: 'الشهر مغلق مسبقاً' });
    }
    
    const result = await db.insert(monthlyClosings).values({
      month,
      notes,
      closedById
    }).returning();
    
    res.json(result[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

router.delete('/monthly-closings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(monthlyClosings).where(eq(monthlyClosings.id, Number(id)));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Audit Logs Endpoint ---
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await db.query.auditLogs.findMany({
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
      limit: 100
    });
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- Comprehensive Reports API ---
router.get('/reports/comprehensive', async (req, res) => {
  try {
    const [
      allApartments,
      allResidents,
      allDebts,
      allPayments,
      allCashFund,
      allSubscriptions,
      allWaterReadings,
      allRentContracts,
      allExpenses,
      allProjects,
      allMonthlyClosings
    ] = await Promise.all([
      db.query.apartments.findMany({ with: { residents: true }, orderBy: (apartments, { asc }) => [asc(apartments.number)] }),
      db.query.residents.findMany({ with: { apartment: true } }),
      db.query.debts.findMany({ with: { apartment: true, resident: true }, orderBy: (debts, { desc }) => [desc(debts.createdAt)] }),
      db.query.payments.findMany({ with: { apartment: true, resident: true }, orderBy: (payments, { desc }) => [desc(payments.date)] }),
      db.query.cashFund.findMany({ with: { apartment: true, project: true }, orderBy: (cashFund, { desc }) => [desc(cashFund.date), desc(cashFund.id)] }),
      db.query.subscriptions.findMany({ with: { apartment: true, debt: true, payment: true }, orderBy: (subscriptions, { desc }) => [desc(subscriptions.month), desc(subscriptions.date)] }),
      db.query.waterReadings.findMany({ with: { apartment: true, debt: true }, orderBy: (waterReadings, { desc }) => [desc(waterReadings.date)] }),
      db.query.rentContracts.findMany({ with: { apartment: true, tenant: true }, orderBy: (rentContracts, { desc }) => [desc(rentContracts.startDate)] }),
      db.query.expenses.findMany({ orderBy: (expenses, { desc }) => [desc(expenses.date)] }),
      db.query.projects.findMany({ orderBy: (projects, { desc }) => [desc(projects.createdAt)] }),
      db.query.monthlyClosings.findMany({ orderBy: (monthlyClosings, { desc }) => [desc(monthlyClosings.month)] })
    ]);

    res.json({
      apartments: allApartments,
      residents: allResidents,
      debts: allDebts,
      payments: allPayments,
      cashFund: allCashFund,
      subscriptions: allSubscriptions,
      waterReadings: allWaterReadings,
      rentContracts: allRentContracts,
      expenses: allExpenses,
      projects: allProjects,
      monthlyClosings: allMonthlyClosings
    });
  } catch (error) {
    console.error('Error fetching comprehensive report data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
