// توابع کمکی پروژه

/**
 * فرمت کردن تاریخ به فارسی
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fa-IR').format(date);
};

/**
 * تاخیر در اجرا (برای تست و شبیه‌سازی)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * بررسی خالی بودن رشته
 */
export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

/**
 * تولید ID تصادفی
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
