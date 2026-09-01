import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  DoorOpen, 
  FileText, 
  Bell, 
  PenTool, 
  Download, 
  Printer, 
  Eye, 
  FileSpreadsheet, 
  FileBox, 
  Calendar, 
  User, 
  Building, 
  Phone, 
  Coins, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  FileCheck,
  ChevronRight,
  Receipt,
  Users,
  Search
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ResidentDetailsModal } from '@/components/ResidentDetailsModal';
import { formatDebtSource, formatStatus } from '@/lib/utils';
import { DeveloperWordCard } from '@/components/DeveloperWordCard';

export function TenantPortal() {
  const { userRecord, getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resident, setResident] = useState<any | null>(null);
  const [allResidents, setAllResidents] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [credits, setCredits] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Selected Document for preview in portal
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [excelData, setExcelData] = useState<{ sheets: string[]; activeSheet: string; data: any[][] } | null>(null);
  
  // Modal for full details / admin management if needed
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const fetchPortalData = async (residentId?: number) => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const url = residentId ? `/api/my-portal?residentId=${residentId}` : '/api/my-portal';
      const res = await fetch(url, { headers });

      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          setResident(data.resident || null);
          setAllResidents(data.allResidents || []);
          setDebts(data.debts || []);
          setCredits(data.credits || []);
          setContracts(data.contracts || []);
          setAnnouncements(data.announcements || []);

          // Auto-select first doc for preview if available
          const docs = getResidentDocs(data.resident);
          if (docs.length > 0) {
            handleSelectDoc(docs[0]);
          } else {
            setPreviewDoc(null);
            setExcelData(null);
          }
        } else {
          console.warn('Unexpected non-JSON response from /api/my-portal');
        }
      }
    } catch (err) {
      console.error('Error fetching portal data:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات البوابة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const getResidentDocs = (resObj: any) => {
    if (!resObj) return [];
    if (Array.isArray(resObj.statementDocuments) && resObj.statementDocuments.length > 0) {
      return resObj.statementDocuments;
    }
    if (resObj.statementFileUrl) {
      return [{
        id: 'legacy_doc',
        title: resObj.statementNotes || resObj.statementFileName || 'كشف الاستحقاقات المالية',
        fileName: resObj.statementFileName || 'ملف_الاستحقاق.pdf',
        fileType: resObj.statementFileType || 'application/pdf',
        fileSize: resObj.statementFileSize || '',
        fileData: resObj.statementFileUrl,
        notes: resObj.statementNotes || '',
        uploadedAt: resObj.statementUploadedAt || new Date().toISOString(),
        uploadedBy: 'الإدارة'
      }];
    }
    return [];
  };

  const isExcel = (fileName: string, fileType?: string) => {
    const lower = (fileName || '').toLowerCase();
    return lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv') || (fileType && fileType.includes('spreadsheet'));
  };

  const isPdf = (fileName: string, fileType?: string) => {
    const lower = (fileName || '').toLowerCase();
    return lower.endsWith('.pdf') || (fileType && fileType.includes('pdf'));
  };

  const isWord = (fileName: string, fileType?: string) => {
    const lower = (fileName || '').toLowerCase();
    return lower.endsWith('.docx') || lower.endsWith('.doc') || (fileType && fileType.includes('word'));
  };

  const handleSelectDoc = (doc: any) => {
    setPreviewDoc(doc);
    setExcelData(null);

    if (isExcel(doc.fileName, doc.fileType) && doc.fileData) {
      try {
        let base64Data = doc.fileData;
        if (typeof base64Data === 'string' && base64Data.includes('base64,')) {
          base64Data = base64Data.split('base64,')[1];
        }
        if (typeof base64Data === 'string' && base64Data.trim().length > 0) {
          const cleanBase64 = base64Data.trim().replace(/\s+/g, '');
          const workbook = XLSX.read(cleanBase64, { type: 'base64' });
          const sheetNames = workbook.SheetNames;
          if (sheetNames.length > 0) {
            const firstSheet = sheetNames[0];
            const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 }) as any[][];
            setExcelData({
              sheets: sheetNames,
              activeSheet: firstSheet,
              data: rawRows
            });
          }
        }
      } catch (err) {
        console.error('Error parsing Excel data:', err);
      }
    }
  };

  const handleSwitchSheet = (sheetName: string) => {
    if (!previewDoc || !previewDoc.fileData) return;
    try {
      let base64Data = previewDoc.fileData;
      if (typeof base64Data === 'string' && base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1];
      }
      if (typeof base64Data === 'string' && base64Data.trim().length > 0) {
        const cleanBase64 = base64Data.trim().replace(/\s+/g, '');
        const workbook = XLSX.read(cleanBase64, { type: 'base64' });
        const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
        setExcelData(prev => prev ? { ...prev, activeSheet: sheetName, data: rawRows } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (doc: any) => {
    if (!doc.fileData) {
      toast.error('لا توجد بيانات متاحة للملف');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName || `استحقاقات_${resident?.name || 'الساكن'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`جاري تنزيل ملف ${doc.fileName}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const docs = getResidentDocs(resident);
  const totalUnpaidDebts = debts.filter(d => d.status !== 'PAID').reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
  const totalCredits = credits.reduce((acc, curr) => acc + (parseFloat(curr.remainingAmount) || 0), 0);

  const filteredResidentsList = allResidents.filter(r => 
    r.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (r.apartment && r.apartment.number.includes(filterQuery)) ||
    (r.phone && r.phone.includes(filterQuery))
  );

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Resident Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-5 rounded-2xl border shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3.5 rounded-2xl text-primary">
            <DoorOpen className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">بوابة السكان والمُلاك</h1>
              {resident && (
                <Badge variant="secondary" className={resident.type === 'OWNER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                  {resident.type === 'OWNER' ? 'مالك' : 'مستأجر'}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              مرحباً بك في البوابة الخاصة للاطلاع على تفاصيل الاستحقاقات، معاينة وطباعة وتصدير الكشوفات والعقود.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Quick Switch for Admins/Multi-unit users */}
          {allResidents.length > 1 && (
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border">
              <span className="text-xs font-bold text-muted-foreground px-2">عرض ملف الساكن:</span>
              <select
                className="bg-background border text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                value={resident?.id || ''}
                onChange={(e) => fetchPortalData(Number(e.target.value))}
              >
                {allResidents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} {r.apartment ? `(شقة ${r.apartment.number})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => fetchPortalData(resident?.id)} className="gap-1.5 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>

          {resident && (
            <Button 
              onClick={() => setIsDetailsModalOpen(true)} 
              className="gap-2 bg-primary text-primary-foreground font-bold text-xs"
              size="sm"
            >
              <FileText className="h-4 w-4" />
              إدارة ورفع المستندات
            </Button>
          )}
        </div>
      </div>

      {/* Developer Word for Residents */}
      <DeveloperWordCard compact={true} />

      {loading ? (
        <div className="text-center py-16 bg-card border rounded-2xl">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm font-bold text-muted-foreground">جاري تحميل بيانات الساكن والمستندات...</p>
        </div>
      ) : !resident ? (
        <div className="text-center py-16 bg-card border rounded-2xl space-y-3">
          <User className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold">لم يتم العثور على ملف ساكن مسجل</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            الرجاء التواصل مع إدارة المبنى لربط حسابك برقم الشقة وتسجيل استحقاقاتك المالية.
          </p>
        </div>
      ) : (
        <>
          {/* Top Summary Cards for the Resident */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Resident Info Card */}
            <Card className="p-4 bg-card border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">بيانات الساكن</p>
                  <h4 className="text-base font-bold mt-1 text-foreground">{resident.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{resident.phone || 'بدون هاتف'}</p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                  <User className="h-5 w-5" />
                </div>
              </div>
            </Card>

            {/* Apartment Card */}
            <Card className="p-4 bg-card border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">الوحدة السكنية</p>
                  <h4 className="text-base font-bold mt-1 text-foreground">
                    {resident.apartment ? `شقة رقم ${resident.apartment.number}` : 'غير محددة'}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {resident.apartment?.floor ? `الطابق ${resident.apartment.floor}` : `${resident.familyMembers || 1} أفراد`}
                  </p>
                </div>
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
                  <Building className="h-5 w-5" />
                </div>
              </div>
            </Card>

            {/* Financial Dues Card */}
            <Card className={`p-4 border ${totalUnpaidDebts > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-card'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">المطالبات والديون المستحقة</p>
                  <h4 className={`text-xl font-bold font-mono mt-1 ${totalUnpaidDebts > 0 ? 'text-rose-700' : 'text-foreground'}`}>
                    ₪{totalUnpaidDebts.toFixed(2)}
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {debts.filter(d => d.status !== 'PAID').length} مطالبات غير مسددة
                  </p>
                </div>
                <div className={`p-2.5 rounded-xl ${totalUnpaidDebts > 0 ? 'bg-rose-100 text-rose-700' : 'bg-muted text-muted-foreground'}`}>
                  <Receipt className="h-5 w-5" />
                </div>
              </div>
            </Card>

            {/* Available Credit Card */}
            <Card className="p-4 bg-emerald-50/60 border border-emerald-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-800 font-semibold">الرصيد الدائن المتاح</p>
                  <h4 className="text-xl font-bold font-mono mt-1 text-emerald-700">
                    ₪{totalCredits.toFixed(2)}
                  </h4>
                  <p className="text-[11px] text-emerald-600 mt-0.5">يمكن خصمه من الفواتير القادمة</p>
                </div>
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
                  <Coins className="h-5 w-5" />
                </div>
              </div>
            </Card>
          </div>

          {/* Main Portal Tabs */}
          <Tabs defaultValue="documents" className="w-full space-y-4">
            <div className="w-full overflow-x-auto pb-1 scrollbar-none">
              <TabsList className="flex w-full min-w-[560px] sm:min-w-0 sm:grid sm:grid-cols-4 bg-muted/70 p-1.5 rounded-xl border">
                <TabsTrigger value="documents" className="gap-2 font-bold text-xs sm:text-sm py-2 px-3">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span>كشوفات ومستندات</span>
                  <span className="bg-primary/10 text-primary text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                    {docs.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="debts" className="gap-2 font-bold text-xs sm:text-sm py-2 px-3">
                  <Receipt className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>كشف الحساب والديون</span>
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                    {debts.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="contracts" className="gap-2 font-bold text-xs sm:text-sm py-2 px-3">
                  <PenTool className="h-4 w-4 shrink-0 text-blue-600" />
                  <span>عقود الإيجار</span>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                    {contracts.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="announcements" className="gap-2 font-bold text-xs sm:text-sm py-2 px-3">
                  <Bell className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>التعميمات والإعلانات</span>
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                    {announcements.length}
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: DOCUMENTS (Excel, Word, PDF Viewer, Export & Print) */}
            <TabsContent value="documents" className="space-y-4">
              <Card className="border shadow-2xs">
                <CardHeader className="p-4 border-b bg-muted/20">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        ملفات وكشوفات الاستحقاقات التفصيلية
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        ملفات Excel و Word و PDF المرفوعة من الإدارة الخاصة بحسابك واستحقاقاتك المالية. يمكنك معاينتها وطباعتها وتصديرها.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsDetailsModalOpen(true)}
                        className="text-xs gap-1.5"
                      >
                        <FileCheck className="h-4 w-4 text-primary" />
                        إدارة ورفع ملفات جديدة
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5">
                  {docs.length === 0 ? (
                    <div className="text-center py-14 space-y-3 bg-muted/10 border border-dashed rounded-xl p-6">
                      <FileBox className="h-10 w-10 text-muted-foreground mx-auto" />
                      <h4 className="font-bold text-sm">لا توجد ملفات تفاصيل مرفوعة لهذا الساكن حالياً</h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        يمكن لإدارة المبنى رفع ملفات إكسل أو وورد أو بي دي إف تحتوي على أدق تفاصيل الحسابات لتظهر هنا فوراً.
                      </p>
                      <Button onClick={() => setIsDetailsModalOpen(true)} className="gap-2 bg-primary text-xs font-bold mt-2">
                        <FileText className="h-4 w-4" />
                        رفع ملف الاستحقاقات الآن
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left: Documents Selector List (4 cols) */}
                      <div className="lg:col-span-4 space-y-2.5">
                        <p className="text-xs font-bold text-muted-foreground">اختر المستند للعرض والتحميل:</p>
                        {docs.map((doc: any) => {
                          const isSelected = previewDoc?.id === doc.id;
                          const isXls = isExcel(doc.fileName, doc.fileType);
                          const isDocPdf = isPdf(doc.fileName, doc.fileType);
                          const isDocWord = isWord(doc.fileName, doc.fileType);

                          return (
                            <div
                              key={doc.id}
                              onClick={() => handleSelectDoc(doc)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                                isSelected 
                                  ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20' 
                                  : 'bg-card hover:bg-muted/40 border-border'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-2.5 rounded-lg shrink-0 ${
                                  isXls ? 'bg-emerald-100 text-emerald-700' :
                                  isDocPdf ? 'bg-rose-100 text-rose-700' :
                                  isDocWord ? 'bg-blue-100 text-blue-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {isXls ? <FileSpreadsheet className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-bold text-xs text-foreground truncate" title={doc.title || doc.fileName}>
                                    {doc.title || doc.fileName}
                                  </h5>
                                  <p className="text-[11px] text-muted-foreground truncate" title={doc.fileName}>
                                    {doc.fileName}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                                <span className="flex items-center gap-1 font-mono">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(doc.uploadedAt).toLocaleDateString('ar-EG')}
                                </span>
                                {doc.fileSize && (
                                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">
                                    {doc.fileSize}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Right: Live Interactive Document Viewer (8 cols) */}
                      <div className="lg:col-span-8 flex flex-col bg-card border rounded-xl overflow-hidden min-h-[440px]">
                        {previewDoc ? (
                          <>
                            {/* Viewer Toolbar */}
                            <div className="p-3 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-xs text-foreground truncate max-w-[280px]">
                                  {previewDoc.title || previewDoc.fileName}
                                </span>
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {previewDoc.fileName.split('.').pop()}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(previewDoc)}
                                  className="h-8 gap-1.5 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  تصدير وتحميل
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handlePrint}
                                  className="h-8 gap-1.5 text-xs font-bold hover:bg-primary/10 hover:text-primary"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  طباعة
                                </Button>
                              </div>
                            </div>

                            {/* Administrative Notes */}
                            {previewDoc.notes && (
                              <div className="p-3 bg-amber-50/70 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                <span><strong>ملاحظة من الإدارة:</strong> {previewDoc.notes}</span>
                              </div>
                            )}

                            {/* Viewer Content Area */}
                            <div className="p-4 flex-1 overflow-auto bg-background min-h-[360px]">
                              {/* EXCEL PREVIEW */}
                              {isExcel(previewDoc.fileName, previewDoc.fileType) && (
                                <div className="space-y-3">
                                  {excelData ? (
                                    <>
                                      {excelData.sheets.length > 1 && (
                                        <div className="flex items-center gap-1.5 border-b pb-2 overflow-x-auto">
                                          <span className="text-xs font-bold text-muted-foreground ml-2">أوراق العمل:</span>
                                          {excelData.sheets.map(s => (
                                            <button
                                              key={s}
                                              type="button"
                                              onClick={() => handleSwitchSheet(s)}
                                              className={`px-3 py-1 text-xs rounded-md font-bold transition-colors ${
                                                excelData.activeSheet === s
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                              }`}
                                            >
                                              {s}
                                            </button>
                                          ))}
                                        </div>
                                      )}

                                      <div className="border rounded-lg overflow-x-auto max-h-[380px]">
                                        <table className="w-full text-xs text-right border-collapse">
                                          <tbody>
                                            {excelData.data.map((row, rIdx) => (
                                              <tr 
                                                key={rIdx} 
                                                className={rIdx === 0 ? 'bg-muted/70 font-bold border-b' : 'hover:bg-muted/20 border-b border-border/50'}
                                              >
                                                {row.map((cell, cIdx) => (
                                                  <td key={cIdx} className="p-2 border-l border-border/50 whitespace-nowrap">
                                                    {cell !== undefined && cell !== null ? String(cell) : ''}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-center py-12 space-y-2">
                                      <FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto animate-pulse" />
                                      <p className="text-xs text-muted-foreground">جاري تجهيز جدول الإكسل...</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* PDF PREVIEW */}
                              {isPdf(previewDoc.fileName, previewDoc.fileType) && (
                                <div className="w-full h-full min-h-[380px] flex flex-col rounded-lg overflow-hidden border">
                                  <iframe
                                    src={previewDoc.fileData}
                                    className="w-full flex-1 min-h-[380px] border-none"
                                    title="PDF Preview"
                                  />
                                </div>
                              )}

                              {/* WORD PREVIEW */}
                              {isWord(previewDoc.fileName, previewDoc.fileType) && (
                                <div className="text-center py-12 space-y-4 max-w-md mx-auto">
                                  <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl inline-flex">
                                    <FileText className="h-12 w-12" />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="font-bold text-base text-foreground">
                                      مستند Word: {previewDoc.fileName}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      يحتوي هذا المستند على تفاصيل الاستحقاقات والبنود المعتمدة. يمكنك تصديره وتنزيله مباشرة لفتحه في Word أو طباعته.
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => handleDownload(previewDoc)}
                                    className="gap-2 bg-blue-600 hover:bg-blue-700 font-bold"
                                  >
                                    <Download className="h-4 w-4" />
                                    تحميل وتصدير ملف Word الآن
                                  </Button>
                                </div>
                              )}

                              {/* OTHER */}
                              {!isExcel(previewDoc.fileName, previewDoc.fileType) &&
                               !isPdf(previewDoc.fileName, previewDoc.fileType) &&
                               !isWord(previewDoc.fileName, previewDoc.fileType) && (
                                <div className="text-center py-12 space-y-4 max-w-md mx-auto">
                                  <div className="p-4 bg-muted text-muted-foreground rounded-2xl inline-flex">
                                    <FileBox className="h-12 w-12" />
                                  </div>
                                  <div className="space-y-1">
                                    <h4 className="font-bold text-base text-foreground">{previewDoc.fileName}</h4>
                                    <p className="text-xs text-muted-foreground">
                                      اضغط على زر التحميل لحفظ الملف وفتحه على جهازك.
                                    </p>
                                  </div>
                                  <Button onClick={() => handleDownload(previewDoc)} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    تحميل وتصدير الملف
                                  </Button>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                            <FileText className="h-10 w-10 opacity-40" />
                            <p className="text-xs">اختر مستنداً من القائمة لمعاينته وتصديره وطباعته</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: DEBTS & ACCOUNT STATEMENT */}
            <TabsContent value="debts" className="space-y-4">
              <Card className="border shadow-2xs">
                <CardHeader className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-bold">كشف الحساب والمطالبات المالية</CardTitle>
                      <CardDescription className="text-xs">سجل بجميع الفواتير والمطالبات المستحقة والمسددة</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs font-bold">
                      <Printer className="h-3.5 w-3.5" />
                      طباعة كشف الحساب
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {debts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-xs font-semibold">
                      لا توجد ديون أو مطالبات مسجلة
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {debts.map((d) => (
                        <div key={d.id} className="flex justify-between items-center p-3.5 border rounded-xl hover:bg-muted/20 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-foreground">
                                {formatDebtSource(d.source || d.type)}
                              </h4>
                              {d.notes && <span className="text-xs text-muted-foreground">({d.notes})</span>}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono">
                              تاريخ الاستحقاق: {new Date(d.dueDate || d.date || d.createdAt).toLocaleDateString('ar-EG')}
                            </p>
                          </div>

                          <div className="text-left flex items-center gap-3">
                            <span className="font-bold text-base font-mono">₪{Number(d.amount).toFixed(2)}</span>
                            <Badge className={d.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}>
                              {d.status === 'PAID' ? 'مسدد' : 'مستحق'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: RENT CONTRACTS */}
            <TabsContent value="contracts" className="space-y-4">
              <Card className="border shadow-2xs">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-lg font-bold">عقود الإيجار المعتمدة</CardTitle>
                  <CardDescription className="text-xs">بيانات عقد الإيجار والقيمة الإيجارية الشهرية وتاريخ السريان</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {contracts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-xs font-semibold">
                      لا توجد عقود إيجار مسجلة لهذا الساكن حالياً
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contracts.map((c) => (
                        <div key={c.id} className="p-4 border rounded-xl bg-muted/10 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-sm text-foreground">
                                عقد رقم: {c.contractNumber || `#${c.id}`}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {c.unitDescription || `شقة الساكن ${resident.name}`}
                              </p>
                            </div>
                            <Badge className={c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}>
                              {formatStatus(c.status)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t text-xs">
                            <div>
                              <span className="text-muted-foreground block text-[10px]">قيمة الإيجار الشهري</span>
                              <strong className="font-mono text-sm">₪{c.rentAmount}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">تاريخ البداية</span>
                              <strong className="font-mono">{c.startDate ? new Date(c.startDate).toLocaleDateString('ar-EG') : '-'}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">تاريخ النهاية</span>
                              <strong className="font-mono">{c.endDate ? new Date(c.endDate).toLocaleDateString('ar-EG') : '-'}</strong>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-[10px]">طريقة الدفع</span>
                              <strong>{c.paymentCycle === 'MONTHLY' ? 'شهري' : c.paymentCycle}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 4: ANNOUNCEMENTS */}
            <TabsContent value="announcements" className="space-y-4">
              <Card className="border shadow-2xs">
                <CardHeader className="p-4 border-b">
                  <CardTitle className="text-lg font-bold">إعلانات وتعميمات الإدارة</CardTitle>
                  <CardDescription className="text-xs">التعميمات والتنبيهات الصادرة لجميع السكان</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {announcements.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-xs font-semibold">
                      لا توجد تعميمات جديدة حالياً
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((a) => (
                        <div key={a.id} className="p-4 border rounded-xl space-y-1.5 bg-card">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-sm text-foreground">{a.title}</h4>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {new Date(a.createdAt).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modal for Details & Documents Management */}
      <ResidentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        resident={resident}
        isAdmin={true}
        onResidentUpdated={(updated) => {
          setResident(updated);
          setAllResidents(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
          const docs = getResidentDocs(updated);
          if (docs.length > 0) {
            handleSelectDoc(docs[0]);
          }
        }}
      />
    </div>
  );
}
export default TenantPortal;
