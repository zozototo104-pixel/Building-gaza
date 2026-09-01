import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';

export function ExpenseCalculator() {
  const { getToken } = useAuth();
  const [totalExpense, setTotalExpense] = useState('');
  const [notes, setNotes] = useState('توزيع مصروف مشترك');
  const [apartments, setApartments] = useState<any[]>([]);
  const [results, setResults] = useState<{ apartmentId: number, number: string, share: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApartments = async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/apartments', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setApartments(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchApartments();
  }, [getToken]);

  const calculate = () => {
    const total = parseFloat(totalExpense);
    const count = apartments.length;
    
    if (isNaN(total) || count <= 0) return;
    
    const share = total / count;
    
    const newResults = apartments.map(apt => ({
      apartmentId: apt.id,
      number: apt.number,
      share
    }));
    
    setResults(newResults);
  };

  const confirmAndSave = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      // We will send requests to create debts for each apartment
      const promises = results.map(r => 
        fetch('/api/debts', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({
            apartmentId: r.apartmentId,
            amount: r.share,
            source: 'EXPENSE_CALCULATOR',
            notes: notes
          })
        })
      );
      
      const responses = await Promise.all(promises);
      const allOk = responses.every(r => r.ok);
      
      if (allOk) {
        toast.success('تم تسجيل الديون للشقق بنجاح');
        setResults([]);
        setTotalExpense('');
      } else {
        toast.error('حدث خطأ في بعض العمليات');
      }
    } catch (e) {
      toast.error('فشل في تسجيل الديون');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Calculator className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">حاسبة المصاريف</h2>
          <p className="text-muted-foreground mt-1">
            توزيع المصاريف المشتركة على الشقق
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>حساب التوزيع</CardTitle>
          <CardDescription>أدخل إجمالي المصروف لتوزيعه على جميع الشقق المسجلة ({apartments.length} شقة)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>إجمالي المصروف</Label>
              <Input 
                type="number" 
                placeholder="مثال: 5000" 
                value={totalExpense}
                onChange={(e) => setTotalExpense(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>البيان / الوصف</Label>
              <Input 
                placeholder="توزيع مصروف مشترك" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={calculate} className="w-full" disabled={apartments.length === 0}>احسب التوزيع</Button>
        </CardContent>
      </Card>
      
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>نتيجة التوزيع</CardTitle>
            <CardDescription>نصيب كل شقة هو: <span className="font-bold text-primary">{results[0].share.toLocaleString()}</span></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
              {results.map(r => (
                <div key={r.apartmentId} className="p-4 border rounded-lg flex flex-col items-center justify-center bg-muted/20">
                  <span className="text-sm text-muted-foreground">شقة {r.number}</span>
                  <span className="text-xl font-bold mt-1">{r.share.toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={confirmAndSave} disabled={loading} className="gap-2">
                تأكيد وتحويل إلى استحقاق
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
