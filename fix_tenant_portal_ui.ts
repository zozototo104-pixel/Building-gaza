import fs from 'fs';
let content = fs.readFileSync('src/pages/TenantPortal.tsx', 'utf-8');

content = content.replace('const { appUser } = useAuth();', 'const { userRecord } = useAuth();');
content = content.replace(/appUser\?/g, 'userRecord?');

// Check Dialog usage (Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle)
// Are they imported? No, Dialog is not imported!
if (!content.includes('import { Dialog')) {
  content = content.replace(`import { DoorOpen, FileText, Bell, PenTool } from 'lucide-react';`, `import { DoorOpen, FileText, Bell, PenTool } from 'lucide-react';\nimport { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';`);
}
// Textarea is not imported
if (!content.includes('import { Textarea }')) {
  content = content.replace(`import { Dialog, DialogTrigger`, `import { Textarea } from '@/components/ui/textarea';\nimport { Dialog, DialogTrigger`);
}

fs.writeFileSync('src/pages/TenantPortal.tsx', content);
console.log("Tenant portal UI fixed");
