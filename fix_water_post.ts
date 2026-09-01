import fs from 'fs';
let content = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

const oldWaterPost = `    const newRecord = await db.insert(waterReadings).values({
      apartmentId,
      previousReading: previousReading.toString(),
      newReading: newReading.toString(),
      consumption: consumption.toString(),
      unitPrice: unitPrice.toString(),
      amount: amount.toString(),
      notes
    }).returning();
    
    // Update apartment water meter reading
    await db.update(apartments).set({
      waterMeterReading: newReading.toString()
    }).where(eq(apartments.id, apartmentId));

    // Also, we should create a debt for this water bill!
    await db.insert(debts).values({
      apartmentId,
      amount: amount.toString(),
      originalAmount: amount.toString(),
      remainingAmount: amount.toString(),
      dueDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'OPEN',
      source: 'WATER',
      notes: notes || \`فاتورة مياه (\${consumption} وحدة)\`,
    });
    
    res.json(newRecord[0]);`;

const newWaterPost = `    // Create a debt for this water bill!
    const newDebt = await db.insert(debts).values({
      apartmentId,
      amount: amount.toString(),
      originalAmount: amount.toString(),
      remainingAmount: amount.toString(),
      dueDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      status: 'OPEN',
      source: 'WATER',
      notes: notes || \`فاتورة مياه (\${consumption} وحدة)\`,
    }).returning();
    
    const newRecord = await db.insert(waterReadings).values({
      apartmentId,
      previousReading: previousReading.toString(),
      newReading: newReading.toString(),
      consumption: consumption.toString(),
      unitPrice: unitPrice.toString(),
      amount: amount.toString(),
      notes,
      debtId: newDebt[0].id
    }).returning();
    
    // Update apartment water meter reading
    await db.update(apartments).set({
      waterMeterReading: newReading.toString()
    }).where(eq(apartments.id, apartmentId));
    
    res.json(newRecord[0]);`;

content = content.replace(oldWaterPost, newWaterPost);

fs.writeFileSync('src/server/routes/index.ts', content);
console.log("Water route updated");
