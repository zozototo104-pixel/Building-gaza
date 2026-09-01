import fs from 'fs';
let content = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

const oldMyPortal = `    const resident = await db.query.residents.findFirst({
        where: eq(residents.name, userRecord.name)
    });`;

const newMyPortal = `    const resident = await db.query.residents.findFirst({
        where: eq(residents.userId, userRecord.id)
    });`;

content = content.replace(oldMyPortal, newMyPortal);
fs.writeFileSync('src/server/routes/index.ts', content);
console.log("my-portal updated to use userId");
