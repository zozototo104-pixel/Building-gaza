import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Droplets, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Wallet, 
  CheckCircle2, 
  RefreshCw, 
  Calendar, 
  Clock, 
  Gauge, 
  AlertTriangle,
  Info,
  Trash2,
  Filter,
  Zap,
  Activity
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const getArabicDayName = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[d.getDay()] || '';
};

const getCurrentTimeFormatted = () => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${period}`;
};

export default function Water() {
  const { getToken } = useAuth();
  const [apartments, setApartments] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [waterFills, setWaterFills] = useState<any[]>([]);
  const [generalPumpingList, setGeneralPumpingList] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPumpingDialogOpen, setIsPumpingDialogOpen] = useState(false);
  const [expandedApt, setExpandedApt] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('residents-summary');
  const [filterSearch, setFilterSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Water Fill Form
  const { register: regRead, handleSubmit: submitRead, reset: resetRead, control: controlRead, setValue } = useForm({
    defaultValues: {
      apartmentId: '',
      fillDate: todayStr,
      dayName: getArabicDayName(todayStr),
      fillTime: getCurrentTimeFormatted(),
      litersQuantity: '1000',
      previousReading: '0',
      newReading: '0',
      manualCycleStart: '',
      manualCycleEnd: '',
      amount: '10',
      isPaid: false,
      deductFromCredit: false,
      fillStatus: 'SUCCESS',
      stumbleReason: '',
      notes: ''
    }
  });
  
  const selectedAptId = useWatch({ control: controlRead, name: 'apartmentId' });
  const selectedDate = useWatch({ control: controlRead, name: 'fillDate' });
  const prevRead = useWatch({ control: controlRead, name: 'previousReading' }) || 0;
  const newRead = useWatch({ control: controlRead, name: 'newReading' }) || 0;
  
  const consumptionRead = Math.max(0, (parseFloat(newRead as string) || 0) - (parseFloat(prevRead as string) || 0));

  // General Pumping Form
  const { register: regPump, handleSubmit: submitPump, reset: resetPump, control: controlPump, setValue: setPumpValue } = useForm({
    defaultValues: {
      date: todayStr,
      dayName: getArabicDayName(todayStr),
      startTime: '08:00 ص',
      endTime: '10:00 ص',
      supervisor: '',
      initialReading: '0',
      finalReading: '0',
      electricityPrice: '0.50',
      notes: ''
    }
  });

  const pumpDate = useWatch({ control: controlPump, name: 'date' });
  const pumpInitRead = useWatch({ control: controlPump, name: 'initialReading' }) || 0;
  const pumpFinalRead = useWatch({ control: controlPump, name: 'finalReading' }) || 0;
  const pumpElecPrice = useWatch({ control: controlPump, name: 'electricityPrice' }) || '0.50';

  const pumpConsumption = Math.max(0, (parseFloat(pumpFinalRead as string) || 0) - (parseFloat(pumpInitRead as string) || 0));
  const pumpTotalCost = pumpConsumption * (parseFloat(pumpElecPrice as string) || 0.50);

  // Auto-update Arabic day name when date changes in water fill
  useEffect(() => {
    if (selectedDate) {
      const day = getArabicDayName(selectedDate);
      if (day) setValue('dayName', day);
    }
  }, [selectedDate, setValue]);

  // Auto-update Arabic day name when date changes in general pumping
  useEffect(() => {
    if (pumpDate) {
      const day = getArabicDayName(pumpDate);
      if (day) setPumpValue('dayName', day);
    }
  }, [pumpDate, setPumpValue]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const [resA, resR, resW, resD, resC, resP] = await Promise.all([
        fetch('/api/apartments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/residents', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/water', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/debts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/credits', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/general-pumping', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resA.ok) setApartments(await resA.json());
      if (resR.ok) setResidents(await resR.json());
      if (resW.ok) setWaterFills(await resW.json());
      if (resC.ok) setCredits(await resC.json());
      if (resP.ok) setGeneralPumpingList(await resP.json());
      if (resD.ok) {
        const allDebts = await resD.json();
        setDebts(allDebts.filter((d: any) => d.source === 'WATER'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  // When selected apartment changes in dialog, auto populate previous reading and default amount
  useEffect(() => {
    if (selectedAptId) {
      const apt = apartments.find(a => a.id === parseInt(selectedAptId));
      if (apt && apt.waterMeterReading) {
        setValue('previousReading', apt.waterMeterReading);
        setValue('newReading', apt.waterMeterReading);
      }
    }
  }, [selectedAptId, apartments, setValue]);

  // Find credit balance for selected apartment
  const selectedAptCredit = React.useMemo(() => {
    if (!selectedAptId) return 0;
    const aptIdNum = parseInt(selectedAptId);
    const aptCredits = credits.filter(c => c.apartmentId === aptIdNum);
    return aptCredits.reduce((sum, c) => sum + parseFloat(c.remainingAmount || c.amount || '0'), 0);
  }, [selectedAptId, credits]);

  const onOpenNewFill = () => {
    const today = new Date().toISOString().split('T')[0];
    resetRead({
      apartmentId: '',
      fillDate: today,
      dayName: getArabicDayName(today),
      fillTime: getCurrentTimeFormatted(),
      litersQuantity: '1000',
      previousReading: '0',
      newReading: '0',
      manualCycleStart: '',
      manualCycleEnd: '',
      amount: '10',
      isPaid: false,
      deductFromCredit: false,
      fillStatus: 'SUCCESS',
      stumbleReason: '',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const onOpenNewPumping = () => {
    const today = new Date().toISOString().split('T')[0];
    const lastPumping = generalPumpingList.length > 0 ? generalPumpingList[0] : null;
    const lastReading = lastPumping?.finalReading || '0';

    resetPump({
      date: today,
      dayName: getArabicDayName(today),
      startTime: getCurrentTimeFormatted(),
      endTime: '',
      supervisor: '',
      initialReading: lastReading,
      finalReading: lastReading,
      electricityPrice: '0.50',
      notes: ''
    });
    setIsPumpingDialogOpen(true);
  };

  const onReadSubmit = async (data: any) => {
    try {
      const token = await getToken();
      const aptIdNum = parseInt(data.apartmentId);
      const amountVal = parseFloat(data.amount) || 0;
      
      const res = await fetch('/api/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          apartmentId: aptIdNum,
          fillDate: data.fillDate || new Date().toISOString(),
          dayName: data.dayName,
          fillTime: data.fillTime,
          litersQuantity: parseFloat(data.litersQuantity) || 1000,
          previousReading: parseFloat(data.previousReading) || 0,
          newReading: parseFloat(data.newReading) || 0,
          manualCycleStart: data.manualCycleStart,
          manualCycleEnd: data.manualCycleEnd,
          consumption: consumptionRead,
          amount: amountVal,
          isPaid: !!data.isPaid,
          fillStatus: data.fillStatus || 'SUCCESS',
          stumbleReason: data.stumbleReason,
          notes: data.notes,
          deductFromCredit: !!data.deductFromCredit
        })
      });
      if (res.ok) {
        const fillData = await res.json();
        
        if (fillData.deductedAmount > 0) {
          toast.success(`تم تسجيل تعبئة المياه وخصم ₪${fillData.deductedAmount.toFixed(2)} من رصيد الساكن بنجاح`);
        } else if (data.isPaid) {
          toast.success(`تم تسجيل تعبئة المياه وإيداع ₪${amountVal.toFixed(2)} نقداً في صندوق البناية`);
        } else {
          toast.success('تم تسجيل تعبئة المياه كذمة معلقة على الشقة');
        }

        setIsDialogOpen(false);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const onPumpSubmit = async (data: any) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/general-pumping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          date: data.date,
          dayName: data.dayName,
          startTime: data.startTime,
          endTime: data.endTime,
          supervisor: data.supervisor,
          initialReading: parseFloat(data.initialReading) || 0,
          finalReading: parseFloat(data.finalReading) || 0,
          consumption: pumpConsumption,
          electricityPrice: parseFloat(data.electricityPrice) || 0.50,
          totalCost: pumpTotalCost,
          notes: data.notes
        })
      });

      if (res.ok) {
        toast.success(`تم تسجيل جلسة الضخ العام بتكلفة ₪${pumpTotalCost.toFixed(2)} بنجاح`);
        setIsPumpingDialogOpen(false);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleDeletePumping = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف جلسة الضخ العام هذه؟')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/general-pumping/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف جلسة الضخ العام بنجاح');
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleDeleteFill = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف سجل التعبئة هذا؟ سيتم إلغاء المطالبة المالية المرتبطة به.')) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/water/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف سجل التعبئة بنجاح');
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handlePay = async (debtId: number, amount: number, method: 'CASH' | 'CREDIT' = 'CASH', apartmentId?: number) => {
    if (amount <= 0) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          debtId, 
          amount, 
          method,
          apartmentId,
          notes: method === 'CREDIT' ? 'سداد مستحقات مياه من الرصيد الدائن' : 'سداد نقدي مباشر لمستحقات المياه'
        })
      });
      if (res.ok) {
        toast.success(method === 'CREDIT' ? `تم خصم ₪${amount.toFixed(2)} من الرصيد الدائن بنجاح` : `تم سداد ₪${amount.toFixed(2)} نقداً بنجاح`);
        fetchData();
      } else {
        const d = await res.json();
        toast.error(d.error || 'حدث خطأ أثناء السداد');
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleSettleAllApartmentWaterFromCredit = async (aptId: number, fills: any[], availableCredit: number) => {
    if (availableCredit <= 0) {
      toast.error('لا يوجد رصيد دائن كافٍ للساكن');
      return;
    }

    let remainingCreditToUse = availableCredit;
    let settledCount = 0;

    for (const fill of fills) {
      const remainingDebt = fill.remaining !== undefined ? fill.remaining : (parseFloat(fill.amount) || 0);
      const debtId = fill.debt?.id || fill.debtId;

      if (remainingDebt > 0 && remainingCreditToUse > 0 && debtId) {
        const payAmount = Math.min(remainingDebt, remainingCreditToUse);
        try {
          const token = await getToken();
          const res = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              debtId,
              amount: payAmount,
              method: 'CREDIT',
              apartmentId: aptId,
              notes: `تسوية تلقائية من الرصيد الدائن لفاتورة تعبئة مياه`
            })
          });

          if (res.ok) {
            remainingCreditToUse -= payAmount;
            settledCount++;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    if (settledCount > 0) {
      toast.success(`تمت تسوية ${settledCount} فاتورة مياه من الرصيد الدائن بنجاح`);
      fetchData();
    } else {
      toast.info('لا توجد فواتير مياه غير مسددة تتطلب التسوية');
    }
  };

  // Group fills and debts by apartment
  const summary = React.useMemo(() => {
    return apartments.map(apt => {
      const aptFills = waterFills.filter(w => w.apartmentId === apt.id);
      const aptDebts = debts.filter(d => d.apartmentId === apt.id);
      
      const aptCredits = credits.filter(c => c.apartmentId === apt.id);
      const creditBalance = aptCredits.reduce((sum, c) => sum + parseFloat(c.remainingAmount || c.amount || '0'), 0);

      // Enrich fills with matched debt or fill record details
      const enrichedFills = aptFills.map(fill => {
        const matchedDebt = (fill.debtId ? aptDebts.find(d => d.id === fill.debtId) : null) 
          || aptDebts.find(d => d.sourceId === fill.id);
        
        const originalAmount = parseFloat(fill.amount || (matchedDebt ? (matchedDebt.originalAmount || matchedDebt.amount) : '10.00')) || 10;
        const isPaid = fill.isPaid || matchedDebt?.status === 'PAID' || (matchedDebt && parseFloat(matchedDebt.remainingAmount) <= 0);
        
        const remainingAmount = isPaid ? 0 : (matchedDebt ? (parseFloat(matchedDebt.remainingAmount) || originalAmount) : originalAmount);
        const paidAmount = Math.max(0, originalAmount - remainingAmount);

        return {
          ...fill,
          debt: matchedDebt,
          original: originalAmount,
          remaining: remainingAmount,
          paid: paidAmount,
          isPaidCalculated: isPaid
        };
      });

      // Calculate totals from fills + any unlinked water debts
      const fillsTotalOwed = enrichedFills.reduce((sum, f) => sum + f.original, 0);
      const fillsTotalPaid = enrichedFills.reduce((sum, f) => sum + f.paid, 0);
      const fillsTotalRemaining = enrichedFills.reduce((sum, f) => sum + f.remaining, 0);

      const unlinkedDebts = aptDebts.filter(d => !aptFills.some(f => f.debtId === d.id || f.id === d.sourceId));
      const unlinkedTotalOwed = unlinkedDebts.reduce((sum, d) => sum + (parseFloat(d.originalAmount || d.amount) || 0), 0);
      const unlinkedTotalRemaining = unlinkedDebts.reduce((sum, d) => sum + (parseFloat(d.remainingAmount) || 0), 0);
      const unlinkedTotalPaid = Math.max(0, unlinkedTotalOwed - unlinkedTotalRemaining);

      const totalDebt = fillsTotalOwed + unlinkedTotalOwed;
      const totalPaid = fillsTotalPaid + unlinkedTotalPaid;
      const totalRemaining = fillsTotalRemaining + unlinkedTotalRemaining;

      const resident = apt.residents?.[0]?.name || residents.find(r => r.apartmentId === apt.id)?.name || 'بدون ساكن مسجل';

      return {
        apartmentId: apt.id,
        number: apt.number,
        floor: apt.floor,
        resident,
        creditBalance,
        totalDebt,
        totalPaid,
        totalRemaining,
        fills: enrichedFills,
        debts: aptDebts
      };
    }).filter(item => {
      if (!filterSearch) return true;
      const s = filterSearch.toLowerCase();
      return (
        item.number.toLowerCase().includes(s) ||
        item.resident.toLowerCase().includes(s)
      );
    });
  }, [apartments, waterFills, debts, residents, credits, filterSearch]);

  // KPIs
  const totalWaterFillsCount = waterFills.length;
  const totalWaterDebt = summary.reduce((sum, s) => sum + (s.totalDebt || 0), 0);
  const totalWaterPaid = summary.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
  const totalWaterRemaining = summary.reduce((sum, s) => sum + (s.totalRemaining || 0), 0);

  // General Pumping KPIs
  const totalPumpingCount = generalPumpingList.length;
  const totalPumpingConsumption = generalPumpingList.reduce((sum, p) => sum + (parseFloat(p.consumption) || 0), 0);
  const totalPumpingCost = generalPumpingList.reduce((sum, p) => sum + (parseFloat(p.totalCost) || 0), 0);

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Droplets className="h-7 w-7 text-blue-600" />
            إدارة تعبئة المياه والضخ العام
          </h1>
          <p className="text-muted-foreground mt-1">
            تسجيل قراءات العدادات وتعبئة خزانات الشقق، ومتابعة جلسات الضخ العام والتكاليف التشغيلية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 font-semibold">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>

          <Button onClick={onOpenNewPumping} variant="outline" className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold shadow-xs">
            <Zap className="h-4 w-4 text-indigo-600" />
            تسجيل ضخ عام
          </Button>

          <Button onClick={onOpenNewFill} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">
            <Plus className="h-4 w-4" />
            تسجيل تعبئة مياه شقة
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">إجمالي تعبئات الشقق</p>
              <p className="text-2xl font-bold font-mono mt-1">{totalWaterFillsCount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">₪{totalWaterDebt.toFixed(2)} إجمالي القيمة</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Droplets className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">المبالغ المسددة للشقق</p>
              <p className="text-2xl font-bold font-mono mt-1 text-green-700">₪{totalWaterPaid.toFixed(2)}</p>
              <p className="text-[11px] text-green-600 mt-0.5">مسدد نقداً أو من الرصيد</p>
            </div>
            <div className="p-3 bg-green-50 text-green-700 rounded-xl">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">المستحق غير المسدد</p>
              <p className="text-2xl font-bold font-mono mt-1 text-destructive">₪{totalWaterRemaining.toFixed(2)}</p>
              <p className="text-[11px] text-destructive/80 mt-0.5">ذمم معلقة على الشقق</p>
            </div>
            <div className="p-3 bg-red-50 text-destructive rounded-xl">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">جلسات الضخ العام</p>
              <p className="text-2xl font-bold font-mono mt-1 text-indigo-700">{totalPumpingCount}</p>
              <p className="text-[11px] text-indigo-600 mt-0.5">تكلفة: ₪{totalPumpingCost.toFixed(2)} ({totalPumpingConsumption.toFixed(2)} ك.و)</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="w-full sm:w-auto overflow-x-auto pb-1 scrollbar-none">
            <TabsList className="flex min-w-[480px] sm:min-w-0 sm:grid sm:grid-cols-3 w-full sm:w-[540px]">
              <TabsTrigger value="residents-summary" className="gap-1.5 font-bold text-xs">
                <Droplets className="h-3.5 w-3.5" />
                ملخص الشقق والاستهلاك
              </TabsTrigger>
              <TabsTrigger value="all-fills-log" className="gap-1.5 font-bold text-xs">
                <Calendar className="h-3.5 w-3.5" />
                سجل التعبئات المفصل
              </TabsTrigger>
              <TabsTrigger value="general-pumping" className="gap-1.5 font-bold text-xs">
                <Zap className="h-3.5 w-3.5 text-indigo-600" />
                الضخ العام وبراميل البناية
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الشقة أو الساكن أو المشرف..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="pr-9 h-9 text-xs"
            />
          </div>
        </div>
        
        {/* Tab 1: Summary By Apartment */}
        <TabsContent value="residents-summary" className="mt-4 space-y-4">
          <Card className="shadow-xs border">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-base">استهلاك وتعبئات المياه للشقق</CardTitle>
              <CardDescription className="text-xs">
                انقر على زر السهم بجانب أي شقة لعرض كافة فواتير التعبئة والقراءات وخيارات السداد والخصم من الرصيد الدائن.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-right font-bold">الشقة</TableHead>
                    <TableHead className="text-right font-bold">الساكن المسجل</TableHead>
                    <TableHead className="text-right font-bold">الرصيد الدائن</TableHead>
                    <TableHead className="text-right font-bold">عدد التعبئات</TableHead>
                    <TableHead className="text-right font-bold">إجمالي المستحق</TableHead>
                    <TableHead className="text-right font-bold">المدفوع</TableHead>
                    <TableHead className="text-right font-bold">المتبقي</TableHead>
                    <TableHead className="text-center font-bold w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        لا توجد بيانات تعبئة مياه تطابق البحث
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.map(s => {
                      const remainingTotal = Math.max(0, s.totalDebt - s.totalPaid);
                      return (
                        <React.Fragment key={s.apartmentId}>
                          <TableRow className={expandedApt === s.apartmentId ? "bg-muted/50" : "hover:bg-muted/20"}>
                            <TableCell className="font-bold text-primary">شقة {s.number} {s.floor ? `(${s.floor})` : ''}</TableCell>
                            <TableCell className="font-semibold">{s.resident}</TableCell>
                            <TableCell>
                              {s.creditBalance > 0 ? (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-xs font-bold">
                                  ₪{s.creditBalance.toFixed(2)}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground font-mono">0.00 ₪</span>
                              )}
                            </TableCell>
                            <TableCell className="font-semibold">{s.fills.length}</TableCell>
                            <TableCell className="font-mono font-bold">₪{s.totalDebt.toFixed(2)}</TableCell>
                            <TableCell className="font-mono text-green-700 font-bold">₪{s.totalPaid.toFixed(2)}</TableCell>
                            <TableCell className={`font-bold font-mono ${remainingTotal > 0 ? 'text-destructive' : 'text-green-700'}`}>
                              ₪{remainingTotal.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setExpandedApt(expandedApt === s.apartmentId ? null : s.apartmentId)}
                                title="عرض التفاصيل"
                              >
                                {expandedApt === s.apartmentId ? <ChevronUp className="w-4 h-4 text-primary"/> : <ChevronDown className="w-4 h-4"/>}
                              </Button>
                            </TableCell>
                          </TableRow>
                          {expandedApt === s.apartmentId && (
                            <TableRow>
                              <TableCell colSpan={8} className="p-0 bg-muted/20">
                                <div className="p-4 space-y-3">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <h4 className="font-bold text-sm flex items-center gap-1.5 text-foreground">
                                      <Droplets className="h-4 w-4 text-blue-500" />
                                      تفاصيل فواتير وتعبئات مياه شقة {s.number} ({s.resident})
                                    </h4>
                                    {remainingTotal > 0 && s.creditBalance > 0 && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleSettleAllApartmentWaterFromCredit(s.apartmentId, s.fills, s.creditBalance)}
                                        className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5"
                                      >
                                        <Wallet className="h-3.5 w-3.5" />
                                        تسوية المستحق من الرصيد الدائن (₪{Math.min(remainingTotal, s.creditBalance).toFixed(2)})
                                      </Button>
                                    )}
                                  </div>
                                  <Table className="bg-background rounded-lg border">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-right">التاريخ واليوم</TableHead>
                                        <TableHead className="text-right">البيان / ملاحظات</TableHead>
                                        <TableHead className="text-right">الكمية</TableHead>
                                        <TableHead className="text-right">قراءة العداد (س/ح)</TableHead>
                                        <TableHead className="text-right">الاستهلاك</TableHead>
                                        <TableHead className="text-right">المبلغ (₪)</TableHead>
                                        <TableHead className="text-right">المدفوع (₪)</TableHead>
                                        <TableHead className="text-right">المتبقي (₪)</TableHead>
                                        <TableHead className="text-right">الحالة</TableHead>
                                        <TableHead className="text-center">إجراءات السداد</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {s.fills.map((f: any) => {
                                        const d = f.debt;
                                        const original = f.original !== undefined ? f.original : (parseFloat(f.amount) || 0);
                                        const remaining = f.remaining !== undefined ? f.remaining : (parseFloat(f.amount) || 0);
                                        const paid = f.paid !== undefined ? f.paid : (original - remaining);
                                        const isPaid = f.isPaidCalculated !== undefined ? f.isPaidCalculated : (remaining <= 0 || (d && d.status === 'PAID') || f.isPaid);
                                        const hasCredit = s.creditBalance > 0;
                                        const debtIdToUse = d ? d.id : f.debtId;

                                        return (
                                          <TableRow key={f.id}>
                                            <TableCell className="text-xs">
                                              <div className="font-semibold">{new Date(f.fillDate || f.date).toLocaleDateString('ar-EG')}</div>
                                              <div className="text-[11px] text-muted-foreground">{f.dayName || ''} {f.fillTime || ''}</div>
                                            </TableCell>
                                            <TableCell className="text-xs">
                                              <div>{f.notes || '-'}</div>
                                              {f.stumbleReason && (
                                                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">سبب التعثر: {f.stumbleReason}</div>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">{f.litersQuantity ? `${f.litersQuantity} لتر` : '1000 لتر'}</TableCell>
                                            <TableCell className="font-mono text-xs">{f.previousReading} ➔ {f.newReading}</TableCell>
                                            <TableCell className="font-mono text-xs font-semibold">{f.consumption} وحدة</TableCell>
                                            <TableCell className="font-mono font-bold">₪{original.toFixed(2)}</TableCell>
                                            <TableCell className="font-mono text-green-700 font-semibold">₪{paid.toFixed(2)}</TableCell>
                                            <TableCell className={`font-bold font-mono ${remaining > 0 ? 'text-destructive' : 'text-green-700'}`}>
                                              ₪{remaining.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant={isPaid ? 'default' : paid > 0 ? 'secondary' : 'destructive'} className="text-xs">
                                                {isPaid ? 'مسدد' : paid > 0 ? 'سداد جزئي' : 'غير مسدد'}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                              <div className="flex items-center justify-center gap-1.5">
                                                {!isPaid && debtIdToUse ? (
                                                  <>
                                                    {hasCredit && (
                                                      <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => handlePay(debtIdToUse, Math.min(remaining, s.creditBalance), 'CREDIT', s.apartmentId)}
                                                        className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1 font-semibold"
                                                        title="خصم من الرصيد الدائن المتاح"
                                                      >
                                                        <Wallet className="h-3 w-3" />
                                                        خصم من الرصيد
                                                      </Button>
                                                    )}

                                                    <Button 
                                                      size="sm" 
                                                      onClick={() => handlePay(debtIdToUse, remaining, 'CASH', s.apartmentId)}
                                                      className="h-7 text-xs bg-green-600 hover:bg-green-700 font-semibold text-white"
                                                    >
                                                      سداد نقدي
                                                    </Button>
                                                  </>
                                                ) : isPaid ? (
                                                  <span className="text-xs text-green-700 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    مسدد
                                                  </span>
                                                ) : null}

                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  onClick={() => handleDeleteFill(f.id)}
                                                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-red-50"
                                                  title="حذف هذا السجل"
                                                >
                                                  <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Detailed All Fills Log */}
        <TabsContent value="all-fills-log" className="mt-4 space-y-4">
          <Card className="shadow-xs border">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-base">سجل كافة عمليات تعبئة المياه</CardTitle>
              <CardDescription className="text-xs">جدول زمني شامل بجميع عمليات التعبئة المسجلة على النظام مع تفاصيل القراءات والمبالغ.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-right">التاريخ واليوم</TableHead>
                    <TableHead className="text-right">الشقة والساكن</TableHead>
                    <TableHead className="text-right">الكمية (لتر)</TableHead>
                    <TableHead className="text-right">قراءة العداد (س/ح)</TableHead>
                    <TableHead className="text-right">الاستهلاك المحسوب</TableHead>
                    <TableHead className="text-right">الدورة (يدوي)</TableHead>
                    <TableHead className="text-right">المبلغ اليدوي</TableHead>
                    <TableHead className="text-right">حالة التعبئة</TableHead>
                    <TableHead className="text-right">حالة الدفع</TableHead>
                    <TableHead className="text-center w-[80px]">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waterFills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                        لا توجد عمليات تعبئة مياه مسجلة حتى الآن
                      </TableCell>
                    </TableRow>
                  ) : (
                    waterFills.map((fill) => {
                      const apt = apartments.find(a => a.id === fill.apartmentId);
                      const res = apt?.residents?.[0]?.name || residents.find(r => r.apartmentId === fill.apartmentId)?.name || 'غير محدد';
                      const isPaid = fill.isPaid || (fill.debt && fill.debt.status === 'PAID');
                      
                      return (
                        <TableRow key={fill.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs">
                            <div className="font-bold">{new Date(fill.fillDate || fill.date).toLocaleDateString('ar-EG')}</div>
                            <div className="text-[11px] text-muted-foreground">{fill.dayName || ''} {fill.fillTime || ''}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-primary text-xs">شقة {apt?.number || fill.apartmentId}</div>
                            <div className="text-xs text-muted-foreground">{res}</div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{fill.litersQuantity || 1000} لتر</TableCell>
                          <TableCell className="font-mono text-xs">{fill.previousReading} ➔ {fill.newReading}</TableCell>
                          <TableCell className="font-mono text-xs font-semibold">{fill.consumption} وحدة</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {fill.manualCycleStart || fill.manualCycleEnd 
                              ? `${fill.manualCycleStart || '-'} ➔ ${fill.manualCycleEnd || '-'}` 
                              : '-'}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-xs">₪{parseFloat(fill.amount || '0').toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`text-[11px] ${
                                fill.fillStatus === 'STUMBLED' 
                                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                  : fill.fillStatus === 'CANCELLED' 
                                  ? 'bg-red-50 text-red-800 border-red-300' 
                                  : 'bg-blue-50 text-blue-800 border-blue-300'
                              }`}
                            >
                              {fill.fillStatus === 'STUMBLED' ? 'متعثرة' : fill.fillStatus === 'CANCELLED' ? 'ملغاة' : fill.fillStatus === 'PENDING' ? 'قيد الانتظار' : 'ناجحة'}
                            </Badge>
                            {fill.stumbleReason && (
                              <div className="text-[10px] text-amber-700 mt-0.5 max-w-[120px] truncate" title={fill.stumbleReason}>
                                {fill.stumbleReason}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isPaid ? 'default' : 'destructive'} className="text-[11px]">
                              {isPaid ? 'تم الدفع' : 'معلق / لم يدفع'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteFill(fill.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                              title="حذف السجل"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: General Pumping (الضخ العام وبراميل البناية) */}
        <TabsContent value="general-pumping" className="mt-4 space-y-4">
          <Card className="shadow-xs border">
            <CardHeader className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-600" />
                  سجل الضخ العام وبراميل البناية
                </CardTitle>
                <CardDescription className="text-xs">
                  متابعة جلسات ضخ المياه العامة، قراءات عداد الكهرباء للمضخة، حساب الاستهلاك والتكاليف المحسومة على الصندوق.
                </CardDescription>
              </div>
              <Button onClick={onOpenNewPumping} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1.5">
                <Plus className="h-4 w-4" />
                تسجيل جلسة ضخ عام
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-right font-bold">التاريخ واليوم</TableHead>
                    <TableHead className="text-right font-bold">الوقت / الفترة</TableHead>
                    <TableHead className="text-right font-bold">المشرف المسؤول</TableHead>
                    <TableHead className="text-right font-bold">قراءة العداد (البداية ➔ النهاية)</TableHead>
                    <TableHead className="text-right font-bold">الاستهلاك (ك.و)</TableHead>
                    <TableHead className="text-right font-bold">سعر الكيلوواط</TableHead>
                    <TableHead className="text-right font-bold">التكلفة الإجمالية</TableHead>
                    <TableHead className="text-right font-bold">ملاحظات</TableHead>
                    <TableHead className="text-center font-bold w-[70px]">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generalPumpingList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                        لا توجد جلسات ضخ عام مسجلة حتى الآن. انقر على "تسجيل جلسة ضخ عام" للبدء.
                      </TableCell>
                    </TableRow>
                  ) : (
                    generalPumpingList.map((p) => {
                      return (
                        <TableRow key={p.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs">
                            <div className="font-bold">{new Date(p.date).toLocaleDateString('ar-EG')}</div>
                            <div className="text-[11px] text-muted-foreground">{p.dayName || getArabicDayName(p.date)}</div>
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {p.startTime || p.endTime ? (
                              <span>{p.startTime || ''} {p.endTime ? `➔ ${p.endTime}` : ''}</span>
                            ) : (
                              <span>{p.time || '-'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-primary">
                            {p.supervisor || 'غير محدد'}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {p.initialReading} ➔ {p.finalReading}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-indigo-700">
                            {p.consumption} ك.و
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            ₪{parseFloat(p.electricityPrice || '0.50').toFixed(2)}
                          </TableCell>
                          <TableCell className="font-mono font-black text-xs text-foreground">
                            ₪{parseFloat(p.totalCost || '0').toFixed(2)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={p.notes || ''}>
                            {p.notes || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeletePumping(p.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50"
                              title="حذف الجلسة"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG 1: Water Fill Modal Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-600" />
              تسجيل تعبئة مياه لشقة
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={submitRead(onReadSubmit)} className="space-y-4 pt-2">
            {/* 1. الشقة */}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">الشقة *</label>
              <select 
                {...regRead('apartmentId')} 
                required 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="">اختر الشقة...</option>
                {apartments.map(a => {
                  const res = a.residents?.[0]?.name || residents.find(r => r.apartmentId === a.id)?.name;
                  return (
                    <option key={a.id} value={a.id}>
                      شقة {a.number} {a.floor ? `(طابق ${a.floor})` : ''} {res ? `- الساكن: ${res}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. التاريخ + 3. اليوم */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">التاريخ *</label>
                <Input 
                  type="date" 
                  {...regRead('fillDate')} 
                  required 
                  className="text-sm font-sans" 
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">اليوم</label>
                <Input 
                  type="text" 
                  {...regRead('dayName')} 
                  placeholder="السبت، الأحد..." 
                  className="text-sm bg-muted/40 font-semibold" 
                />
              </div>
            </div>

            {/* 4. الوقت + 5. كمية التعبئة باللتر */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">الوقت</label>
                <Input 
                  type="text" 
                  placeholder="مثال: 9:30 ص" 
                  {...regRead('fillTime')} 
                  className="text-sm" 
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">كمية التعبئة باللتر</label>
                <Input 
                  type="number" 
                  placeholder="1000" 
                  {...regRead('litersQuantity')} 
                  className="font-mono text-sm" 
                />
              </div>
            </div>

            {/* 6. قراءة العداد الأولى (س) + 7. قراءة العداد الثانية (ح) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">قراءة العداد الأولى (س)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0" 
                  {...regRead('previousReading')} 
                  className="font-mono text-sm" 
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">قراءة العداد الثانية (ح)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0" 
                  {...regRead('newReading')} 
                  className="font-mono text-sm" 
                />
              </div>
            </div>

            {/* 8. بداية الدورة (يدوي) + 9. نهاية الدورة (يدوي) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">بداية الدورة (يدوي)</label>
                <Input 
                  type="text" 
                  placeholder="اختياري" 
                  {...regRead('manualCycleStart')} 
                  className="text-sm" 
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">نهاية الدورة (يدوي)</label>
                <Input 
                  type="text" 
                  placeholder="اختياري" 
                  {...regRead('manualCycleEnd')} 
                  className="text-sm" 
                />
              </div>
            </div>

            {/* Hint note for manual cycle readings */}
            <p className="text-[11px] text-muted-foreground text-center">
              قراءات الدورة تحفظ كما تدخلها يدويًا ولا تُقارن ببعضها أو بقراءات العداد.
            </p>

            {/* 10. صندوق الاستهلاك المحسوب */}
            <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50/70 dark:bg-cyan-950/20 p-3.5 text-center space-y-1">
              <div className="text-cyan-900 dark:text-cyan-200 font-bold text-sm">
                الاستهلاك المحسوب: <span className="font-extrabold font-mono text-base">{consumptionRead}</span> وحدة
              </div>
              <div className="text-[11px] text-cyan-800/80 dark:text-cyan-300/80">
                القراءة الثانية – القراءة الأولى. لا يؤثر هذا الحساب على المبلغ اليدوي.
              </div>
            </div>

            {/* 11. المبلغ اليدوي */}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">المبلغ اليدوي (₪) *</label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="10" 
                {...regRead('amount')} 
                required 
                className="font-mono font-bold text-base h-10" 
              />
            </div>

            {/* 12. خيار الدفع إلى الصندوق وملاحظة الساكن */}
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-3.5 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-rose-950 dark:text-rose-200">
                <input 
                  type="checkbox" 
                  id="isPaid" 
                  {...regRead('isPaid')} 
                  className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500" 
                />
                <span>تم الدفع — أضف المبلغ إلى الصندوق</span>
              </label>
              <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                لم يدفع الساكن بعد؛ لن يضاف مبلغ التعبئة إلى رصيد البناية حتى تعليم هذا الخيار.
              </p>
            </div>

            {/* Option to deduct from Resident's credit balance if available */}
            {selectedAptCredit > 0 && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-emerald-950 dark:text-emerald-200">
                  <input 
                    type="checkbox" 
                    id="deductFromCredit" 
                    {...regRead('deductFromCredit')} 
                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500" 
                  />
                  <span>خصم المبلغ من الرصيد الدائن للساكن (المتاح: ₪{selectedAptCredit.toFixed(2)})</span>
                </label>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  سيتم تسوية الفاتورة فوراً من الرصيد الدائن المودع مسبقاً لدى الساكن.
                </p>
              </div>
            )}

            {/* 13. حالة التعبئة */}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">حالة التعبئة</label>
              <select 
                {...regRead('fillStatus')} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="SUCCESS">ناجحة</option>
                <option value="STUMBLED">متعثرة</option>
                <option value="PENDING">قيد الانتظار</option>
                <option value="CANCELLED">ملغاة</option>
              </select>
            </div>

            {/* 14. سبب التعثر (اختياري) */}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">سبب التعثر (اختياري)</label>
              <Input 
                type="text" 
                placeholder="" 
                {...regRead('stumbleReason')} 
                className="text-sm" 
              />
            </div>

            {/* 15. ملاحظات */}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">ملاحظات</label>
              <textarea 
                rows={3} 
                placeholder="" 
                {...regRead('notes')} 
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary" 
              />
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="font-semibold">
                إلغاء
              </Button>
              <Button type="submit" className="font-bold bg-blue-600 hover:bg-blue-700 text-white">
                حفظ بيانات التعبئة
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG 2: General Pumping (الضخ العام) Modal Form */}
      <Dialog open={isPumpingDialogOpen} onOpenChange={setIsPumpingDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <Zap className="h-5 w-5 text-indigo-600" />
              تسجيل جلسة ضخ عام (براميل البناية)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={submitPump(onPumpSubmit)} className="space-y-4 pt-2">
            {/* 1. التاريخ + 2. اليوم */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">التاريخ *</label>
                <Input 
                  type="date" 
                  {...regPump('date')} 
                  required 
                  className="text-sm font-sans" 
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">اليوم</label>
                <Input 
                  type="text" 
                  {...regPump('dayName')} 
                  placeholder="السبت، الأحد..." 
                  className="text-sm bg-muted/40 font-semibold" 
                />
              </div>
            </div>

            {/* 3. وقت البداية + 4. وقت النهاية */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">وقت بدء الضخ</label>
                <Input 
                  type="text" 
                  placeholder="08:00 ص" 
                  {...regPump('startTime')} 
                  className="text-sm" 
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">وقت انتهاء الضخ</label>
                <Input 
                  type="text" 
                  placeholder="10:30 ص" 
                  {...regPump('endTime')} 
                  className="text-sm" 
                />
              </div>
            </div>

            {/* 5. المشرف المسؤول */}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">المشرف المسؤول عن الضخ</label>
              <Input 
                type="text" 
                placeholder="اسم المشرف أو الحارس" 
                {...regPump('supervisor')} 
                className="text-sm" 
              />
            </div>

            {/* 6. قراءة عداد الكهرباء (البداية ➔ النهاية) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">قراءة البداية (ك.و) *</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0" 
                  {...regPump('initialReading')} 
                  required
                  className="font-mono text-sm" 
                />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-bold text-foreground">قراءة النهاية (ك.و) *</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0" 
                  {...regPump('finalReading')} 
                  required
                  className="font-mono text-sm" 
                />
              </div>
            </div>

            {/* 7. سعر الكيلوواط */}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">سعر الكيلوواط (₪) *</label>
              <Input 
                type="number" 
                step="0.01" 
                placeholder="0.50" 
                {...regPump('electricityPrice')} 
                required
                className="font-mono text-sm" 
              />
            </div>

            {/* 8. صندوق ملخص الاستهلاك والتكلفة المحسوبة */}
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/20 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200">
                <span>الاستهلاك الكهربائي للمضخة:</span>
                <span className="font-extrabold font-mono text-base text-indigo-600 dark:text-indigo-400">{pumpConsumption.toFixed(2)} ك.و</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-indigo-950 dark:text-indigo-200 border-t border-indigo-200/60 pt-2">
                <span>التكلفة الإجمالية المحسوبة:</span>
                <span className="font-black font-mono text-lg text-indigo-700 dark:text-indigo-300">₪{pumpTotalCost.toFixed(2)}</span>
              </div>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 pt-1">
                سيتم إدراج التكلفة كمصروف تشغيلي في الصندوق وسجل المصروفات تلقائياً.
              </p>
            </div>

            {/* 9. ملاحظات */}
            <div className="grid gap-1.5">
              <label className="text-xs font-bold text-foreground">ملاحظات</label>
              <textarea 
                rows={3} 
                placeholder="أي تفاصيل عن ضغط المياه أو حالة المضخة والخزانات..." 
                {...regPump('notes')} 
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary" 
              />
            </div>

            <DialogFooter className="gap-2 pt-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsPumpingDialogOpen(false)} className="font-semibold">
                إلغاء
              </Button>
              <Button type="submit" className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white">
                حفظ جلسة الضخ العام
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
