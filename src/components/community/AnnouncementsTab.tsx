import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Megaphone, Plus, Search, Calendar, Users, Eye, Edit2, Trash2, Printer, Pin } from 'lucide-react';
import { Announcement } from '@/types';

interface AnnouncementsTabProps {
  announcements: Announcement[];
  onAdd: () => void;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: number) => void;
  onPrint: (announcement: Announcement) => void;
}

export function AnnouncementsTab({
  announcements,
  onAdd,
  onEdit,
  onDelete,
  onPrint
}: AnnouncementsTabProps) {
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'ALL' | 'OWNERS' | 'TENANTS'>('ALL');

  const filtered = announcements.filter((a) => {
    const matchAudience = audienceFilter === 'ALL' || a.audience === audienceFilter || a.audience === 'ALL';
    const matchSearch =
      search === '' ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    return matchAudience && matchSearch;
  });

  const getAudienceBadge = (aud: string) => {
    switch (aud) {
      case 'OWNERS':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs font-normal">الملاك فقط</Badge>;
      case 'TENANTS':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs font-normal">المستأجرين فقط</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs font-normal">كافة السكان</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث في نص أو عنوان الإعلانات والتعميمات..."
              className="pr-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setAudienceFilter('ALL')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${audienceFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              الجميع
            </button>
            <button
              onClick={() => setAudienceFilter('OWNERS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${audienceFilter === 'OWNERS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              الملاك
            </button>
            <button
              onClick={() => setAudienceFilter('TENANTS')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${audienceFilter === 'TENANTS' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              المستأجرين
            </button>
          </div>

          <Button onClick={onAdd} className="gap-2 h-9 text-xs">
            <Plus className="w-4 h-4" />
            إعلان جديد
          </Button>
        </div>
      </div>

      {/* Announcements Feed */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-blue-100/70 text-blue-700 rounded-full mb-3">
              <Megaphone className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">لا توجد إعلانات أو تعميمات مطابقة</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              يمكنك نشر تعميمات فورية أو تنبيهات أعمال صيانة لمشاركتها مع جميع سكان البناية.
            </p>
            <Button onClick={onAdd} className="mt-4 gap-2 text-xs">
              <Plus className="w-4 h-4" />
              نشر تعميم الآن
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900 leading-snug">
                          {item.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date ? new Date(item.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getAudienceBadge(item.audience)}
                  </div>
                </CardHeader>

                <CardContent className="pt-3">
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {item.content}
                  </p>
                  {item.attachmentUrl && (
                    <div className="mt-3 text-2xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100 truncate">
                      مرفق: <a href={item.attachmentUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">{item.attachmentUrl}</a>
                    </div>
                  )}
                </CardContent>
              </div>

              <div className="p-3 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between">
                <span className="text-2xs text-muted-foreground">
                  الحالة: {item.status === 'PUBLISHED' ? '🟢 منشور' : item.status === 'DRAFT' ? '🟡 مسودة' : '⚪ مؤرشف'}
                </span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs text-slate-700 hover:bg-slate-100 gap-1"
                    onClick={() => onPrint(item)}
                    title="طباعة التعميم للإلصاق"
                  >
                    <Printer className="w-3 h-3" />
                    طباعة
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-amber-600 hover:bg-amber-50"
                    onClick={() => onEdit(item)}
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-rose-600 hover:bg-rose-50"
                    onClick={() => onDelete(item.id)}
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
