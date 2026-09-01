import fs from 'fs';
let content = fs.readFileSync('server.ts', 'utf-8');

const oldAuthUser = `      let userRecord = await db.query.users.findFirst({
        where: eq(users.authId, user.id)
      });`;

const newAuthUser = `      let userRecord: any = await db.query.users.findFirst({
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
      }`;

content = content.replace(oldAuthUser, newAuthUser);
fs.writeFileSync('server.ts', content);
console.log("Tenant auth logic added.");
