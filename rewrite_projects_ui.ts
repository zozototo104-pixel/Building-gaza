import fs from 'fs';

const content = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Building, Plus, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

export function Projects() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [cashFund, setCashFund] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [pRes, cRes] = await Promise.all([
        fetch('/api/projects', { headers: { Authorization: \`Bearer \${token}\` } }),
        fetch('/api/cash-fund', { headers: { Authorization: \`Bearer \${token}\` } })
      ]);
      
      if (pRes.ok) setProjects(await pRes.json());
      if (cRes.ok) setCashFund(await cRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddProject = async (data: any) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          budget: parseFloat(data.budget) || 0,
          startDate: data.startDate || new Date().toISOString(),
          status: data.status || 'PLANNED',
        })
      });
      if (res.ok) {
        toast.success('تمت الإضافة بنجاح');
        setIsDialogOpen(false);
        reset();
        fetchData();
      }
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  // Compute metrics for each project
  const projectsWithMetrics = projects.map(p => {
    const projectTxs = cashFund.filter(tx => tx.projectId === p.id);
    const collected = projectTxs.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const spent = projectTxs.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const budget = parseFloat(p.budget) || 0;
    
    // المتبقي الفرق بين الهدف والمحصّل أو بين المحصل والمصروف
    const remainingToCollect = Math.max(0, budget - collected);
    const remainingToSpend = Math.max(0, collected - spent);
    const deficit = spent > collected ? spent - collected : 0;
    
    return {
      ...p,
      collected,
      spent,
      budget,
      remainingToCollect,
      remainingToSpend,
      deficit
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">المشاريع والصيانة</h2>
          <p className="text-muted-foreground mt-1">
            إدارة المشاريع التطويرية وصيانة العمارة
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة مشروع
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء مشروع جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(handleAddProject)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">اسم المشروع</label>
                <Input {...register('name')} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الوصف</label>
                <Input {...register('description')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">الميزانية المستهدفة</label>
                  <Input type="number" step="0.01" {...register('budget')} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">تاريخ البداية</label>
                  <Input type="date" {...register('startDate')} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">الحالة</label>
                <select {...register('status')} className="flex h-10 w-full rounded-md border px-3 py-2 text-sm">
                  <option value="PLANNED">مخطط</option>
                  <option value="IN_PROGRESS">قيد التنفيذ</option>
                  <option value="COMPLETED">مكتمل</option>
                  <option value="CANCELLED">ملغى</option>
                </select>
              </div>
              <Button type="submit" className="w-full">حفظ المشروع</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>قائمة المشاريع</CardTitle>
          <CardDescription>التحصيل والصرف للمشاريع</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">جاري التحميل...</div>
          ) : projectsWithMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا توجد مشاريع حالياً.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المشروع</TableHead>
                  <TableHead>الميزانية</TableHead>
                  <TableHead>المحصل</TableHead>
                  <TableHead>المصروف</TableHead>
                  <TableHead>باقي للتحصيل</TableHead>
                  <TableHead>العجز</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectsWithMetrics.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <div className="bg-primary/10 p-1.5 rounded-full">
                        <Building className="h-4 w-4 text-primary" />
                      </div>
                      {project.name}
                    </TableCell>
                    <TableCell className="font-bold">{project.budget.toLocaleString()}</TableCell>
                    <TableCell className="text-emerald-600 font-bold">{project.collected.toLocaleString()}</TableCell>
                    <TableCell className="text-rose-600 font-bold">{project.spent.toLocaleString()}</TableCell>
                    <TableCell>{project.remainingToCollect > 0 ? project.remainingToCollect.toLocaleString() : '-'}</TableCell>
                    <TableCell className={project.deficit > 0 ? 'text-destructive font-bold' : ''}>
                      {project.deficit > 0 ? project.deficit.toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={project.status === 'COMPLETED' ? 'default' : 'outline'}>
                        {project.status === 'PLANNED' ? 'مخطط' : 
                         project.status === 'IN_PROGRESS' ? 'قيد التنفيذ' : 
                         project.status === 'COMPLETED' ? 'مكتمل' : 'ملغى'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/Projects.tsx', content);
console.log("Projects rewritten");
