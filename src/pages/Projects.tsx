import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Building2,
  Plus,
  Search,
  LayoutGrid,
  List,
  Coins,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  PlusCircle,
  MinusCircle,
  Eye,
  Edit2,
  Trash2,
  Printer
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Project, ProjectMetrics, Apartment } from '@/types';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectFormModal } from '@/components/projects/ProjectFormModal';
import { ProjectTransactionModal } from '@/components/projects/ProjectTransactionModal';
import { ProjectDetailsModal } from '@/components/projects/ProjectDetailsModal';
import { ProjectPrintView } from '@/components/projects/ProjectPrintView';

export function Projects() {
  const { getToken } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [cashFund, setCashFund] = useState<any[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'PLANNED' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectMetrics | null>(null);

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [transactionProject, setTransactionProject] = useState<ProjectMetrics | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printProject, setPrintProject] = useState<ProjectMetrics | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [pRes, cRes, aRes] = await Promise.all([
        fetch('/api/projects', { headers }),
        fetch('/api/cash-fund', { headers }),
        fetch('/api/apartments', { headers })
      ]);

      if (pRes.ok) setProjects(await pRes.json());
      if (cRes.ok) setCashFund(await cRes.json());
      if (aRes.ok) setApartments(await aRes.json());
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل بيانات المشاريع');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics for each project
  const projectsWithMetrics: ProjectMetrics[] = useMemo(() => {
    return projects.map((p) => {
      const projectTxs = cashFund.filter((tx) => tx.projectId === p.id);
      const collected = projectTxs
        .filter((tx) => tx.type === 'INCOME')
        .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const spent = projectTxs
        .filter((tx) => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const budgetNum = parseFloat(p.budget as string) || 0;

      const remainingToCollect = Math.max(0, budgetNum - collected);
      const remainingToSpend = Math.max(0, collected - spent);
      const deficit = spent > collected ? spent - collected : 0;
      const collectionPercentage = budgetNum > 0 ? Math.min(100, (collected / budgetNum) * 100) : 0;
      const progressPercentage = collected > 0 ? Math.min(100, (spent / collected) * 100) : 0;

      return {
        ...p,
        collected,
        spent,
        budgetNum,
        remainingToCollect,
        remainingToSpend,
        deficit,
        collectionPercentage,
        progressPercentage
      };
    });
  }, [projects, cashFund]);

  // KPIs
  const totalBudget = useMemo(() => projectsWithMetrics.reduce((sum, p) => sum + p.budgetNum, 0), [projectsWithMetrics]);
  const totalCollected = useMemo(() => projectsWithMetrics.reduce((sum, p) => sum + p.collected, 0), [projectsWithMetrics]);
  const totalSpent = useMemo(() => projectsWithMetrics.reduce((sum, p) => sum + p.spent, 0), [projectsWithMetrics]);
  const totalRemaining = useMemo(() => Math.max(0, totalBudget - totalCollected), [totalBudget, totalCollected]);
  const activeProjectsCount = useMemo(() => projects.filter((p) => p.status === 'IN_PROGRESS').length, [projects]);
  const completedProjectsCount = useMemo(() => projects.filter((p) => p.status === 'COMPLETED').length, [projects]);

  // Filtered List
  const filteredProjects = useMemo(() => {
    return projectsWithMetrics.filter((p) => {
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
      const matchesSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [projectsWithMetrics, statusFilter, searchQuery]);

  // Project CRUD Actions
  const handleCreateOrUpdateProject = async (data: any) => {
    setActionLoading(true);
    try {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          budget: parseFloat(data.budget) || 0,
          startDate: data.startDate || new Date().toISOString(),
          status: data.status || 'PLANNED',
          notes: data.notes,
          attachmentUrl: data.attachmentUrl
        })
      });

      if (res.ok) {
        toast.success(editingProject ? 'تم تعديل المشروع بنجاح' : 'تم إضافة المشروع بنجاح');
        setIsFormModalOpen(false);
        setEditingProject(null);
        await fetchData();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'حدث خطأ أثناء حفظ المشروع');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ في الاتصال بالخادم');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشروع؟')) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('تم حذف المشروع بنجاح');
        await fetchData();
      } else {
        toast.error('فشل حذف المشروع');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ');
    } finally {
      setActionLoading(false);
    }
  };

  // Transaction Actions
  const handleRecordTransaction = async (data: any) => {
    if (!transactionProject) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/projects/${transactionProject.id}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(data.type === 'INCOME' ? 'تم تسجيل المساهمة وإيداعها في الصندوق' : 'تم تسجيل المصروف وصرفه بنجاح');
        setIsTransactionModalOpen(false);
        await fetchData();
        // Update selected project if details modal is open
        if (selectedProject && selectedProject.id === transactionProject.id) {
          const updated = projectsWithMetrics.find((p) => p.id === transactionProject.id);
          if (updated) setSelectedProject(updated);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'فشل تسجيل المعاملة');
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء العملية');
    } finally {
      setActionLoading(false);
    }
  };

  const openAddTransaction = (project: ProjectMetrics, type: 'INCOME' | 'EXPENSE') => {
    setTransactionProject(project);
    setTransactionType(type);
    setIsTransactionModalOpen(true);
  };

  const openDetails = (project: ProjectMetrics) => {
    setSelectedProject(project);
    setIsDetailsModalOpen(true);
  };

  const openEdit = (project: ProjectMetrics) => {
    setEditingProject(project);
    setIsFormModalOpen(true);
  };

  const openPrint = (project: ProjectMetrics) => {
    setPrintProject(project);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            المشاريع وأعمال الصيانة والتطوير
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة الميزانيات، خطط الترميم والصيانة، وتحصيل مساهمات الشقق ومتابعة المصروفات
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setEditingProject(null);
              setIsFormModalOpen(true);
            }}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Plus className="w-4 h-4" />
            مشروع جديد
          </Button>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">إجمالي الميزانيات</span>
              <span className="text-lg font-bold text-slate-900 mt-1 block">
                {totalBudget.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
              </span>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">المحصل من المساهمات</span>
              <span className="text-lg font-bold text-emerald-600 mt-1 block">
                {totalCollected.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">المصروف الفعلي</span>
              <span className="text-lg font-bold text-rose-600 mt-1 block">
                {totalSpent.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
              </span>
            </div>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">المتبقي للتحصيل</span>
              <span className="text-lg font-bold text-amber-600 mt-1 block">
                {totalRemaining.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
              </span>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground block font-medium">حالة المشاريع</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs font-normal">
                  {activeProjectsCount} قيد التنفيذ
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-xs font-normal">
                  {completedProjectsCount} مكتمل
                </Badge>
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Bar: Search, Status Filter & View Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم المشروع أو الوصف..."
              className="pr-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              الكل ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'IN_PROGRESS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              قيد التنفيذ ({projects.filter((p) => p.status === 'IN_PROGRESS').length})
            </button>
            <button
              onClick={() => setStatusFilter('PLANNED')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'PLANNED' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              مخطط ({projects.filter((p) => p.status === 'PLANNED').length})
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              مكتمل ({projects.filter((p) => p.status === 'COMPLETED').length})
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => setViewMode('grid')}
              title="عرض كبطاقات"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 text-xs"
              onClick={() => setViewMode('table')}
              title="عرض كجدول"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mb-3" />
          <p className="text-sm text-muted-foreground">جاري تحميل بيانات المشاريع...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-blue-100/70 text-blue-700 rounded-full mb-3">
              <Building2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">لا توجد مشاريع مطابقة</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchQuery || statusFilter !== 'ALL'
                ? 'لم يتم العثور على أي نتائج وفقاً لمعايير التصفية الحالية.'
                : 'ابدأ بإنشاء أول مشروع صيانة أو تطوير للعمارة لتنظيم الميزانية ومساهمات السكان.'}
            </p>
            <Button
              onClick={() => {
                setEditingProject(null);
                setIsFormModalOpen(true);
              }}
              className="mt-4 gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              إضافة مشروع الآن
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onViewDetails={openDetails}
              onEdit={openEdit}
              onDelete={handleDeleteProject}
              onAddTransaction={openAddTransaction}
            />
          ))}
        </div>
      ) : (
        <Card className="border-slate-200 overflow-hidden shadow-2xs">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right text-xs">اسم المشروع</TableHead>
                <TableHead className="text-right text-xs">الميزانية</TableHead>
                <TableHead className="text-right text-xs">المحصل</TableHead>
                <TableHead className="text-right text-xs">المصروف</TableHead>
                <TableHead className="text-right text-xs">المتبقي للتحصيل</TableHead>
                <TableHead className="text-right text-xs">الرصيد / العجز</TableHead>
                <TableHead className="text-right text-xs">نسبة الإنجاز</TableHead>
                <TableHead className="text-right text-xs">الحالة</TableHead>
                <TableHead className="text-center text-xs">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow key={project.id} className="hover:bg-slate-50/70">
                  <TableCell className="font-semibold text-xs text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span>{project.name}</span>
                        {project.startDate && (
                          <span className="block text-2xs text-muted-foreground">
                            {new Date(project.startDate).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-xs">{project.budgetNum.toLocaleString()} ر.س</TableCell>
                  <TableCell className="font-bold text-xs text-emerald-600">{project.collected.toLocaleString()} ر.س</TableCell>
                  <TableCell className="font-bold text-xs text-rose-600">{project.spent.toLocaleString()} ر.س</TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {project.remainingToCollect > 0 ? `${project.remainingToCollect.toLocaleString()} ر.س` : '-'}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">
                    {project.deficit > 0 ? (
                      <span className="text-destructive font-bold">عجز: {project.deficit.toLocaleString()} ر.س</span>
                    ) : (
                      <span className="text-emerald-700">{project.remainingToSpend.toLocaleString()} ر.س</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, project.collectionPercentage)}%` }}
                        />
                      </div>
                      <span className="text-2xs font-bold text-slate-700">{Math.round(project.collectionPercentage)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={project.status === 'COMPLETED' ? 'default' : 'outline'}
                      className={
                        project.status === 'IN_PROGRESS'
                          ? 'bg-amber-500 text-white font-medium border-none'
                          : project.status === 'COMPLETED'
                          ? 'bg-emerald-600 text-white font-medium border-none'
                          : project.status === 'CANCELLED'
                          ? 'bg-rose-500 text-white font-medium border-none'
                          : 'text-slate-600 border-slate-300'
                      }
                    >
                      {project.status === 'IN_PROGRESS'
                        ? 'قيد التنفيذ'
                        : project.status === 'COMPLETED'
                        ? 'مكتمل'
                        : project.status === 'CANCELLED'
                        ? 'ملغى'
                        : 'مخطط'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => openAddTransaction(project, 'INCOME')}
                        title="تسجيل مساهمة"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-700 hover:bg-rose-50"
                        onClick={() => openAddTransaction(project, 'EXPENSE')}
                        title="تسجيل صرف"
                      >
                        <MinusCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                        onClick={() => openDetails(project)}
                        title="تفاصيل المشروع"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-amber-600 hover:bg-amber-50"
                        onClick={() => openEdit(project)}
                        title="تعديل"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-600 hover:bg-slate-100"
                        onClick={() => openPrint(project)}
                        title="طباعة الكشف"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteProject(project.id)}
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Form Modal (Create / Edit) */}
      <ProjectFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        project={editingProject}
        onSubmit={handleCreateOrUpdateProject}
        loading={actionLoading}
      />

      {/* Transaction Modal (Contribution Income / Project Expense) */}
      <ProjectTransactionModal
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        project={transactionProject}
        type={transactionType}
        apartments={apartments}
        onSubmit={handleRecordTransaction}
        loading={actionLoading}
      />

      {/* Project Details Breakdown Modal */}
      <ProjectDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        project={selectedProject}
        cashFundTransactions={cashFund}
        apartments={apartments}
        onAddTransaction={openAddTransaction}
        onPrint={openPrint}
      />

      {/* Project Print Statement View */}
      <ProjectPrintView
        open={isPrintModalOpen}
        onOpenChange={setIsPrintModalOpen}
        project={printProject}
        cashFundTransactions={cashFund}
        apartments={apartments}
      />
    </div>
  );
}
