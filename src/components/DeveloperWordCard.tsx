import React, { useState } from 'react';
import { 
  Heart, 
  Phone, 
  Mail, 
  MessageSquare, 
  Award, 
  Sparkles, 
  Code, 
  ShieldCheck, 
  ExternalLink,
  Send,
  Building,
  Quote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const DEVELOPER_INFO = {
  name: 'محمد محمود الهندي',
  nickname: 'أبو مصعب',
  title: 'مطور ومهندس النظام',
  phone: '+972594403737',
  whatsappUrl: 'https://wa.me/972594403737',
  email: 'mohammedalhendi1983@gmail.com',
  messageTitle: 'رسالة إخاء وتقدير لسكان العمارة الكرام',
  messageIntro: 'بسم الله الرحمن الرحيم، والصلاة والسلام على رسول الله الكريم..',
  messageBody: `إخواني وأخواتي، جيراني وأهلي الكرام سكان العمارة الأعزاء،

يسعدني أن أضع بين أيديكم هذا النظام التقني المتكامل لإدارة شؤون عمارتنا السكنية، والذي تم تصميمه وبناؤه بجهد ذاتي وإخلاص تام، بهدف رئيسي وهو خدمة هذا الصرح السكني المبارك وخدمة كل ساكن فيه.

لقد حرصنا في تطوير هذه المنصة على تطبيق أعلى معايير الشفافية والعدالة، لضمان:
1. توثيق كافة العمليات المالية بدقة تامة وبصندوق نقدي مفتوح وواضح أمام الجميع.
2. تسهيل وتنظيم توزيع خدمات المياه والضخ والصيانة الدورية بأعلى درجات الانضباط.
3. التيسير على كل ساكن لمتابعة استحقاقاته ورصيده وكشوفات حسابه بكل شفافية وسهولة من هاتفه.
4. تعزيز روح الأخوة والمودة والتعاون المشترك بين الجيران كجسد واحد متماسك.

إن نجاح واستدامة هذا النظام يعتمد في المقام الأول على تعاونكم الطيب والتزامكم المبارك، وباب الاقتراحات والملاحظات مفتوح دائماً من أجل التطوير المستمر.

سائلين المولى عز وجل أن يبارك في هذا البيت وساكنيه، وأن يديم بيننا المودة والسكينة وحسن الجوار.`,
  conclusion: 'أخوكم المخلص،\nمحمد محمود الهندي (أبو مصعب)'
};

export function DeveloperWordCard({ compact = false }: { compact?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  if (compact) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-amber-500/5 shadow-sm hover:shadow-md transition-all duration-300">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-foreground text-base">
                  {DEVELOPER_INFO.name} <span className="text-primary font-normal">({DEVELOPER_INFO.nickname})</span>
                </h4>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] py-0 px-2">
                  مطور النظام
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                كلمة تقدير وإخاء لسكان وأهالي العمارة الكرام
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="default" className="gap-1.5 text-xs font-semibold shadow-sm">
                  <Quote className="h-3.5 w-3.5" />
                  قراءة كلمة المبرمج للسكان
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DeveloperWordFullModalContent />
              </DialogContent>
            </Dialog>

            <a 
              href={DEVELOPER_INFO.whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="sm" variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                <MessageSquare className="h-3.5 w-3.5" />
                تواصل
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-background to-primary/5 shadow-md overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
      
      <CardHeader className="pb-3 border-b bg-muted/20">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">
              <Quote className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg sm:text-xl font-bold">
                  كلمة المبرمج لسكان العمارة الكرام
                </CardTitle>
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs gap-1 font-medium">
                  <Sparkles className="h-3 w-3" />
                  إهداء للسكان
                </Badge>
              </div>
              <CardDescription className="text-xs sm:text-sm mt-0.5">
                بقلم مبرمج ومطور المنصة: {DEVELOPER_INFO.name} «{DEVELOPER_INFO.nickname}»
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={DEVELOPER_INFO.whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                <MessageSquare className="h-3.5 w-3.5" />
                واتساب
              </Button>
            </a>
            <a href={`tel:${DEVELOPER_INFO.phone}`} className="inline-flex">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs text-blue-600 border-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-950/40">
                <Phone className="h-3.5 w-3.5" />
                اتصال
              </Button>
            </a>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-4">
        <div className="relative p-4 sm:p-5 rounded-xl bg-muted/40 border border-border/60 text-sm leading-relaxed text-foreground/90 font-medium">
          <p className="font-bold text-primary mb-2 text-base">
            {DEVELOPER_INFO.messageTitle}
          </p>
          <p className="text-muted-foreground text-xs italic mb-3">
            {DEVELOPER_INFO.messageIntro}
          </p>
          <div className="whitespace-pre-line space-y-2 text-justify">
            {DEVELOPER_INFO.messageBody}
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {DEVELOPER_INFO.conclusion}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
              خدمة لأهالي العمارة
            </span>
          </div>
        </div>

        {/* Developer Contact Quick Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-background/80 hover:bg-muted/30 transition-colors">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">رقم الهاتف / الواتساب</p>
              <p className="font-bold text-xs sm:text-sm text-foreground truncate" dir="ltr">
                {DEVELOPER_INFO.phone}
              </p>
            </div>
            <a 
              href={`tel:${DEVELOPER_INFO.phone}`}
              className="text-xs text-blue-600 hover:underline font-semibold shrink-0"
            >
              اتصال
            </a>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border bg-background/80 hover:bg-muted/30 transition-colors">
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-muted-foreground">البريد الإلكتروني</p>
              <p className="font-bold text-xs sm:text-sm text-foreground truncate" dir="ltr">
                {DEVELOPER_INFO.email}
              </p>
            </div>
            <a 
              href={`mailto:${DEVELOPER_INFO.email}`}
              className="text-xs text-rose-600 hover:underline font-semibold shrink-0"
            >
              إرسال
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DeveloperWordFullModalContent() {
  return (
    <div className="space-y-4 py-2">
      <DialogHeader className="text-right pb-3 border-b">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">
            <Quote className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {DEVELOPER_INFO.messageTitle}
            </DialogTitle>
            <DialogDescription className="text-sm mt-0.5">
              رسالة خاصة من المبرمج: <span className="font-semibold text-foreground">{DEVELOPER_INFO.name} «{DEVELOPER_INFO.nickname}»</span>
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="p-4 sm:p-5 rounded-xl bg-muted/40 border text-sm leading-relaxed text-foreground/90 whitespace-pre-line text-justify">
        <p className="text-muted-foreground text-xs italic mb-2">
          {DEVELOPER_INFO.messageIntro}
        </p>
        {DEVELOPER_INFO.messageBody}
        
        <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold">
          <span className="text-foreground">{DEVELOPER_INFO.conclusion}</span>
          <span className="text-primary flex items-center gap-1">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            نظام موثوق وشفاف
          </span>
        </div>
      </div>

      <div className="p-4 rounded-xl border bg-card space-y-3">
        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Code className="h-4 w-4 text-primary" />
          بطاقة التواصل مع المبرمج
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-muted-foreground block text-[11px]">الاسم الكامل:</span>
              <span className="font-bold text-foreground">{DEVELOPER_INFO.name} ({DEVELOPER_INFO.nickname})</span>
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-muted-foreground block text-[11px]">الصفة:</span>
              <span className="font-bold text-foreground">مهندس ومطور النظام</span>
            </div>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-muted-foreground block text-[11px]">الهاتف / الواتساب:</span>
              <span className="font-bold text-foreground" dir="ltr">{DEVELOPER_INFO.phone}</span>
            </div>
            <a 
              href={DEVELOPER_INFO.whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline font-bold"
            >
              واتساب
            </a>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
            <div>
              <span className="text-muted-foreground block text-[11px]">البريد الإلكتروني:</span>
              <span className="font-bold text-foreground truncate max-w-[150px] inline-block" dir="ltr">{DEVELOPER_INFO.email}</span>
            </div>
            <a 
              href={`mailto:${DEVELOPER_INFO.email}`} 
              className="text-rose-600 hover:underline font-bold"
            >
              مراسلة
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
