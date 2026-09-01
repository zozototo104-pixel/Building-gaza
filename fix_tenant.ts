import fs from 'fs';
let content = fs.readFileSync('src/pages/TenantPortal.tsx', 'utf-8');

const oldFetch = `    // Mock data for tenant view since we don't have a direct /api/my-portal yet
    // In a real app this would fetch based on current resident ID
    setDebts([
      { id: 1, type: 'WATER', amount: '150', status: 'OPEN', date: new Date().toISOString() },
      { id: 2, type: 'MAINTENANCE', amount: '200', status: 'PAID', date: new Date().toISOString() }
    ]);`;

const newFetch = `    fetch('/api/my-portal', { headers: { 'Authorization': \`Bearer \${localStorage.getItem('token')}\` } })
      .then(res => res.json())
      .then(data => {
        setDebts(data.debts || []);
        setContracts(data.contracts || []);
      })
      .catch(console.error);`;

content = content.replace(oldFetch, newFetch);
fs.writeFileSync('src/pages/TenantPortal.tsx', content);
