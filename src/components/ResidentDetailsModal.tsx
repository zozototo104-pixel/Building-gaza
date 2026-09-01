import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Upload, 
  Download, 
  Printer, 
  Eye, 
  Trash2, 
  FileSpreadsheet, 
  FileCode, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Phone, 
  Coins, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  X,
  FileCheck,
  FileBox,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Key,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { useAuth } from '@/lib/auth';

interface ResidentDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileData: string;
  notes?: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface ResidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: any | null;
  isAdmin?: boolean;
  onResidentUpdated?: (updatedResident: any) => void;
}

export function ResidentDetailsModal({
  isOpen,
  onClose,
  resident,
  isAdmin = true,
  onResidentUpdated
}: ResidentDetailsModalProps) {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'documents' | 'upload' | 'preview'>('documents');
  const [selectedDoc, setSelectedDoc] = useState<ResidentDocument | null>(null);
  const [excelData, setExcelData] = useState<{ sheets: string[]; activeSheet: string; data: any[][] } | null>(null);
  
  // Upload Form State
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const docs: ResidentDocument[] = resident?.statementDocuments || (resident?.statementFileUrl ? [{
    id: 'legacy_doc_1',
    title: resident.statementNotes || resident.statementFileName || 'كشف الاستحقاقات المالية',
    fileName: resident.statementFileName || 'ملف_الاستحقاق.pdf',
    fileType: resident.statementFileType || 'application/pdf',
    fileSize: resident.statementFileSize || '',
    fileData: resident.statementFileUrl,
    notes: resident.statementNotes || '',
    uploadedAt: resident.statementUploadedAt || new Date().toISOString(),
    uploadedBy: 'الإدارة'
  }] : []);

  useEffect(() => {
    if (docs.length > 0 && !selectedDoc) {
      handleSelectDocForPreview(docs[0]);
    }
  }, [resident]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 15 ميجابايت.');
      return;
    }

    setSelectedFile(file);
    if (!uploadTitle) {
      // Auto-set title from file name without extension
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setUploadTitle(`تفاصيل استحقاقات - ${nameWithoutExt}`);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileBase64) {
      toast.error('الرجاء اختيار ملف بصيغة Excel أو Word أو PDF');
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken();
      const formattedSize = (selectedFile.size / 1024 < 1024)
        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
        : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`;

      const payload = {
        title: uploadTitle || selectedFile.name,
        fileName: selectedFile.name,
        fileType: selectedFile.type || getMimeTypeFromExt(selectedFile.name),
        fileSize: formattedSize,
        fileData: fileBase64,
        notes: uploadNotes
      };

      const res = await fetch(`/api/residents/${resident.id}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('تم رفع وحفظ ملف الاستحقاقات بنجاح');
        setSelectedFile(null);
        setFileBase64('');
        setUploadTitle('');
        setUploadNotes('');
        setActiveTab('documents');
        if (onResidentUpdated && data.resident) {
          onResidentUpdated(data.resident);
        }
        if (data.document) {
          handleSelectDocForPreview(data.document);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل رفع الملف');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء رفع الملف');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('هل أنت متأكد من حذف هذا الملف؟')) return;

    setIsDeleting(docId);
    try {
      const token = await getToken();
      const res = await fetch(`/api/residents/${resident.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('تم حذف الملف بنجاح');
        if (onResidentUpdated && data.resident) {
          onResidentUpdated(data.resident);
        }
        if (selectedDoc?.id === docId) {
          setSelectedDoc(null);
          setExcelData(null);
        }
      } else {
        toast.error('فشل حذف الملف');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حذف الملف');
    } finally {
      setIsDeleting(null);
    }
  };

  const getMimeTypeFromExt = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (ext === 'xls') return 'application/vnd.ms-excel';
    if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === 'doc') return 'application/msword';
    return 'application/octet-stream';
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

  const handleSelectDocForPreview = (doc: ResidentDocument) => {
    setSelectedDoc(doc);
    setExcelData(null);

    if (isExcel(doc.fileName, doc.fileType) && doc.fileData) {
      try {
        // Parse base64 with XLSX
        const base64Data = doc.fileData.includes('base64,') ? doc.fileData.split('base64,')[1] : doc.fileData;
        const workbook = XLSX.read(base64Data, { type: 'base64' });
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
      } catch (err) {
        console.error('Error parsing Excel data:', err);
      }
    }
  };

  const handleSwitchSheet = (sheetName: string) => {
    if (!selectedDoc || !selectedDoc.fileData) return;
    try {
      const base64Data = selectedDoc.fileData.includes('base64,') ? selectedDoc.fileData.split('base64,')[1] : selectedDoc.fileData;
      const workbook = XLSX.read(base64Data, { type: 'base64' });
      const rawRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
      setExcelData(prev => prev ? { ...prev, activeSheet: sheetName, data: rawRows } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (doc: ResidentDocument) => {
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

  if (!resident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] flex flex-col p-0 overflow-hidden" dir="rtl">
        {/* Header with Resident Profile Summary */}
        <div className="bg-muted/40 p-5 border-b flex-shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl text-primary font-bold">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-black text-foreground">
                    تفاصيل ومستندات: {resident.name}
                  </DialogTitle>
                  <Badge 
                    variant="secondary" 
                    className={resident.type === 'OWNER' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                  >
                    {resident.type === 'OWNER' ? 'مالك' : 'مستأجر'}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                  {resident.apartment && (
                    <span className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5 text-primary" />
                      شقة {resident.apartment.number}
                    </span>
                  )}
                  {resident.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {resident.phone}
                    </span>
                  )}
                  {resident.creditBalance > 0 && (
                    <span className="flex items-center gap-1 text-emerald-700 font-bold font-mono">
                      <Coins className="h-3.5 w-3.5" />
                      رصيد دائن: ₪{Number(resident.creditBalance).toFixed(2)}
                    </span>
                  )}
                  {/* Access Code */}
                  <span className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[11px] font-mono font-bold">
                    <Key className="h-3 w-3 text-amber-600" />
                    <span>الرقم السري للدخول: {resident.accessCode || resident.apartment?.accessCode || '123456'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const code = resident.accessCode || resident.apartment?.accessCode || '123456';
                        const aptNum = resident.apartment?.number || '';
                        const text = `🏢 *بيانات دخول بوابة الساكن*\n👤 الساكن: ${resident.name}\n🚪 رقم الشقة: ${aptNum}\n🔑 الرقم السري: ${code}\n🌐 يمكنك الدخول من صفحة تسجيل الدخول باختيار (دخول الساكن / المالك) وإدخال رقم الشقة والرقم السري أعلاه للاطلاع على كشوفات الحساب والاستحقاقات المالية.`;
                        navigator.clipboard.writeText(text);
                        toast.success(`تم نسخ بيانات دخول ${resident.name} للمشاركة`);
                      }}
                      className="p-0.5 hover:bg-amber-200/60 dark:hover:bg-amber-800 rounded transition-colors text-amber-800 dark:text-amber-300"
                      title="نسخ بيانات الدخول كاملة لإرسالها للساكن"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </span>
                </DialogDescription>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 bg-background p-1 rounded-lg border">
              <Button
                variant={activeTab === 'documents' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('documents')}
                className="gap-1.5 text-xs font-bold"
              >
                <FileText className="h-4 w-4" />
                المستندات ({docs.length})
              </Button>
              
              {isAdmin && (
                <Button
                  variant={activeTab === 'upload' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('upload')}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Upload className="h-4 w-4" />
                  رفع ملف جديد
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: UPLOAD NEW FILE */}
          {activeTab === 'upload' && (
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold">إرفاق ملف تفاصيل الاستحقاقات المالية</h3>
                <p className="text-xs text-muted-foreground">
                  يمكنك رفع ملف Excel أو Word أو PDF يحتوي على الحسابات الدقيقة والتفاصيل الخاصة بالساكن.
                </p>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 bg-card border rounded-xl p-5">
                {/* File Dropzone */}
                <div className="border-2 border-dashed border-primary/30 hover:border-primary rounded-xl p-6 text-center transition-colors bg-muted/20">
                  <input
                    type="file"
                    id="resident-file-upload"
                    className="hidden"
                    accept=".xlsx,.xls,.doc,.docx,.pdf,.csv"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="resident-file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="p-3 bg-primary/10 text-primary rounded-full">
                      <Upload className="h-6 w-6" />
                    </div>
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground text-emerald-700 flex items-center gap-1 justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          الحجم: {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground">
                          اضغط هنا لاختيار الملف أو اسحبه إلى هنا
                        </p>
                        <p className="text-xs text-muted-foreground">
                          صيغ الملفات المدعومة: Excel (.xlsx, .xls) ، Word (.docx, .doc) ، PDF (.pdf)
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Document Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">عنوان أو وصف المستند</label>
                  <Input
                    placeholder="مثال: كشف استحقاقات ورسوم الخدمات لعام 2025"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                  />
                </div>

                {/* Notes / Details */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">ملاحظات تفصيلية للساكن (اختياري)</label>
                  <Input
                    placeholder="مثال: يرجى مراجعة صفحة الحسابات الختامية والمطابقة مع الإدارة"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('documents')}
                    disabled={isUploading}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={!selectedFile || isUploading}
                    className="gap-2 bg-primary font-bold"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        جاري الحفظ والرفع...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        حفظ ورفع المستند
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: DOCUMENTS LIST & VIEWER */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              {docs.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 border rounded-xl p-8 space-y-3">
                  <div className="p-4 bg-muted inline-flex rounded-full text-muted-foreground">
                    <FileBox className="h-8 w-8" />
                  </div>
                  <h4 className="font-bold text-base">لا توجد ملفات أو مستندات تفاصيل مرفوعة لهذا الساكن</h4>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    تستطيع الإدارة رفع ملفات إكسل أو وورد أو بي دي إف بتفاصيل استحقاقات الساكن الدقيقة ليتمكن من معاينتها وطباعتها وتصديرها.
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setActiveTab('upload')} className="gap-2 bg-primary mt-2">
                      <Plus className="h-4 w-4" />
                      رفع ملف تفاصيل الآن
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Documents List (4 cols) */}
                  <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        الملفات المرفقة ({docs.length})
                      </h4>
                      {isAdmin && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveTab('upload')} 
                          className="h-7 text-xs text-primary gap-1 font-bold"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          إضافة ملف
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      {docs.map((doc) => {
                        const isSelected = selectedDoc?.id === doc.id;
                        const isXls = isExcel(doc.fileName, doc.fileType);
                        const isDocPdf = isPdf(doc.fileName, doc.fileType);
                        const isDocWord = isWord(doc.fileName, doc.fileType);

                        return (
                          <div
                            key={doc.id}
                            onClick={() => handleSelectDocForPreview(doc)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                              isSelected 
                                ? 'bg-primary/5 border-primary shadow-xs ring-1 ring-primary/20' 
                                : 'bg-card hover:bg-muted/40 border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-2 rounded-lg shrink-0 ${
                                  isXls ? 'bg-emerald-100 text-emerald-700' :
                                  isDocPdf ? 'bg-rose-100 text-rose-700' :
                                  isDocWord ? 'bg-blue-100 text-blue-700' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {isXls ? <FileSpreadsheet className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-xs text-foreground truncate" title={doc.title || doc.fileName}>
                                    {doc.title || doc.fileName}
                                  </h5>
                                  <p className="text-[11px] text-muted-foreground truncate" title={doc.fileName}>
                                    {doc.fileName}
                                  </p>
                                </div>
                              </div>

                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                  onClick={(e) => handleDeleteDoc(doc.id, e)}
                                  disabled={isDeleting === doc.id}
                                  title="حذف الملف"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
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
                  </div>

                  {/* Right Column: Active Document Preview & Actions (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col bg-card border rounded-xl overflow-hidden min-h-[420px]">
                    {selectedDoc ? (
                      <>
                        {/* Preview Header / Toolbar */}
                        <div className="p-3 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-bold text-xs text-foreground truncate max-w-[280px]">
                              {selectedDoc.title || selectedDoc.fileName}
                            </span>
                            <Badge variant="outline" className="text-[10px] uppercase font-mono">
                              {selectedDoc.fileName.split('.').pop()}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Download Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(selectedDoc)}
                              className="h-8 gap-1 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              <Download className="h-3.5 w-3.5" />
                              تصدير وتحميل
                            </Button>

                            {/* Print Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePrint}
                              className="h-8 gap-1 text-xs font-bold hover:bg-primary/10 hover:text-primary"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              طباعة
                            </Button>
                          </div>
                        </div>

                        {/* Notes if available */}
                        {selectedDoc.notes && (
                          <div className="p-3 bg-amber-50/70 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                            <span><strong>ملاحظات الإدارة:</strong> {selectedDoc.notes}</span>
                          </div>
                        )}

                        {/* Document Content View Area */}
                        <div className="p-4 flex-1 overflow-auto bg-background min-h-[350px]">
                          {/* CASE 1: EXCEL SHEET PREVIEW */}
                          {isExcel(selectedDoc.fileName, selectedDoc.fileType) && (
                            <div className="space-y-3">
                              {excelData ? (
                                <>
                                  {/* Sheet Tabs */}
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

                                  {/* Render Sheet Table */}
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
                                <div className="text-center py-10 space-y-2">
                                  <FileSpreadsheet className="h-10 w-10 text-emerald-600 mx-auto animate-pulse" />
                                  <p className="text-xs text-muted-foreground">جاري قراءة وتنسيق بيانات جدول Excel...</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* CASE 2: PDF PREVIEW */}
                          {isPdf(selectedDoc.fileName, selectedDoc.fileType) && (
                            <div className="w-full h-full min-h-[380px] flex flex-col rounded-lg overflow-hidden border">
                              <iframe
                                src={selectedDoc.fileData}
                                className="w-full flex-1 min-h-[380px] border-none"
                                title="PDF Preview"
                              />
                            </div>
                          )}

                          {/* CASE 3: WORD / OTHER FORMATS */}
                          {isWord(selectedDoc.fileName, selectedDoc.fileType) && (
                            <div className="text-center py-12 space-y-4 max-w-md mx-auto">
                              <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl inline-flex">
                                <FileText className="h-12 w-12" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-bold text-base text-foreground">
                                  مستند Word: {selectedDoc.fileName}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  يحتوي هذا الملف على تفاصيل وشروط الاستحقاقات المالية الخاصة بالساكن. يمكنك تصديره وتنزيله مباشرة لفتحه في تطبيق Word أو طباعته.
                                </p>
                              </div>
                              <div className="flex justify-center gap-2 pt-2">
                                <Button
                                  onClick={() => handleDownload(selectedDoc)}
                                  className="gap-2 bg-blue-600 hover:bg-blue-700 font-bold"
                                >
                                  <Download className="h-4 w-4" />
                                  تحميل ملف Word الآن
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* DEFAULT / OTHER TYPES */}
                          {!isExcel(selectedDoc.fileName, selectedDoc.fileType) &&
                           !isPdf(selectedDoc.fileName, selectedDoc.fileType) &&
                           !isWord(selectedDoc.fileName, selectedDoc.fileType) && (
                            <div className="text-center py-12 space-y-4 max-w-md mx-auto">
                              <div className="p-4 bg-muted text-muted-foreground rounded-2xl inline-flex">
                                <FileBox className="h-12 w-12" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="font-bold text-base text-foreground">{selectedDoc.fileName}</h4>
                                <p className="text-xs text-muted-foreground">
                                  اضغط على زر التصدير والتحميل للاطلاع على محتويات المستند بالكامل.
                                </p>
                              </div>
                              <Button onClick={() => handleDownload(selectedDoc)} className="gap-2">
                                <Download className="h-4 w-4" />
                                تحميل الملف
                              </Button>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
                        <FileText className="h-10 w-10 opacity-40" />
                        <p className="text-xs">اختر مستنداً من القائمة الجانبية لمعاينته وتصديره وطباعته</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-muted/40 p-4 border-t flex justify-between items-center flex-shrink-0">
          <div className="text-xs text-muted-foreground">
            {docs.length > 0 ? `إجمالي الملفات: ${docs.length}` : 'لا توجد ملفات'}
          </div>
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
