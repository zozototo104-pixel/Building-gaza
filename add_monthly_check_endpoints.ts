import fs from 'fs';
let content = fs.readFileSync('src/server/routes/index.ts', 'utf-8');

const endpointsToUpdate = [
  { search: `router.post('/debts', async (req, res) => {\n  try {\n`, replace: `router.post('/debts', async (req, res) => {\n  try {\n    await checkMonthlyClosing(req.body.dueDate || new Date());\n` },
  { search: `router.post('/payments', async (req, res) => {\n  try {\n`, replace: `router.post('/payments', async (req, res) => {\n  try {\n    await checkMonthlyClosing(req.body.date || new Date());\n` },
  { search: `router.post('/water', async (req, res) => {\n  try {\n`, replace: `router.post('/water', async (req, res) => {\n  try {\n    await checkMonthlyClosing(new Date());\n` },
  { search: `router.post('/services', async (req, res) => {\n  try {\n`, replace: `router.post('/services', async (req, res) => {\n  try {\n    await checkMonthlyClosing(req.body.dueDate || new Date());\n` },
  { search: `router.post('/rent-contracts', async (req, res) => {\n  try {\n`, replace: `router.post('/rent-contracts', async (req, res) => {\n  try {\n    await checkMonthlyClosing(req.body.startDate || new Date());\n` },
  { search: `router.post('/expenses', async (req, res) => {\n  try {\n`, replace: `router.post('/expenses', async (req, res) => {\n  try {\n    await checkMonthlyClosing(req.body.date || new Date());\n` },
  { search: `router.post('/general-pumping', async (req, res) => {\n  try {\n`, replace: `router.post('/general-pumping', async (req, res) => {\n  try {\n    await checkMonthlyClosing(req.body.date || new Date());\n` }
];

for (const ep of endpointsToUpdate) {
  content = content.replace(ep.search, ep.replace);
}

fs.writeFileSync('src/server/routes/index.ts', content);
console.log("Monthly checks added to endpoints");
