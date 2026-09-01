const fs = require('fs');

let content = fs.readFileSync('src/server/routes/index.ts', 'utf8');

// Fix inArray import
content = content.replace(/import { eq, desc } from 'drizzle-orm';/, "import { eq, desc, inArray } from 'drizzle-orm';");
content = content.replace(/import { eq, desc, and } from 'drizzle-orm';/, "import { eq, desc, and, inArray } from 'drizzle-orm';");
if (!content.includes('inArray')) {
  content = content.replace(/import { eq, /g, 'import { eq, inArray, ');
}

// Fix buildingId unknown type by casting to number
content = content.replace(/buildingId: building\?\.id \|\| 1/g, 'buildingId: (building?.id || 1) as number');

// Fix req.userRecord to (req as any).userRecord
content = content.replace(/req\.userRecord/g, '(req as any).userRecord');

fs.writeFileSync('src/server/routes/index.ts', content);
