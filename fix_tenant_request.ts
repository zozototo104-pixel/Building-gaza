import fs from 'fs';
let content = fs.readFileSync('src/pages/TenantPortal.tsx', 'utf-8');

if (!content.includes('isRequestDialogOpen')) {
    content = content.replace(
        "const [contracts, setContracts] = useState<any[]>([]);",
        `const [contracts, setContracts] = useState<any[]>([]);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestText, setRequestText] = useState('');
  
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('تم إرسال طلب الصيانة للإدارة بنجاح.');
    setIsRequestDialogOpen(false);
    setRequestText('');
  };`
    );
}

if (!content.includes('Dialog')) {
    content = content.replace(
        "import { DoorOpen, FileText, Bell, PenTool } from 'lucide-react';",
        "import { DoorOpen, FileText, Bell, PenTool } from 'lucide-react';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';\nimport { Textarea } from '@/components/ui/textarea';"
    );
}

const oldBtn = `<Button className="w-full sm:w-auto gap-2">
                <PenTool className="w-4 h-4" />
                رفع طلب صيانة جديد
              </Button>`;
const newBtn = `<Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogTrigger render={<Button className="w-full sm:w-auto gap-2"><PenTool className="w-4 h-4" /> رفع طلب صيانة جديد</Button>} />
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>رفع طلب صيانة</DialogTitle></DialogHeader>
                  <form onSubmit={handleRequestSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">تفاصيل المشكلة</label>
                      <Textarea value={requestText} onChange={e => setRequestText(e.target.value)} required rows={4} />
                    </div>
                    <Button type="submit" className="w-full">إرسال الطلب</Button>
                  </form>
                </DialogContent>
              </Dialog>`;
content = content.replace(oldBtn, newBtn);

fs.writeFileSync('src/pages/TenantPortal.tsx', content);
