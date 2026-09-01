import fs from 'fs';
let content = fs.readFileSync('src/pages/TenantPortal.tsx', 'utf-8');

// Remove the state
content = content.replace(/const \[isRequestDialogOpen.*?;/g, '');
content = content.replace(/const \[requestText.*?;/g, '');

// Remove the handler
content = content.replace(/const handleRequestSubmit =[\s\S]*?setRequestText\(''\);\n  };\n/g, '');

// Remove the tab trigger
content = content.replace(/<TabsTrigger value="requests" className="gap-2">الطلبات<\/TabsTrigger>/, '');

// Remove the tab content
content = content.replace(/<TabsContent value="requests"[\s\S]*?<\/TabsContent>/, '');

fs.writeFileSync('src/pages/TenantPortal.tsx', content);
console.log("TenantPortal requests removed");
