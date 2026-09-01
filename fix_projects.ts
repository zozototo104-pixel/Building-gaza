import fs from 'fs';
let content = fs.readFileSync('src/pages/Projects.tsx', 'utf-8');

// I need to add Dialog imports
if (!content.includes('Dialog')) {
    content = content.replace(
        "import { Badge } from '@/components/ui/badge';",
        "import { Badge } from '@/components/ui/badge';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';\nimport { Input } from '@/components/ui/input';"
    );
}

// Add state for Dialog
if (!content.includes('const [isDialogOpen, setIsDialogOpen] = useState(false);')) {
    content = content.replace(
        "const [loading, setLoading] = useState(true);",
        "const [loading, setLoading] = useState(true);\n  const [isDialogOpen, setIsDialogOpen] = useState(false);\n  const [name, setName] = useState('');\n  const [budget, setBudget] = useState('');"
    );
}

// Add submit function
if (!content.includes('handleAddProject')) {
    const handleAdd = `
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
        body: JSON.stringify({ name, budget })
      });
      if (res.ok) {
        const newProject = await res.json();
        setProjects([...projects, newProject]);
        setIsDialogOpen(false);
        setName('');
        setBudget('');
      }
    } catch (err) {
      console.error(err);
    }
  };
`;
    content = content.replace("useEffect(() => {", handleAdd + "\n  useEffect(() => {");
}

// Replace button with Dialog
const oldBtn = `<Button className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة مشروع
        </Button>`;
const newBtn = `<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة مشروع
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة مشروع جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProject} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم المشروع</label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الميزانية</label>
                <Input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">حفظ المشروع</Button>
            </form>
          </DialogContent>
        </Dialog>`;

content = content.replace(oldBtn, newBtn);
fs.writeFileSync('src/pages/Projects.tsx', content);
