import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * دالة لترجمة وتنسيق مصدر الدين إلى مصطلح عربي واضح ومفهوم
 */
export function formatDebtSource(source?: string | null): string {
  if (!source) return 'بند مالي عام';
  const s = source.trim().toUpperCase();
  switch (s) {
    case 'WATER':
      return 'تعبئة مياه';
    case 'RENT':
      return 'عقد إيجار';
    case 'SERVICE':
    case 'SERVICES':
    case 'SUBSCRIPTION':
    case 'SUBSCRIPTIONS':
      return 'اشتراك خدمات';
    case 'PREVIOUS':
    case 'PRIOR_DEBT':
    case 'PREV':
      return 'استحقاق سابق';
    case 'PROJECT':
    case 'PROJECTS':
      return 'مساهمة مشروع';
    case 'MAINTENANCE':
      return 'صيانة دورية';
    case 'ELEVATOR':
      return 'مصعد كهربائي';
    case 'CLEANING':
      return 'نظافة عامة';
    case 'ELECTRICITY':
      return 'كهرباء وإنارة';
    case 'EXPENSE':
      return 'مصروف تشغيلي';
    case 'PAYMENT':
      return 'سداد دفعة';
    case 'INITIAL_BALANCE':
      return 'رصيد افتتاحي';
    case 'VISIT_GIFT':
    case 'GIFT':
      return 'واجب وزيارات';
    case 'OTHER':
      return 'بند إضافي / عام';
    default:
      return source;
  }
}

/**
 * دالة لترجمة وتنسيق مصدر المعاملة النقدية في الصندوق
 */
export function formatTransactionSource(source?: string | null): string {
  if (!source) return 'حركة مالية';
  const s = source.trim().toUpperCase();
  switch (s) {
    case 'PAYMENT':
      return 'تحصيل مقبوضات';
    case 'WATER':
      return 'تعبئة مياه';
    case 'PUMPING':
      return 'ضخ مياه عام';
    case 'EXPENSE':
      return 'مصروف تشغيلي';
    case 'INITIAL_BALANCE':
      return 'رصيد افتتاحي';
    case 'VISIT_GIFT':
    case 'GIFT':
      return 'زيارات وهدايا';
    case 'RENT':
      return 'تحصيل إيجار';
    case 'SUBSCRIPTION':
    case 'SERVICE':
      return 'اشتراك خدمات';
    case 'PROJECT':
      return 'مساهمة مشروع';
    case 'OTHER':
      return 'حركة عامة / إضافية';
    default:
      return source;
  }
}

/**
 * دالة لترجمة طريقة الدفع إلى العربية
 */
export function formatPaymentMethod(method?: string | null): string {
  if (!method) return 'نقدي';
  const m = method.trim().toUpperCase();
  switch (m) {
    case 'CASH':
      return 'نقدي';
    case 'BANK_TRANSFER':
    case 'BANK':
      return 'تحويل بنكي';
    case 'CHEQUE':
    case 'CHECK':
      return 'شيك بنكي';
    case 'CREDIT':
    case 'CREDIT_BALANCE':
      return 'رصيد دائن للساكن';
    case 'E_WALLET':
      return 'محفظة إلكترونية';
    default:
      return method;
  }
}

/**
 * دالة لترجمة حالة السجل أو العقد إلى العربية
 */
export function formatStatus(status?: string | null): string {
  if (!status) return 'غير محدد';
  const s = status.trim().toUpperCase();
  switch (s) {
    case 'PAID':
      return 'مسدد بالكامل';
    case 'PARTIALLY_PAID':
    case 'PARTIAL':
      return 'مسدد جزئياً';
    case 'OPEN':
    case 'PENDING':
      return 'مستحق / مفتوح';
    case 'ACTIVE':
      return 'ساري المفعول';
    case 'EXPIRED':
      return 'منتهي الصلاحية';
    case 'CANCELLED':
    case 'TERMINATED':
      return 'مفسوخ / ملغي';
    case 'APPROVED':
      return 'معتمد';
    case 'REJECTED':
      return 'مرفوض';
    case 'COMPLETED':
    case 'SUCCESS':
      return 'ناجح / مكتمل';
    default:
      return status;
  }
}

