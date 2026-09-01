import { db } from '../db/index.js';
import { 
  buildings, 
  apartments, 
  residents, 
  debts, 
  payments, 
  paymentAllocations, 
  expenses, 
  waterReadings, 
  generalPumping, 
  rentContracts, 
  cashFund, 
  credits, 
  services, 
  serviceTransactions, 
  subscriptions, 
  announcements, 
  visitsGifts, 
  notifications, 
  monthlyClosings, 
  votes, 
  voteResponses, 
  meetings, 
  auditLogs 
} from '../db/schema.js';
import { sql, eq } from 'drizzle-orm';

export async function resetAndSeedFreshData() {
  console.log('🔄 Starting data wipe and database reload...');

  // Step 1: Wipe all transactional and entity tables in correct FK order
  await db.transaction(async (tx) => {
    // Delete dependent tables first
    await tx.delete(voteResponses);
    await tx.delete(votes);
    await tx.delete(notifications);
    await tx.delete(visitsGifts);
    await tx.delete(announcements);
    await tx.delete(meetings);
    await tx.delete(monthlyClosings);
    await tx.delete(auditLogs);
    await tx.delete(paymentAllocations);
    await tx.delete(payments);
    await tx.delete(subscriptions);
    await tx.delete(serviceTransactions);
    await tx.delete(services);
    await tx.delete(waterReadings);
    await tx.delete(generalPumping);
    await tx.delete(rentContracts);
    await tx.delete(credits);
    await tx.delete(cashFund);
    await tx.delete(expenses);
    await tx.delete(debts);
    await tx.delete(residents);
    await tx.delete(apartments);

    console.log('🧹 Cleaned existing operational data.');

    // Step 2: Ensure Building exists
    let buildingId = 1;
    const existingBuildings = await tx.select().from(buildings).limit(1);
    if (existingBuildings.length === 0) {
      const createdB = await tx.insert(buildings).values({
        name: 'برج الأمل السكني',
        address: 'حي النصر - شارع الوحدة'
      }).returning();
      buildingId = createdB[0].id;
    } else {
      buildingId = existingBuildings[0].id;
      await tx.update(buildings).set({
        name: existingBuildings[0].name || 'برج الأمل السكني',
        updatedAt: new Date()
      }).where(eq(buildings.id, buildingId));
    }

    // Step 3: Insert 20 Apartments & Residents
    const aptRawData = [
      {
        id: 2,
        apartmentNumber: "101",
        floor: "الاول",
        residentName: "ابو بسام شعث",
        residentType: "owner",
        phone: "0599502507",
        membersCount: 6,
        notes: "",
        debtLines: []
      },
      {
        id: 30001,
        apartmentNumber: "102",
        floor: "الاول",
        residentName: "ابو جمال علوان",
        residentType: "tenant",
        phone: "0594468765",
        membersCount: 4,
        notes: "",
        debtLines: []
      },
      {
        id: 60001,
        apartmentNumber: "103",
        floor: "الاول",
        residentName: "ابو يامن جودة",
        residentType: "owner",
        phone: "0598143441",
        membersCount: 8,
        notes: "",
        debtLines: [
          {
            type: "rent",
            sourceId: 1,
            reference: "إيجار 2026-08",
            date: "2026-08-01",
            amountDue: 300,
            amountPaid: 0,
            remaining: 300
          }
        ]
      },
      {
        id: 60002,
        apartmentNumber: "104",
        floor: "الاول",
        residentName: "ابو مهند نصار",
        residentType: "owner",
        phone: "0597955712",
        membersCount: 6,
        notes: "",
        debtLines: []
      },
      {
        id: 90001,
        apartmentNumber: "201",
        floor: "الثاني",
        residentName: "محمد زاهر القدرة",
        residentType: "tenant",
        phone: "0599143106",
        membersCount: 4,
        notes: "صاحب الشقة الرئيسي محمود عليان",
        debtLines: [
          {
            type: "historical",
            sourceId: 30001,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 150,
            amountPaid: 0,
            remaining: 150
          },
          {
            type: "rent",
            sourceId: 30001,
            reference: "إيجار 2026-08",
            date: "2026-08-01",
            amountDue: 350,
            amountPaid: 0,
            remaining: 350
          }
        ]
      },
      {
        id: 120001,
        apartmentNumber: "202",
        floor: "الثاني",
        residentName: "غازي جمال البس",
        residentType: "owner",
        phone: "0597243612",
        membersCount: 5,
        notes: "",
        debtLines: [
          {
            type: "historical",
            sourceId: 30002,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 20,
            amountPaid: 0,
            remaining: 20
          }
        ]
      },
      {
        id: 150001,
        apartmentNumber: "203",
        floor: "الثاني",
        residentName: "احمد الشاعر",
        residentType: "owner",
        phone: "0567774757",
        membersCount: 6,
        notes: "",
        debtLines: []
      },
      {
        id: 180001,
        apartmentNumber: "204",
        floor: "الثاني",
        residentName: "محمد الهندي",
        residentType: "owner",
        phone: "0594403737",
        membersCount: 8,
        notes: "",
        debtLines: []
      },
      {
        id: 210001,
        apartmentNumber: "301",
        floor: "الثالث",
        residentName: "حسين قشطة",
        residentType: "owner",
        phone: "0567980081",
        membersCount: 6,
        notes: "",
        debtLines: [
          {
            type: "historical",
            sourceId: 30003,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 20,
            amountPaid: 0,
            remaining: 20
          }
        ]
      },
      {
        id: 240002,
        apartmentNumber: "302",
        floor: "الثالث",
        residentName: "سعيد كلاب",
        residentType: "tenant",
        phone: "0592776846",
        membersCount: 5,
        notes: "مالك الشقة شوال ابو عقلين",
        debtLines: [
          {
            type: "historical",
            sourceId: 30004,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 60,
            amountPaid: 0,
            remaining: 60
          }
        ]
      },
      {
        id: 240003,
        apartmentNumber: "303",
        floor: "الثالث",
        residentName: "باسم شاهين",
        residentType: "owner",
        phone: "0599025885",
        membersCount: 5,
        notes: "",
        debtLines: [
          {
            type: "historical",
            sourceId: 60001,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 120,
            amountPaid: 0,
            remaining: 120
          }
        ]
      },
      {
        id: 240004,
        apartmentNumber: "304",
        floor: "الثالث",
        residentName: "اشرف سمور",
        residentType: "owner",
        phone: "0595922354",
        membersCount: 7,
        notes: "",
        debtLines: []
      },
      {
        id: 270001,
        apartmentNumber: "401",
        floor: "الرابع",
        residentName: "احمد السقا",
        residentType: "tenant",
        phone: "0599065141",
        membersCount: 6,
        notes: "مالك الشقة بسام ابو زيد ",
        debtLines: [
          {
            type: "historical",
            sourceId: 120001,
            reference: "استحقاق سابق 2026-07",
            date: "2026-07-01",
            amountDue: 20,
            amountPaid: 0,
            remaining: 20
          },
          {
            type: "water",
            sourceId: 930001,
            reference: "تعبئة مياه بتاريخ 2026-08-28",
            date: "2026-08-28",
            amountDue: 20,
            amountPaid: 0,
            remaining: 20
          }
        ]
      },
      {
        id: 270002,
        apartmentNumber: "402",
        floor: "الرابع",
        residentName: "عمار احمد",
        residentType: "tenant",
        phone: "0597551554",
        membersCount: 10,
        notes: "مالك الشقة محمد الخطيل",
        debtLines: []
      },
      {
        id: 300001,
        apartmentNumber: "403",
        floor: "الرابع",
        residentName: "محمد حسان",
        residentType: "tenant",
        phone: "0597067788",
        membersCount: 4,
        notes: "مالك الشقة محمد شحادة",
        debtLines: [
          {
            type: "historical",
            sourceId: 90001,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 360,
            amountPaid: 0,
            remaining: 360
          }
        ]
      },
      {
        id: 300002,
        apartmentNumber: "404",
        floor: "الرابع",
        residentName: "محمد ماجد القدرة",
        residentType: "tenant",
        phone: "0595162608",
        membersCount: 2,
        notes: "مالك الشقة ادهم جبر",
        debtLines: [
          {
            type: "historical",
            sourceId: 90002,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 260,
            amountPaid: 0,
            remaining: 260
          }
        ]
      },
      {
        id: 330001,
        apartmentNumber: "501",
        floor: "الخامس",
        residentName: "رياض عفانة",
        residentType: "owner",
        phone: "0597197117",
        membersCount: 8,
        notes: "",
        debtLines: []
      },
      {
        id: 330002,
        apartmentNumber: "502",
        floor: "الخامس",
        residentName: "حلمي السقا",
        residentType: "owner",
        phone: "0592472232",
        membersCount: 8,
        notes: "",
        debtLines: []
      },
      {
        id: 360001,
        apartmentNumber: "503",
        floor: "الخامس",
        residentName: "هيثم الجايح",
        residentType: "owner",
        phone: "0599899746",
        membersCount: 5,
        notes: "",
        debtLines: [
          {
            type: "historical",
            sourceId: 90003,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 20,
            amountPaid: 0,
            remaining: 20
          }
        ]
      },
      {
        id: 360002,
        apartmentNumber: "504",
        floor: "الخامس",
        residentName: "سالم زيارة",
        residentType: "owner",
        phone: "0567927729",
        membersCount: 6,
        notes: "",
        debtLines: [
          {
            type: "historical",
            sourceId: 1,
            reference: "استحقاق سابق 2023-10",
            date: "2023-10-01",
            amountDue: 20,
            amountPaid: 0,
            remaining: 20
          },
          {
            type: "historical",
            sourceId: 90004,
            reference: "استحقاق سابق 2026-08",
            date: "2026-08-01",
            amountDue: 300,
            amountPaid: 0,
            remaining: 300
          }
        ]
      }
    ];

    const residentMapByAptId = new Map<number, number>();

    for (const apt of aptRawData) {
      const insertedApt = await tx.insert(apartments).values({
        id: apt.id,
        buildingId: buildingId,
        number: apt.apartmentNumber,
        floor: apt.floor,
        status: 'OCCUPIED',
        waterMeterReading: '0.00',
        accessCode: '123456',
        createdAt: new Date('2026-08-16T09:00:00.000Z'),
        updatedAt: new Date('2026-08-22T08:00:00.000Z')
      }).returning();

      const insertedRes = await tx.insert(residents).values({
        apartmentId: insertedApt[0].id,
        name: apt.residentName,
        phone: apt.phone,
        type: apt.residentType === 'owner' ? 'OWNER' : 'TENANT',
        familyMembers: apt.membersCount || 1,
        startDate: new Date('2026-08-16'),
        notes: apt.notes || '',
        accessCode: '123456',
        createdAt: new Date('2026-08-16T09:00:00.000Z'),
        updatedAt: new Date('2026-08-22T08:00:00.000Z')
      }).returning();

      residentMapByAptId.set(apt.id, insertedRes[0].id);

      // Insert Debts for this apartment if any
      for (const line of apt.debtLines) {
        const sourceEnum = line.type === 'rent' ? 'RENT' : line.type === 'water' ? 'WATER' : 'OTHER';
        await tx.insert(debts).values({
          apartmentId: apt.id,
          residentId: insertedRes[0].id,
          amount: line.amountDue.toFixed(2),
          originalAmount: line.amountDue.toFixed(2),
          remainingAmount: line.remaining.toFixed(2),
          dueDate: new Date(line.date),
          status: line.remaining > 0 ? 'OPEN' : 'PAID',
          source: sourceEnum,
          sourceId: line.sourceId || null,
          notes: line.reference || 'استحقاق مرحل',
          createdAt: new Date(line.date)
        });
      }
    }

    console.log('✅ Apartments, residents, and debt lines inserted.');

    // Step 4: Insert Water Sessions (General Pumping)
    await tx.insert(generalPumping).values({
      id: 30001,
      date: new Date('2026-08-25T11:50:00.000Z'),
      dayName: 'الثلاثاء',
      startTime: '11:50',
      endTime: '14:00',
      time: '11:50 - 14:00',
      supervisor: 'ابو مهند نصار',
      initialReading: '563.90',
      finalReading: '567.40',
      consumption: '3.50',
      electricityPrice: '31.00',
      totalCost: '108.50',
      notes: 'جلسة ضخ مياه عامة بواسطة ابو مهند نصار',
      createdAt: new Date('2026-08-27T09:37:19.000Z')
    });

    // Step 5: Insert 26 Barrel Fills (Water Readings)
    const barrelFills = [
      {
        id: 930001,
        apartmentId: 270001,
        date: "2026-08-28T10:00:00.000Z",
        dayName: "الجمعة",
        time: "10:00",
        quantityLiters: 1000,
        meterReadStart: "0.00",
        meterReadEnd: "1000.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "1000.00",
        cost: "20.00",
        amountPaid: "0.00",
        isPaid: false,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-28T11:43:51.000Z"
      },
      {
        id: 900001,
        apartmentId: 240004,
        date: "2026-08-27T17:00:00.000Z",
        dayName: "الخميس",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "500.00",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-28T11:42:47.000Z"
      },
      {
        id: 870001,
        apartmentId: 90001,
        date: "2026-08-27T17:00:00.000Z",
        dayName: "الخميس",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "500.00",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-28T11:42:03.000Z"
      },
      {
        id: 840001,
        apartmentId: 330002,
        date: "2026-08-15T16:00:00.000Z",
        dayName: "السبت",
        time: "16:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "500.00",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T09:13:02.000Z"
      },
      {
        id: 810001,
        apartmentId: 330001,
        date: "2026-08-15T17:00:00.000Z",
        dayName: "السبت",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "500.00",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T09:12:16.000Z"
      },
      {
        id: 780001,
        apartmentId: 240004,
        date: "2026-08-15T17:00:00.000Z",
        dayName: "السبت",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "500.00",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T09:11:29.000Z"
      },
      {
        id: 750001,
        apartmentId: 240003,
        date: "2026-08-15T17:00:00.000Z",
        dayName: "السبت",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "500.00",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T09:10:47.000Z"
      },
      {
        id: 720001,
        apartmentId: 150001,
        date: "2026-08-15T17:00:00.000Z",
        dayName: "السبت",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "500.00",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T09:10:03.000Z"
      },
      {
        id: 690001,
        apartmentId: 30001,
        date: "2026-08-15T17:00:00.000Z",
        dayName: "السبت",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: "0.00",
        cycleReadEnd: "500.00",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T09:09:12.000Z"
      },
      {
        id: 660001,
        apartmentId: 240003,
        date: "2026-08-26T15:00:00.000Z",
        dayName: "الاربعاء",
        time: "15:00",
        quantityLiters: 500,
        meterReadStart: "457.00",
        meterReadEnd: "957.00",
        cycleReadStart: "4.57",
        cycleReadEnd: "9.57",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T09:01:00.000Z"
      },
      {
        id: 630001,
        apartmentId: 30001,
        date: "2026-08-26T15:00:00.000Z",
        dayName: "الاربعاء",
        time: "15:00",
        quantityLiters: 500,
        meterReadStart: "468.00",
        meterReadEnd: "968.00",
        cycleReadStart: "9.68",
        cycleReadEnd: "4.68",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T09:00:13.000Z"
      },
      {
        id: 600001,
        apartmentId: 270002,
        date: "2026-08-26T15:00:00.000Z",
        dayName: "الاربعاء",
        time: "15:00",
        quantityLiters: 500,
        meterReadStart: "224.00",
        meterReadEnd: "724.00",
        cycleReadStart: "7.24",
        cycleReadEnd: "2.24",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T08:59:30.000Z"
      },
      {
        id: 570001,
        apartmentId: 270001,
        date: "2026-08-26T15:00:00.000Z",
        dayName: "الاربعاء",
        time: "15:00",
        quantityLiters: 500,
        meterReadStart: "490.00",
        meterReadEnd: "990.00",
        cycleReadStart: "4.90",
        cycleReadEnd: "9.90",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T08:58:45.000Z"
      },
      {
        id: 540001,
        apartmentId: 240002,
        date: "2026-08-26T15:00:00.000Z",
        dayName: "الاربعاء",
        time: "15:00",
        quantityLiters: 500,
        meterReadStart: "343.00",
        meterReadEnd: "843.00",
        cycleReadStart: "3.43",
        cycleReadEnd: "8.43",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T08:56:52.000Z"
      },
      {
        id: 510001,
        apartmentId: 150001,
        date: "2026-08-26T15:00:00.000Z",
        dayName: "الاربعاء",
        time: "15:00",
        quantityLiters: 500,
        meterReadStart: "462.00",
        meterReadEnd: "962.00",
        cycleReadStart: "9.62",
        cycleReadEnd: "4.62",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-27T08:54:49.000Z"
      },
      {
        id: 480002,
        apartmentId: 270002,
        date: "2026-08-25T18:00:00.000Z",
        dayName: "الثلاثاء",
        time: "18:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-25T18:03:37.000Z"
      },
      {
        id: 480001,
        apartmentId: 270001,
        date: "2026-08-25T17:00:00.000Z",
        dayName: "الثلاثاء",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-25T18:03:02.000Z"
      },
      {
        id: 450001,
        apartmentId: 30001,
        date: "2026-08-25T17:00:00.000Z",
        dayName: "الثلاثاء",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-25T18:01:54.000Z"
      },
      {
        id: 420001,
        apartmentId: 150001,
        date: "2026-08-25T17:00:00.000Z",
        dayName: "الثلاثاء",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-25T18:01:00.000Z"
      },
      {
        id: 390001,
        apartmentId: 240003,
        date: "2026-08-25T17:00:00.000Z",
        dayName: "الثلاثاء",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "0.00",
        meterReadEnd: "500.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-25T18:00:08.000Z"
      },
      {
        id: 360004,
        apartmentId: 300002,
        date: "2026-08-23T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "76.00",
        meterReadEnd: "576.00",
        cycleReadStart: "5.76",
        cycleReadEnd: "0.76",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-23T19:18:34.000Z"
      },
      {
        id: 360003,
        apartmentId: 90001,
        date: "2026-08-23T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "360.00",
        meterReadEnd: "860.00",
        cycleReadStart: "8.60",
        cycleReadEnd: "3.60",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-23T19:17:24.000Z"
      },
      {
        id: 360002,
        apartmentId: 150001,
        date: "2026-08-23T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "462.00",
        meterReadEnd: "962.00",
        cycleReadStart: "9.62",
        cycleReadEnd: "4.62",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-23T19:16:17.000Z"
      },
      {
        id: 360001,
        apartmentId: 240004,
        date: "2026-08-23T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 590,
        meterReadStart: "292.00",
        meterReadEnd: "792.00",
        cycleReadStart: "7.92",
        cycleReadEnd: "2.92",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-23T19:15:07.000Z"
      },
      {
        id: 330001,
        apartmentId: 240002,
        date: "2026-08-22T17:00:00.000Z",
        dayName: "السبت",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "357.00",
        meterReadEnd: "857.00",
        cycleReadStart: "8.57",
        cycleReadEnd: "3.57",
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-23T04:28:11.000Z"
      },
      {
        id: 300001,
        apartmentId: 270001,
        date: "2026-08-18T17:00:00.000Z",
        dayName: "الثلاثاء",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "475.00",
        meterReadEnd: "975.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:32:33.000Z"
      },
      {
        id: 270001,
        apartmentId: 270002,
        date: "2026-08-20T17:00:00.000Z",
        dayName: "الخميس",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "223.00",
        meterReadEnd: "723.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:17:42.000Z"
      },
      {
        id: 240001,
        apartmentId: 240004,
        date: "2026-08-18T16:00:00.000Z",
        dayName: "الثلاثاء",
        time: "16:00",
        quantityLiters: 1000,
        meterReadStart: "0.00",
        meterReadEnd: "1000.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "20.00",
        amountPaid: "20.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:13:41.000Z"
      },
      {
        id: 210001,
        apartmentId: 150001,
        date: "2026-08-16T19:00:00.000Z",
        dayName: "الاحد",
        time: "19:00",
        quantityLiters: 500,
        meterReadStart: "495.00",
        meterReadEnd: "995.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:09:57.000Z"
      },
      {
        id: 180001,
        apartmentId: 30001,
        date: "2026-08-16T18:00:00.000Z",
        dayName: "الاحد",
        time: "18:00",
        quantityLiters: 500,
        meterReadStart: "464.00",
        meterReadEnd: "964.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "التعبئة من عداد شقة 501 عفانة",
        createdAt: "2026-08-22T09:09:08.000Z"
      },
      {
        id: 150001,
        apartmentId: 270001,
        date: "2026-08-16T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "475.00",
        meterReadEnd: "975.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:06:27.000Z"
      },
      {
        id: 120001,
        apartmentId: 60002,
        date: "2026-08-16T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "5.00",
        meterReadEnd: "505.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:05:42.000Z"
      },
      {
        id: 90002,
        apartmentId: 330002,
        date: "2026-08-16T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "487.00",
        meterReadEnd: "987.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:05:03.000Z"
      },
      {
        id: 90001,
        apartmentId: 240002,
        date: "2026-08-16T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "351.00",
        meterReadEnd: "851.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:04:27.000Z"
      },
      {
        id: 60001,
        apartmentId: 90001,
        date: "2026-08-16T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "360.00",
        meterReadEnd: "860.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T09:01:18.000Z"
      },
      {
        id: 30001,
        apartmentId: 300002,
        date: "2026-08-16T17:00:00.000Z",
        dayName: "الاحد",
        time: "17:00",
        quantityLiters: 500,
        meterReadStart: "475.00",
        meterReadEnd: "975.00",
        cycleReadStart: null,
        cycleReadEnd: null,
        cost: "10.00",
        amountPaid: "10.00",
        isPaid: true,
        status: "SUCCESS",
        notes: "",
        createdAt: "2026-08-22T08:56:19.000Z"
      }
    ];

    for (const bf of barrelFills) {
      const costVal = parseFloat(bf.cost || '10.00') || 10;
      const isPaid = bf.isPaid;
      const remVal = isPaid ? 0 : costVal;
      const resId = residentMapByAptId.get(bf.apartmentId) || null;

      const [insertedDebt] = await tx.insert(debts).values({
        apartmentId: bf.apartmentId,
        residentId: resId,
        amount: costVal.toFixed(2),
        originalAmount: costVal.toFixed(2),
        remainingAmount: remVal.toFixed(2),
        dueDate: new Date(new Date(bf.date).getTime() + 14 * 24 * 60 * 60 * 1000),
        status: isPaid ? 'PAID' : 'OPEN',
        source: 'WATER',
        sourceId: bf.id,
        notes: `تعبئة مياه (${bf.quantityLiters} لتر)`
      }).returning();

      await tx.insert(waterReadings).values({
        id: bf.id,
        apartmentId: bf.apartmentId,
        fillDate: new Date(bf.date),
        dayName: bf.dayName,
        fillTime: bf.time,
        litersQuantity: bf.quantityLiters.toString(),
        previousReading: bf.meterReadStart,
        newReading: bf.meterReadEnd,
        manualCycleStart: bf.cycleReadStart,
        manualCycleEnd: bf.cycleReadEnd,
        consumption: ((parseFloat(bf.meterReadEnd) - parseFloat(bf.meterReadStart)) / 1000).toFixed(2),
        date: new Date(bf.date),
        unitPrice: '20.00',
        amount: bf.cost,
        isPaid: bf.isPaid,
        paymentMethod: bf.isPaid ? 'CASH' : 'UNPAID',
        fillStatus: bf.status,
        stumbleReason: '',
        notes: bf.notes,
        debtId: insertedDebt?.id || null,
        createdAt: new Date(bf.createdAt)
      });
    }

    console.log('✅ Water sessions & barrel fills inserted.');

    // Step 6: Insert Rent Contracts
    const rentContractData = [
      {
        id: 60001,
        apartmentId: 360001,
        tenantName: "هيثم اشرف الجايح",
        phone: "0599899746",
        unitName: "الغرفة الشمالية ( غرفة الغاز)",
        monthlyRent: "200.00",
        startDate: "2026-06-20",
        endDate: "2026-12-20",
        dueDay: 1,
        status: "ACTIVE" as const,
        notes: "",
        createdAt: "2026-08-25T08:20:36.000Z"
      },
      {
        id: 30001,
        apartmentId: 90001,
        tenantName: "محمد زاهر القدرة",
        phone: "0599143106",
        unitName: "مختبر في المظلة",
        monthlyRent: "350.00",
        startDate: "2026-03-01",
        endDate: "2026-08-23",
        dueDay: 1,
        status: "ACTIVE" as const,
        notes: "",
        createdAt: "2026-08-23T04:38:19.000Z"
      },
      {
        id: 1,
        apartmentId: 60001,
        tenantName: "ابو يامن جودة",
        phone: "0598143441",
        unitName: "الغرفة الخلفية الارضية",
        monthlyRent: "300.00",
        startDate: "2026-01-01",
        endDate: "2027-08-16",
        dueDay: 1,
        status: "ACTIVE" as const,
        notes: "",
        createdAt: "2026-08-16T19:09:34.000Z"
      }
    ];

    for (const rc of rentContractData) {
      const resId = residentMapByAptId.get(rc.apartmentId);
      await tx.insert(rentContracts).values({
        id: rc.id,
        apartmentId: rc.apartmentId,
        tenantId: resId || null,
        tenantName: rc.tenantName,
        tenantPhone: rc.phone,
        unitDescription: rc.unitName,
        monthlyRent: rc.monthlyRent,
        startDate: new Date(rc.startDate),
        endDate: new Date(rc.endDate),
        dueDay: rc.dueDay,
        status: rc.status,
        notes: rc.notes,
        createdAt: new Date(rc.createdAt),
        updatedAt: new Date(rc.createdAt)
      });
    }

    console.log('✅ Rent contracts inserted.');

    // Step 7: Insert Financial Transactions (Cash Fund & Expenses & Payments)
    const financialTxList = [
      {
        id: 690001,
        type: "INCOME" as const,
        category: "إيجار وحدة",
        amount: "200.00",
        date: "2026-08-29",
        responsible: "Eng Ali B. Shaat",
        referenceId: "RENT-60001-2026-08",
        apartmentId: 360001,
        notes: "تحصيل إيجار هيثم اشرف الجايح (المسؤول: Eng Ali B. Shaat)",
        createdAt: "2026-08-29T07:32:06.000Z",
        source: "RENT"
      },
      {
        id: 630002,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-27",
        responsible: "Eng Ali B. Shaat",
        referenceId: "WATER-BARREL-870001",
        apartmentId: 90001,
        notes: "تعبئة مياه للشقة ID 90001 بتاريخ 2026-08-27 (المسؤول: Eng Ali B. Shaat)",
        createdAt: "2026-08-28T15:24:57.000Z",
        source: "WATER"
      },
      {
        id: 630001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-27",
        responsible: "Eng Ali B. Shaat",
        referenceId: "WATER-BARREL-900001",
        apartmentId: 240004,
        notes: "تعبئة مياه للشقة ID 240004 بتاريخ 2026-08-27 (المسؤول: Eng Ali B. Shaat)",
        createdAt: "2026-08-28T15:24:32.000Z",
        source: "WATER"
      },
      {
        id: 600008,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-26",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-660001",
        apartmentId: 240003,
        notes: "تعبئة مياه للشقة ID 240003 بتاريخ 2026-08-26 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:39:26.000Z",
        source: "WATER"
      },
      {
        id: 660002,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-26",
        responsible: "Eng Ali B. Shaat",
        referenceId: "WATER-BARREL-540001",
        apartmentId: 240002,
        notes: "تعبئة مياه للشقة ID 240002 بتاريخ 2026-08-26 (المسؤول: Eng Ali B. Shaat)",
        createdAt: "2026-08-28T17:33:34.000Z",
        source: "WATER"
      },
      {
        id: 600012,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-26",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-510001",
        apartmentId: 150001,
        notes: "تعبئة مياه للشقة ID 150001 بتاريخ 2026-08-26 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:40:18.000Z",
        source: "WATER"
      },
      {
        id: 600011,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-26",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-570001",
        apartmentId: 270001,
        notes: "تعبئة مياه للشقة ID 270001 بتاريخ 2026-08-26 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:40:09.000Z",
        source: "WATER"
      },
      {
        id: 600010,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-26",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-600001",
        apartmentId: 270002,
        notes: "تعبئة مياه للشقة ID 270002 بتاريخ 2026-08-26 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:40:01.000Z",
        source: "WATER"
      },
      {
        id: 600009,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-26",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-630001",
        apartmentId: 30001,
        notes: "تعبئة مياه للشقة ID 30001 بتاريخ 2026-08-26 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:39:35.000Z",
        source: "WATER"
      },
      {
        id: 570001,
        type: "EXPENSE" as const,
        category: "ضخ مياه عام",
        amount: "108.50",
        date: "2026-08-25",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-PUMP-30001",
        apartmentId: null,
        notes: "تكلفة جلسة ضخ بتاريخ 2026-08-25 واستهلاك 3.5 وحدة (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-27T09:37:19.000Z",
        source: "PUMPING"
      },
      {
        id: 600007,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-25",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-480002",
        apartmentId: 270002,
        notes: "تعبئة مياه للشقة ID 270002 بتاريخ 2026-08-25 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:38:22.000Z",
        source: "WATER"
      },
      {
        id: 600005,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-25",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-480001",
        apartmentId: 270001,
        notes: "تعبئة مياه للشقة ID 270001 بتاريخ 2026-08-25 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:37:37.000Z",
        source: "WATER"
      },
      {
        id: 510001,
        type: "EXPENSE" as const,
        category: "مصروف مشروع: صيانة عوام البرميل السفلي ",
        amount: "30.00",
        date: "2026-08-25",
        responsible: "Mohammed Alhendi",
        referenceId: "PROJECT-EXP-1",
        apartmentId: null,
        notes: "الصيانة — المورد: السباك (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-25T16:07:07.000Z",
        source: "EXPENSE"
      },
      {
        id: 720001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-25",
        responsible: "Eng Ali B. Shaat",
        referenceId: "WATER-BARREL-420001",
        apartmentId: 150001,
        notes: "تعبئة مياه للشقة ID 150001 بتاريخ 2026-08-25 (المسؤول: Eng Ali B. Shaat)",
        createdAt: "2026-08-29T19:47:25.000Z",
        source: "WATER"
      },
      {
        id: 600006,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-25",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-390001",
        apartmentId: 240003,
        notes: "تعبئة مياه للشقة ID 240003 بتاريخ 2026-08-25 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:37:57.000Z",
        source: "WATER"
      },
      {
        id: 600004,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-25",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-450001",
        apartmentId: 30001,
        notes: "تعبئة مياه للشقة ID 30001 بتاريخ 2026-08-25 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:37:14.000Z",
        source: "WATER"
      },
      {
        id: 480001,
        type: "INCOME" as const,
        category: "رصيد افتتاحي مرحّل",
        amount: "33.00",
        date: "2026-08-24",
        responsible: "Mohammed Alhendi",
        referenceId: "OPENING-BALANCE",
        apartmentId: null,
        notes: "نقدا موجود لدى امين الصندوق المهندس ابو بسام شعت (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-24T17:56:23.000Z",
        source: "INITIAL_BALANCE"
      },
      {
        id: 630003,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-23",
        responsible: "Eng Ali B. Shaat",
        referenceId: "WATER-BARREL-360003",
        apartmentId: 90001,
        notes: "تعبئة مياه للشقة ID 90001 بتاريخ 2026-08-23 (المسؤول: Eng Ali B. Shaat)",
        createdAt: "2026-08-28T15:24:59.000Z",
        source: "WATER"
      },
      {
        id: 420001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-23",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-360001",
        apartmentId: 240004,
        notes: "تعبئة مياه للشقة ID 240004 بتاريخ 2026-08-23 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-23T19:15:07.000Z",
        source: "WATER"
      },
      {
        id: 450001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-23",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-360002",
        apartmentId: 150001,
        notes: "تعبئة مياه للشقة ID 150001 بتاريخ 2026-08-23 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-24T17:44:40.000Z",
        source: "WATER"
      },
      {
        id: 660001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-23",
        responsible: "Eng Ali B. Shaat",
        referenceId: "WATER-BARREL-360004",
        apartmentId: 300002,
        notes: "تعبئة مياه للشقة ID 300002 بتاريخ 2026-08-23 (المسؤول: Eng Ali B. Shaat)",
        createdAt: "2026-08-28T17:33:05.000Z",
        source: "WATER"
      },
      {
        id: 330001,
        type: "EXPENSE" as const,
        category: "خدمات إضافية: تنظيف الدرج",
        amount: "20.00",
        date: "2026-08-22",
        responsible: "Mohammed Alhendi",
        referenceId: "SERVICE-30001",
        apartmentId: null,
        notes: "تكلفة خدمة مبنى: تنظيف الدرج (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T09:15:21.000Z",
        source: "EXPENSE"
      },
      {
        id: 450002,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-22",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-330001",
        apartmentId: 240002,
        notes: "تعبئة مياه للشقة ID 240002 بتاريخ 2026-08-22 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-24T17:44:58.000Z",
        source: "WATER"
      },
      {
        id: 360001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-20",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-270001",
        apartmentId: 270002,
        notes: "تعبئة مياه للشقة ID 270002 بتاريخ 2026-08-20 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T09:17:43.000Z",
        source: "WATER"
      },
      {
        id: 300001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "20.00",
        date: "2026-08-18",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-240001",
        apartmentId: 240004,
        notes: "تعبئة مياه للشقة ID 240004 بتاريخ 2026-08-18 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T09:13:41.000Z",
        source: "WATER"
      },
      {
        id: 600003,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-18",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-300001",
        apartmentId: 270001,
        notes: "تعبئة مياه للشقة ID 270001 بتاريخ 2026-08-18 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:35:39.000Z",
        source: "WATER"
      },
      {
        id: 150002,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-16",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-90002",
        apartmentId: 330002,
        notes: "تعبئة مياه للشقة ID 330002 بتاريخ 2026-08-16 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T09:05:03.000Z",
        source: "WATER"
      },
      {
        id: 600002,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-16",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-150001",
        apartmentId: 270001,
        notes: "تعبئة مياه للشقة ID 270001 بتاريخ 2026-08-16 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:35:11.000Z",
        source: "WATER"
      },
      {
        id: 90001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-16",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-30001",
        apartmentId: 300002,
        notes: "تعبئة مياه للشقة ID 300002 بتاريخ 2026-08-16 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T08:56:20.000Z",
        source: "WATER"
      },
      {
        id: 120001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-16",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-60001",
        apartmentId: 90001,
        notes: "تعبئة مياه للشقة ID 90001 بتاريخ 2026-08-16 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T09:01:18.000Z",
        source: "WATER"
      },
      {
        id: 600001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-16",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-210001",
        apartmentId: 150001,
        notes: "تعبئة مياه للشقة ID 150001 بتاريخ 2026-08-16 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-28T11:35:00.000Z",
        source: "WATER"
      },
      {
        id: 150001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-16",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-90001",
        apartmentId: 240002,
        notes: "تعبئة مياه للشقة ID 240002 بتاريخ 2026-08-16 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T09:04:27.000Z",
        source: "WATER"
      },
      {
        id: 240001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-16",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-180001",
        apartmentId: 30001,
        notes: "تعبئة مياه للشقة ID 30001 بتاريخ 2026-08-16 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T09:09:08.000Z",
        source: "WATER"
      },
      {
        id: 180001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-16",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-120001",
        apartmentId: 60002,
        notes: "تعبئة مياه للشقة ID 60002 بتاريخ 2026-08-16 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-22T09:05:42.000Z",
        source: "WATER"
      },
      {
        id: 540005,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-15",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-720001",
        apartmentId: 150001,
        notes: "تعبئة مياه للشقة ID 150001 بتاريخ 2026-08-15 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-27T09:25:42.000Z",
        source: "WATER"
      },
      {
        id: 540003,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-15",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-780001",
        apartmentId: 240004,
        notes: "تعبئة مياه للشقة ID 240004 بتاريخ 2026-08-15 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-27T09:25:22.000Z",
        source: "WATER"
      },
      {
        id: 540002,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-15",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-810001",
        apartmentId: 330001,
        notes: "تعبئة مياه للشقة ID 330001 بتاريخ 2026-08-15 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-27T09:25:11.000Z",
        source: "WATER"
      },
      {
        id: 540004,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-15",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-750001",
        apartmentId: 240003,
        notes: "تعبئة مياه للشقة ID 240003 بتاريخ 2026-08-15 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-27T09:25:34.000Z",
        source: "WATER"
      },
      {
        id: 540006,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-15",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-690001",
        apartmentId: 30001,
        notes: "تعبئة مياه للشقة ID 30001 بتاريخ 2026-08-15 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-27T09:25:50.000Z",
        source: "WATER"
      },
      {
        id: 540001,
        type: "INCOME" as const,
        category: "تعبئة مياه للسكان",
        amount: "10.00",
        date: "2026-08-15",
        responsible: "Mohammed Alhendi",
        referenceId: "WATER-BARREL-840001",
        apartmentId: 330002,
        notes: "تعبئة مياه للشقة ID 330002 بتاريخ 2026-08-15 (المسؤول: Mohammed Alhendi)",
        createdAt: "2026-08-27T09:24:58.000Z",
        source: "WATER"
      }
    ];

    for (const ftx of financialTxList) {
      await tx.insert(cashFund).values({
        id: ftx.id,
        type: ftx.type,
        amount: ftx.amount,
        date: new Date(ftx.date),
        source: ftx.source,
        apartmentId: ftx.apartmentId,
        paymentMethod: 'نقدي',
        notes: ftx.notes,
        createdAt: new Date(ftx.createdAt)
      });

      // If it's an expense, record it into expenses table as well
      if (ftx.type === 'EXPENSE') {
        await tx.insert(expenses).values({
          buildingId: buildingId,
          category: ftx.category,
          description: ftx.notes,
          amount: ftx.amount,
          date: new Date(ftx.date),
          payee: ftx.responsible,
          method: 'نقدي',
          notes: ftx.notes,
          createdAt: new Date(ftx.createdAt)
        });
      }

      // If it's an income associated with an apartment, record a payment receipt
      if (ftx.type === 'INCOME' && ftx.apartmentId) {
        const resId = residentMapByAptId.get(ftx.apartmentId);
        await tx.insert(payments).values({
          apartmentId: ftx.apartmentId,
          residentId: resId || null,
          amount: ftx.amount,
          date: new Date(ftx.date),
          method: 'نقدي',
          reference: ftx.referenceId,
          notes: ftx.notes,
          createdAt: new Date(ftx.createdAt)
        });
      }
    }

    console.log('✅ Cash fund, expenses, and payments populated.');
  });

  console.log('🎉 Data reset & reload successfully completed!');
}

// If invoked directly from CLI
if (process.argv[1]?.includes('seed-fresh-data')) {
  resetAndSeedFreshData()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error during data reset & seeding:', err);
      process.exit(1);
    });
}
