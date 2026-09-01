import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Search, Calendar, MapPin, Users, Edit2, Trash2, Printer, CheckCircle } from 'lucide-react';
import { Meeting } from '@/types';

interface MeetingsTabProps {
  meetings: Meeting[];
  onAdd: () => void;
  onEdit: (meeting: Meeting) => void;
  onDelete: (id: number) => void;
  onPrint: (meeting: Meeting) => void;
}

export function MeetingsTab({
  meetings,
  onAdd,
  onEdit,
  onDelete,
  onPrint
}: MeetingsTabProps) {
  const [search, setSearch] = useState('');

  const filtered = meetings.filter((m) => {
    return (
      search === '' ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      (m.agenda && m.agenda.toLowerCase().includes(search.toLowerCase())) ||
      (m.decisions && m.decisions.toLowerCase().includes(search.toLowerCase())) ||
      (m.location && m.location.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-4">
      {/* Top filter and actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث في موضوع الاجتماع أو القرارات..."
              className="pr-9 h-9 text-xs"
            />
          </div>
        </div>

        <Button onClick={onAdd} className="h-9 gap-2 text-xs">
          <Plus className="w-4 h-4" />
          تدوين محضر اجتماع جديد
        </Button>
      </div>

      {/* Meetings List */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-emerald-100/70 text-emerald-700 rounded-full mb-3">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">لا توجد محاضر اجتماعات مسجلة</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              وثق اجتماعات اتحاد الملاك والجمعية العمومية، مع حفظ القرارات والتوصيات وجدول الأعمال.
            </p>
            <Button onClick={onAdd} className="mt-4 gap-2 text-xs">
              <Plus className="w-4 h-4" />
              تدوين أول محضر
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((meeting) => (
            <Card key={meeting.id} className="border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 leading-snug">
                        {meeting.title}
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-3 text-2xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {meeting.date ? new Date(meeting.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {meeting.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-slate-700 bg-white"
                      onClick={() => onPrint(meeting)}
                      title="طباعة محضر رسمي"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      طباعة المحضر
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                      onClick={() => onEdit(meeting)}
                      title="تعديل"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                      onClick={() => onDelete(meeting.id)}
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                {meeting.attendees && (
                  <div className="text-xs">
                    <span className="font-semibold text-slate-700 ml-1">الحضور والنصاب:</span>
                    <span className="text-slate-600">{meeting.attendees}</span>
                  </div>
                )}

                {meeting.agenda && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 block mb-1">جدول الأعمال:</span>
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{meeting.agenda}</p>
                  </div>
                )}

                {meeting.decisions && (
                  <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1 mb-1">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      القرارات والتوصيات الصادرة:
                    </span>
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed font-medium">{meeting.decisions}</p>
                  </div>
                )}

                {meeting.notes && (
                  <p className="text-2xs text-muted-foreground">
                    <span className="font-semibold ml-1">ملاحظات وتكليفات:</span>
                    {meeting.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
