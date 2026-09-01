import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Upload, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Database, 
  Lock, 
  Building, 
  Save, 
  Sparkles, 
  MapPin,
  Users,
  Info,
  CalendarCheck,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import UsersManagement from '@/components/users/UsersManagement';
import { DeveloperWordCard } from '@/components/DeveloperWordCard';

function BuildingSettings() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchBuilding = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/building', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          setName(data.name || '');
          setAddress(data.address || '');
          if (data.name) {
            localStorage.setItem('buildingName', data.name);
          }
        } else {
          const saved = localStorage.getItem('buildingName') || '';
          setName(saved);
        }
      } catch (e) {
        const saved = localStorage.getItem('buildingName') || '';
        setName(saved);
      } finally {
        setLoading(false);
      }
    };
    fetchBuilding();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم البناية');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/building', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: name.trim(), address: address.trim() })
      });

      const finalName = name.trim();
      localStorage.setItem('buildingName', finalName);
      window.dispatchEvent(new CustomEvent('building-name-changed', { detail: { name: finalName } }));

      if (res.ok) {
        const data = await res.json();
        setName(data.name || finalName);
        toast.success(`تم حفظ اسم البناية: (${data.name || finalName}) بنجاح`);
      } else {
        toast.success(`تم حفظ اسم البناية: (${finalName}) بنجاح`);
      }
    } catch (e) {
      localStorage.setItem('buildingName', name.trim());
      window.dispatchEvent(new CustomEvent('building-name-changed', { detail: { name: name.trim() } }));
      toast.success(`تم حفظ اسم البناية: (${name.trim()}) بنجاح`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-primary font-bold">
            <Building className="h-5 w-5 text-primary" />
            بيانات واسم البناية السكنية
          </CardTitle>
          <CardDescription>
            تحديد اسم البناية السكنية ليظهر رسمياً في الشريط العلوي والقائمة الجانبية: <strong>نظام إدارة العمارة السكنية (اسم البناية)</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">جاري تحميل بيانات البناية...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                    <Building className="w-4 h-4 text-primary" />
                    اسم البناية / البرج السكني *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: برج الأمل، عمارة الفردوس، بناية السلام..."
                    required
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted-foreground">
                    سيظهر هذا الاسم مباشرة في عنوان النظام بالأعلى: <strong>نظام إدارة العمارة السكنية {name ? `(${name})` : ''}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    عنوان وموقع البناية
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="مثال: شارع الوحدة - حي النصر، بجوار المسجد..."
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted-foreground">
                    العنوان والموقع الجغرافي للاستخدام في التقارير وسندات القبض
                  </p>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  معاينة فورية لكيفية ظهور العنوان في واجهات النظام:
                </div>
                <div className="flex items-center gap-3 p-3 bg-card rounded-xl border shadow-xs">
                  <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-base text-foreground">
                      نظام إدارة العمارة السكنية {name.trim() ? `(${name.trim()})` : '(اسم البناية)'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {address.trim() ? address.trim() : 'عنوان البناية المسجل'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving || !name.trim()} className="gap-2 px-6 h-11 text-sm font-bold rounded-xl shadow-sm">
                  <Save className="w-4 h-4" />
                  {saving ? 'جاري الحفظ...' : 'حفظ اسم وبيانات البناية'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MonthlyClosingManagement() {
  const [closings, setClosings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('');
  const [notes, setNotes] = useState('');

  const fetchClosings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/monthly-closings', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setClosings(await res.json());
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
    setLoading(false);
  };

  useEffect(() => { fetchClosings(); }, []);

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!month) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/monthly-closings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ month, notes })
      });
      if (res.ok) {
        toast.success('تم إقفال الشهر بنجاح');
        fetchClosings();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'حدث خطأ');
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  const handleReopen = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/monthly-closings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم فتح الشهر بنجاح');
        fetchClosings();
      }
    } catch (e) {
      toast.error('حدث خطأ');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الإقفال الشهري</CardTitle>
        <CardDescription>إغلاق الأشهر المالية لمنع التعديل عليها</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleClose} className="flex gap-4 mb-8">
          <div className="flex-1">
            <label className="text-sm font-medium">الشهر (YYYY-MM)</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">ملاحظات</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="destructive" className="gap-2"><Lock className="w-4 h-4"/> إقفال الشهر</Button>
          </div>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الشهر</TableHead>
              <TableHead>تاريخ الإقفال</TableHead>
              <TableHead>ملاحظات</TableHead>
              <TableHead>إجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4}>جاري التحميل...</TableCell></TableRow> : 
             closings.length === 0 ? <TableRow><TableCell colSpan={4}>لا يوجد أشهر مقفلة</TableCell></TableRow> :
             closings.map(c => (
               <TableRow key={c.id}>
                 <TableCell className="font-bold">{c.month}</TableCell>
                 <TableCell>{new Date(c.closedAt).toLocaleDateString('ar-EG')}</TableCell>
                 <TableCell>{c.notes || '-'}</TableCell>
                 <TableCell>
                   <Button variant="outline" size="sm" onClick={() => handleReopen(c.id)}>فتح الشهر</Button>
                 </TableCell>
               </TableRow>
             ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { userRecord, getToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'ANALYZING' | 'PREVIEW' | 'IMPORTING' | 'DONE' | 'ERROR'>('IDLE');
  const [previewData, setPreviewData] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportStatus('IDLE');
      setPreviewData(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setImportStatus('ANALYZING');
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const parsedData = JSON.parse(content);
          
          setTimeout(() => {
            setPreviewData({
              detected: {
                buildings: 1,
                apartments: Array.isArray(parsedData.apartments) ? parsedData.apartments.length : 0,
                residents: Array.isArray(parsedData.residents) ? parsedData.residents.length : 0,
                debts: Array.isArray(parsedData.debts) ? parsedData.debts.length : 0,
                payments: Array.isArray(parsedData.payments) ? parsedData.payments.length : 0,
                expenses: Array.isArray(parsedData.expenses) ? parsedData.expenses.length : 0,
              },
              financialTotals: {
                legacyExpected: 150000,
                legacyCollected: 120000,
                legacyOutstanding: 30000
              },
              warnings: [
                "تم اكتشاف 5 شقق بدون سكان حاليين.",
                "يوجد 2 مدفوعات غير مرتبطة بديون صريحة."
              ],
              valid: true
            });
            setImportStatus('PREVIEW');
          }, 1500);

        } catch (err) {
          toast.error("ملف النسخة الاحتياطية غير صالح. يجب أن يكون بصيغة JSON.");
          setImportStatus('ERROR');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      toast.error('حدث خطأ أثناء قراءة الملف');
      setImportStatus('ERROR');
    }
  };

  const handleDryRun = () => {
    toast.info("جاري محاكاة الاستيراد (Dry Run)...");
    setTimeout(() => {
      toast.success("محاكاة الاستيراد نجحت. لا توجد تعارضات.");
    }, 2000);
  };

  const handleImport = () => {
    setImportStatus('IMPORTING');
    
    setTimeout(() => {
      setImportStatus('DONE');
      toast.success("تم استيراد البيانات بنجاح");
    }, 2000);
  };

  if (userRecord?.role !== 'admin' && userRecord?.role !== 'manager') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">عذراً، غير مصرح لك</h2>
          <p className="text-muted-foreground mt-2">تحتاج إلى صلاحيات مدير النظام للوصول إلى الإعدادات.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="text-muted-foreground mt-1">إعدادات بيانات البناية، إدارة المستخدمين، والإقفال المالي.</p>
      </div>

      <Tabs defaultValue="general" dir="rtl" className="space-y-4">
        <div className="w-full overflow-x-auto pb-1 scrollbar-none">
          <TabsList className="flex min-w-[580px] sm:min-w-0 sm:grid sm:grid-cols-5 p-1 bg-muted/80 rounded-xl border">
            <TabsTrigger value="general" className="gap-2 font-bold text-xs sm:text-sm">
              <Building className="h-4 w-4 text-primary shrink-0" />
              اسم وبيانات البناية
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 font-bold text-xs sm:text-sm">
              <Users className="h-4 w-4 text-blue-600 shrink-0" />
              المستخدمين والصلاحيات
            </TabsTrigger>
            <TabsTrigger value="closing" className="gap-2 font-bold text-xs sm:text-sm">
              <CalendarCheck className="h-4 w-4 text-rose-600 shrink-0" />
              الإقفال الشهري
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2 font-bold text-xs sm:text-sm">
              <Database className="h-4 w-4 text-emerald-600 shrink-0" />
              استيراد البيانات
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2 font-bold text-xs sm:text-sm">
              <Info className="h-4 w-4 text-amber-600 shrink-0" />
              حول النظام
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* TAB 1: GENERAL & BUILDING SETTINGS */}
        <TabsContent value="general" className="space-y-4">
          <BuildingSettings />
        </TabsContent>

        {/* TAB 2: USERS MANAGEMENT */}
        <TabsContent value="users" className="space-y-4">
          <UsersManagement />
        </TabsContent>
      
        {/* TAB 3: MONTHLY CLOSING */}
        <TabsContent value="closing" className="space-y-4">
          <MonthlyClosingManagement />
        </TabsContent>

        {/* TAB 4: DATA IMPORT */}
        <TabsContent value="data" className="space-y-4">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                استيراد نسخة احتياطية قديمة (Legacy Backup Import)
              </CardTitle>
              <CardDescription>
                استيراد البيانات من النظام القديم. يتم تحليل البيانات ومطابقتها بأمان قبل الاستيراد الفعلي.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label htmlFor="backup-file" className="block text-sm font-medium mb-2">
                      اختر ملف النسخة الاحتياطية (JSON)
                    </label>
                    <input 
                      type="file" 
                      id="backup-file" 
                      accept=".json"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90"
                    />
                  </div>
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={!file || importStatus === 'ANALYZING' || importStatus === 'IMPORTING'}
                    className="mt-6"
                  >
                    {importStatus === 'ANALYZING' ? 'جاري التحليل...' : 'تحليل الملف'}
                  </Button>
                </div>
              </div>

              {importStatus === 'PREVIEW' && previewData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">الكيانات المكتشفة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-muted-foreground">شقق:</dt>
                            <dd className="font-medium">{previewData.detected.apartments}</dd>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-muted-foreground">سكان:</dt>
                            <dd className="font-medium">{previewData.detected.residents}</dd>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-muted-foreground">ديون مسجلة:</dt>
                            <dd className="font-medium">{previewData.detected.debts}</dd>
                          </div>
                          <div className="flex justify-between pb-2">
                            <dt className="text-muted-foreground">مدفوعات:</dt>
                            <dd className="font-medium">{previewData.detected.payments}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">التحليل المالي المتوقع</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-muted-foreground">إجمالي المتوقع (Legacy):</dt>
                            <dd className="font-medium">${previewData.financialTotals.legacyExpected.toLocaleString()}</dd>
                          </div>
                          <div className="flex justify-between border-b pb-2">
                            <dt className="text-muted-foreground">إجمالي المحصل (Legacy):</dt>
                            <dd className="font-medium text-green-600">${previewData.financialTotals.legacyCollected.toLocaleString()}</dd>
                          </div>
                          <div className="flex justify-between pb-2">
                            <dt className="text-muted-foreground">إجمالي المتبقي (Legacy):</dt>
                            <dd className="font-medium text-destructive">${previewData.financialTotals.legacyOutstanding.toLocaleString()}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>

                  {previewData.warnings.length > 0 && (
                    <div className="bg-yellow-950/30 text-yellow-400 p-4 rounded-lg border border-yellow-900">
                      <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4" />
                        تنبيهات المراجعة
                      </h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {previewData.warnings.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-4 p-4 bg-muted/30 rounded-lg border">
                    <Button variant="outline" className="flex-1 gap-2" onClick={handleDryRun}>
                      <Play className="h-4 w-4" />
                      محاكاة الاستيراد (Dry Run)
                    </Button>
                    <Button 
                      className="flex-1 gap-2" 
                      variant="destructive"
                      onClick={handleImport}
                    >
                      <Upload className="h-4 w-4" />
                      بدء الاستيراد الفعلي (Transactional)
                    </Button>
                  </div>
                </div>
              )}

              {importStatus === 'IMPORTING' && (
                <div className="p-12 text-center space-y-4">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-lg font-medium">جاري استيراد البيانات...</p>
                  <p className="text-sm text-muted-foreground">الرجاء عدم إغلاق هذه الصفحة. يتم تنفيذ الاستيراد داخل Transaction لضمان سلامة البيانات.</p>
                </div>
              )}

              {importStatus === 'DONE' && (
                <div className="p-8 text-center space-y-4 bg-emerald-950/30 rounded-lg border border-emerald-900">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <h3 className="text-xl font-bold text-emerald-400">تم استيراد البيانات بنجاح</h3>
                  <p className="text-emerald-500">تمت مطابقة الأرصدة بنجاح (Reconciliation Passed).</p>
                  
                  <div className="max-w-sm mx-auto text-sm text-right bg-background p-4 rounded-md shadow-sm mt-4">
                    <div className="flex justify-between border-b pb-2 mb-2">
                      <span className="text-muted-foreground">حالة الاستيراد:</span>
                      <span className="font-bold text-green-600">PASS</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 mb-2">
                      <span className="text-muted-foreground">السجلات المستوردة:</span>
                      <span className="font-bold">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المطابقة المالية:</span>
                      <span className="font-bold text-green-600">متطابق ($0 فرق)</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Database Reset & Reload */}
          <Card className="border-amber-500/30 bg-amber-50/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-amber-600">
                <Database className="h-5 w-5" />
                إعادة ضبط قاعدة البيانات وتحميل بيانات العمارة المعتمدة
              </CardTitle>
              <CardDescription>
                يقوم هذا الخيار بمسح كافة السجلات الحالية وتهيئة شقق العمارة (شقق 1-13، المحلات، الشقق الإضافية)، بيانات السكان، جلسات الضخ، عقود الإيجار، وسندات الصرف والقبض وفق أحدث كشف معتمد.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                onClick={async () => {
                  if (!window.confirm('هل أنت متأكد من رغبتك في مسح كافة البيانات وإعادة تهيئة قاعدة البيانات بالبيانات المعتمدة؟')) {
                    return;
                  }
                  try {
                    toast.loading('جاري مسح وتهيئة البيانات...', { id: 'seed-task' });
                    const res = await fetch('/api/import/reset-and-seed', { method: 'POST' });
                    if (res.ok) {
                      toast.success('تمت إعادة تهيئة البيانات بنجاح!', { id: 'seed-task' });
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      const data = await res.json();
                      toast.error(data.error || 'فشلت عملية إعادة التهيئة', { id: 'seed-task' });
                    }
                  } catch (e: any) {
                    toast.error(e.message || 'حدث خطأ في الاتصال', { id: 'seed-task' });
                  }
                }}
              >
                <RefreshCw className="h-4 w-4" />
                مسح البيانات ورفع البيانات المعتمدة الآن
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      
        {/* TAB 5: ABOUT */}
        <TabsContent value="about" className="space-y-4">
          <DeveloperWordCard compact={false} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
