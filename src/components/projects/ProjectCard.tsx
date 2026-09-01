import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, Coins, ArrowUpRight, ArrowDownLeft, Eye, Edit2, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { ProjectMetrics } from '@/types';

interface ProjectCardProps {
  project: ProjectMetrics;
  onViewDetails: (project: ProjectMetrics) => void;
  onEdit: (project: ProjectMetrics) => void;
  onDelete: (id: number) => void;
  onAddTransaction: (project: ProjectMetrics, type: 'INCOME' | 'EXPENSE') => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onEdit,
  onDelete,
  onAddTransaction
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium">قيد التنفيذ</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">مكتمل</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">ملغى</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-600 border-slate-300">مخطط</Badge>;
    }
  };

  const formattedDate = project.startDate
    ? new Date(project.startDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'غير محدد';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200 border-slate-200 flex flex-col justify-between overflow-hidden">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-100/70 text-blue-700 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800 leading-tight">
                  {project.name}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>البدء: {formattedDate}</span>
                </div>
              </div>
            </div>
            {getStatusBadge(project.status)}
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {project.description && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">الميزانية التقديرية</span>
              <span className="font-bold text-slate-800">{project.budgetNum.toLocaleString()} ر.س</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">المحصّل من المساهمات</span>
              <span className="font-bold text-emerald-600">{project.collected.toLocaleString()} ر.س</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">المصروف الفعلي</span>
              <span className="font-bold text-rose-600">{project.spent.toLocaleString()} ر.س</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">
                {project.deficit > 0 ? 'العجز المالي' : 'المتبقي للتحصيل'}
              </span>
              <span className={`font-bold ${project.deficit > 0 ? 'text-destructive' : 'text-slate-700'}`}>
                {project.deficit > 0 ? `${project.deficit.toLocaleString()} ر.س` : `${project.remainingToCollect.toLocaleString()} ر.س`}
              </span>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">نسبة التحصيل</span>
                <span className="font-bold text-emerald-700">{Math.round(project.collectionPercentage)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, project.collectionPercentage)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-medium">نسبة الإنفاق من المحصّل</span>
                <span className="font-bold text-blue-700">{Math.round(project.progressPercentage)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, project.progressPercentage)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-2 pb-3 px-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 border-emerald-200"
            onClick={() => onAddTransaction(project, 'INCOME')}
            title="تسجيل مساهمة شقة"
          >
            <PlusCircle className="w-3.5 h-3.5 ml-1" />
            مساهمة
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 border-rose-200"
            onClick={() => onAddTransaction(project, 'EXPENSE')}
            title="تسجيل مصروف للمشروع"
          >
            <MinusCircle className="w-3.5 h-3.5 ml-1" />
            صرف
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 hover:text-blue-600"
            onClick={() => onViewDetails(project)}
            title="التفاصيل والسجلات"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 hover:text-amber-600"
            onClick={() => onEdit(project)}
            title="تعديل المشروع"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-600 hover:text-rose-600"
            onClick={() => onDelete(project.id)}
            title="حذف المشروع"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
