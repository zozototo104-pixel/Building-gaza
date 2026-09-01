const fs = require('fs');

const fix = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\`Bearer \\\${token}\\`/g, '`Bearer ${token}`');
  content = content.replace(/\\`Bearer \\\${localStorage.getItem\('token'\)}\\`/g, '`Bearer ${localStorage.getItem(\'token\')}`');
  content = content.replace(/\\`\/api\/notifications\/\\\${id}\/read\\`/g, '`/api/notifications/${id}/read`');
  
  // also fix some template literals like className={\`... \${...}\`}
  content = content.replace(/\\`/g, '`');
  content = content.replace(/\\\$/g, '$');
  
  fs.writeFileSync(file, content);
}

['src/pages/Community.tsx', 'src/pages/Notifications.tsx', 'src/pages/TenantPortal.tsx'].forEach(f => {
  try {
    fix(f);
  } catch (e) {
    console.error(e);
  }
});
