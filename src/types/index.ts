// انواع داده‌های مشترک پروژه

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// سایر type ها و interface ها اینجا تعریف می‌شوند
