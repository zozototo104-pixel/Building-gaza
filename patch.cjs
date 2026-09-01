const fs = require('fs');
let code = fs.readFileSync('src/server/routes/users.ts', 'utf8');

const regex = /\/\/ Protect last admin[\s\S]*?return res\.status\(403\)\.json\({ error: 'لا يمكن تعطيل أو تغيير دور آخر مدير فعال في النظام\.' }\);\s*}\s*}/m;

const replacement = `// Protect last admin
    if (targetUser.role === 'admin' && (role !== 'admin' || isActive === false)) {
      // Trying to demote or disable an admin. Check if they are the last active admin.
      const isOk = await db.transaction(async (tx) => {
        await tx.execute(sql\`SELECT pg_advisory_xact_lock(1001)\`);
        const adminCountRes = await tx.select({ count: sql<number>\`count(*)\` })
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
    }`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/server/routes/users.ts', code);
  console.log("Patched successfully");
} else {
  console.log("Target not found");
}
