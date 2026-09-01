import fs from 'fs';
let content = fs.readFileSync('src/pages/CashFund.tsx', 'utf-8');

if (!content.includes('Dialog')) {
    content = content.replace(
        "import { Plus, Download } from 'lucide-react';",
        "import { Plus, Download } from 'lucide-react';\nimport { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';\nimport { Input } from '@/components/ui/input';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';"
    );
}

if (!content.includes('isDialogOpen')) {
    content = content.replace(
        "const [loading, setLoading] = useState(true);",
        "const [loading, setLoading] = useState(true);\n  const [isDialogOpen, setIsDialogOpen] = useState(false);\n  const [amount, setAmount] = useState('');\n  const [type, setType] = useState('IN');\n  const [notes, setNotes] = useState('');"
    );
}

if (!content.includes('handleAddTx')) {
    const handleAdd = `
  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cash-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${localStorage.getItem('token')}\` },
        body: JSON.stringify({ amount, type, source: type === 'IN' ? 'PAYMENT' : 'EXPENSE', notes })
      });
      if (res.ok) {
        const newData = await res.json();
        setTransactions([newData, ...transactions]);
        setIsDialogOpen(false);
        setAmount('');
        setNotes('');
        // Update balance
        setBalance(prev => type === 'IN' ? prev + Number(amount) : prev - Number(amount));
      }
    } catch(err) {}
  };
`;
    content = content.replace("useEffect(() => {", handleAdd + "\n  useEffect(() => {");
}

const oldPlusBtn = `<Button className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة حركة
          </Button>`;
const newPlusBtn = `<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button className="gap-2"><Plus className="w-4 h-4" /> إضافة حركة</Button>} />
            <DialogContent dir="rtl">
              <DialogHeader><DialogTitle>إضافة حركة صندوق</DialogTitle></DialogHeader>
              <form onSubmit={handleAddTx} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">النوع</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">إيداع / إيراد</SelectItem>
                      <SelectItem value="OUT">سحب / مصروف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">المبلغ</label>
                  <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">الوصف</label>
                  <Input value={notes} onChange={e => setNotes(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">حفظ الحركة</Button>
              </form>
            </DialogContent>
          </Dialog>`;
content = content.replace(oldPlusBtn, newPlusBtn);

// Export to CSV logic
if (!content.includes('handleExport')) {
    const handleExport = `
  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "التاريخ,النوع,المبلغ,المصدر,البيان\\n"
      + transactions.map(t => {
          const tDate = new Date(t.date).toLocaleDateString('ar-EG');
          const tType = t.type === 'IN' ? 'إيراد' : 'مصروف';
          const tAmount = parseFloat(t.amount);
          return \`\${tDate},\${tType},\${tAmount},\${t.source},\${t.notes || ''}\`;
      }).join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cash_fund.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;
    content = content.replace("useEffect(() => {", handleExport + "\n  useEffect(() => {");
    content = content.replace(
        `<Button variant="outline" className="gap-2">`,
        `<Button variant="outline" className="gap-2" onClick={handleExport}>`
    );
}

fs.writeFileSync('src/pages/CashFund.tsx', content);
