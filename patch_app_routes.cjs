const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const newImports = `
import { Projects } from './pages/Projects';
import { Community } from './pages/Community';
import { CashFund } from './pages/CashFund';
import { ExpenseCalculator } from './pages/ExpenseCalculator';
import { Notifications } from './pages/Notifications';
import { TenantPortal } from './pages/TenantPortal';
`;

const routesCode = `
          <Route path="projects" element={<Projects />} />
          <Route path="community" element={<Community />} />
          <Route path="cash-fund" element={<CashFund />} />
          <Route path="calculator" element={<ExpenseCalculator />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="tenant" element={<TenantPortal />} />
`;

appCode = newImports + "\n" + appCode;
appCode = appCode.replace(/<Route path="settings" element=\{<Settings \/>\} \/>/, 
  '<Route path="settings" element={<Settings />} />\n' + routesCode);

fs.writeFileSync('src/App.tsx', appCode);
console.log("App.tsx patched");

// Creating placeholder components
const pages = ['Projects', 'Community', 'CashFund', 'ExpenseCalculator', 'Notifications', 'TenantPortal'];

pages.forEach(p => {
  fs.writeFileSync('src/pages/' + p + '.tsx', `
import React from 'react';

export function ` + p + `() {
  return (
    <div>
      <h1 className="text-3xl font-bold">` + p + `</h1>
      <p className="mt-4 text-muted-foreground">قريباً...</p>
    </div>
  );
}
  `);
});

