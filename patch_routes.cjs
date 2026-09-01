const fs = require('fs');
let code = fs.readFileSync('src/server/routes/index.ts', 'utf8');

const importReplacement = `import setupRoutes from './setup.js';
import usersRoutes from './users.js';
import importRoutes from './import.js';

const router = Router();

// Setup is public
router.use('/setup', setupRoutes);

// Users management (requires auth, and specifically admin)
router.use('/users', usersRoutes);

// Legacy Import
router.use('/import', importRoutes);`;

code = code.replace(/import setupRoutes from '\.\/setup\.js';\nimport usersRoutes from '\.\/users\.js';\n\nconst router = Router\(\);\n\n\/\/ Setup is public[^\n]*\nrouter\.use\('\/setup', setupRoutes\);\n\n\/\/ Users management[^\n]*\nrouter\.use\('\/users', usersRoutes\);/m, importReplacement);

fs.writeFileSync('src/server/routes/index.ts', code);
console.log("routes/index.ts patched");
