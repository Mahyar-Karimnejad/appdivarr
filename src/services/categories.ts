// سرویس API برای دسته‌بندی‌ها

import { Platform } from 'react-native';
import { getToken } from '../utils/storage';

// Base URL برای API
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'https://patoq.co/wp-json/patogh/v1';
  }
  return 'https://patoq.co/wp-json/patogh/v1';
};

// ==================== Types ====================

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: number | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at?: string;
  children?: Category[];
}

export interface GetCategoriesResponse {
  success: boolean;
  data?: Category[];
  message?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  image_url?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  image_url?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// ==================== API Functions ====================

/**
 * دریافت لیست دسته‌بندی‌ها
 */
export async function getCategories(
  parentId?: number | null,
  includeChildren: boolean = true
): Promise<GetCategoriesResponse> {
  try {
    const baseUrl = getBaseUrl();
    let url = `${baseUrl}/categories?include_children=${includeChildren ? '1' : '0'}`;
    
    if (parentId !== undefined && parentId !== null) {
      url += `&parent_id=${parentId}`;
    }
    
    console.log('📤 Fetching categories from:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }, 30000);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    // برای iOS/Android می‌توانیم header های cache را اضافه کنیم
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    // اضافه کردن timestamp برای cache-busting
    const urlWithCache = `${url}&_t=${Date.now()}`;
    
    let response: Response;
    try {
      response = await fetch(urlWithCache, {
        method: 'GET',
        headers,
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-store',
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw fetchError;
      }
      throw fetchError;
    }
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = {
            success: false,
            message: `خطای ${response.status}: ${response.statusText}`,
          };
        }
      } catch (parseError) {
        errorData = {
          success: false,
          message: `خطا: ${response.status} ${response.statusText}`,
        };
      }
      
      return {
        success: false,
        message: errorData.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    console.log('📦 Categories Response:', JSON.stringify(data, null, 2));
    
    // تابع recursive برای parse کردن category و children
    const parseCategory = (category: any): Category => {
      const parsed: Category = {
        ...category,
        id: parseInt(String(category.id), 10),
        parent_id: category.parent_id ? parseInt(String(category.parent_id), 10) : null,
        sort_order: parseInt(String(category.sort_order || '0'), 10),
        is_active: parseInt(String(category.is_active || '1'), 10),
      };
      
      // اگر children دارد، آن‌ها را هم parse کن
      if (category.children && Array.isArray(category.children) && category.children.length > 0) {
        parsed.children = category.children.map((child: any) => parseCategory(child));
      }
      
      return parsed;
    };
    
    // Parse و تبدیل string ها به number
    if (data.success && data.data && Array.isArray(data.data)) {
      data.data = data.data.map((category: any) => parseCategory(category));
      console.log('✅ Parsed categories:', JSON.stringify(data.data, null, 2));
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting categories:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'زمان اتصال به سرور به پایان رسید',
      };
    }
    
    return {
      success: false,
      message: 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.',
    };
  }
}

/**
 * دریافت یک دسته‌بندی خاص بر اساس ID
 */
export async function getCategoryById(categoryId: number): Promise<CategoryResponse> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/categories/${categoryId}`;
    
    console.log('📤 Fetching category by ID:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }, 30000);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    // اضافه کردن timestamp برای cache-busting
    const urlWithCache = `${url}?_t=${Date.now()}`;
    
    let response: Response;
    try {
      response = await fetch(urlWithCache, {
        method: 'GET',
        headers,
        signal: controller.signal,
        mode: 'cors',
        cache: 'no-store',
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw fetchError;
      }
      throw fetchError;
    }
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = {
            success: false,
            message: `خطای ${response.status}: ${response.statusText}`,
          };
        }
      } catch (parseError) {
        errorData = {
          success: false,
          message: `خطا: ${response.status} ${response.statusText}`,
        };
      }
      
      return {
        success: false,
        message: errorData.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    console.log('📦 Category Response:', data);
    
    // Parse و تبدیل string ها به number
    if (data.success && data.data) {
      data.data = {
        ...data.data,
        id: parseInt(String(data.data.id), 10),
        parent_id: data.data.parent_id ? parseInt(String(data.data.parent_id), 10) : null,
        sort_order: parseInt(String(data.data.sort_order || '0'), 10),
        is_active: parseInt(String(data.data.is_active || '1'), 10),
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting category:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'زمان اتصال به سرور به پایان رسید',
      };
    }
    
    return {
      success: false,
      message: 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.',
    };
  }
}

/**
 * دریافت لیست دسته‌بندی‌ها برای ادمین (شامل غیرفعال‌ها)
 */
export async function adminGetCategories(): Promise<GetCategoriesResponse> {
  try {
    const token = await getToken();
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/admin/categories`;
    
    console.log('📤 Fetching admin categories from:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    // اضافه کردن timestamp برای cache-busting
    const urlWithCache = `${url}?_t=${Date.now()}`;
    
    const response = await fetch(urlWithCache, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          errorData = {
            success: false,
            message: `خطای ${response.status}: ${response.statusText}`,
          };
        }
      } catch (parseError) {
        errorData = {
          success: false,
          message: `خطا: ${response.status} ${response.statusText}`,
        };
      }
      
      return {
        success: false,
        message: errorData.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    
    // Parse و تبدیل string ها به number
    if (data.success && data.data && Array.isArray(data.data)) {
      data.data = data.data.map((category: any) => ({
        ...category,
        id: parseInt(String(category.id), 10),
        parent_id: category.parent_id ? parseInt(String(category.parent_id), 10) : null,
        sort_order: parseInt(String(category.sort_order || '0'), 10),
        is_active: parseInt(String(category.is_active || '1'), 10),
      }));
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting admin categories:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'زمان اتصال به سرور به پایان رسید',
      };
    }
    
    return {
      success: false,
      message: 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.',
    };
  }
}

/**
 * ایجاد دسته‌بندی جدید (برای ادمین)
 */
export async function adminCreateCategory(
  category: CreateCategoryRequest
): Promise<CategoryResponse> {
  try {
    const token = await getToken();
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/admin/categories`;
    
    const body: any = {
      name: category.name,
    };

    if (category.description) body.description = category.description;
    if (category.image_url) body.image_url = category.image_url;
    if (category.parent_id !== undefined) body.parent_id = category.parent_id;
    if (category.sort_order !== undefined) body.sort_order = category.sort_order;
    if (category.is_active !== undefined) body.is_active = category.is_active;
    
    console.log('📤 Creating category:', url, body);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, read as text to see the error
      const text = await response.text();
      console.error('❌ Update error response (not JSON):', text);
      return {
        success: false,
        message: `خطا در بروزرسانی دسته‌بندی: ${response.status} - ${response.statusText}`,
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error creating category:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'زمان اتصال به سرور به پایان رسید',
      };
    }
    
    return {
      success: false,
      message: 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.',
    };
  }
}

/**
 * بروزرسانی دسته‌بندی (برای ادمین)
 */
export async function adminUpdateCategory(
  id: number,
  category: UpdateCategoryRequest
): Promise<CategoryResponse> {
  try {
    const token = await getToken();
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/admin/categories/${id}`;
    
    const body: any = {};

    // Always include all fields, even if undefined (send null or empty string)
    body.name = category.name !== undefined ? category.name : null;
    body.description = category.description !== undefined ? category.description : null;
    body.image_url = category.image_url !== undefined ? category.image_url : '';
    body.parent_id = category.parent_id !== undefined ? category.parent_id : null;
    body.sort_order = category.sort_order !== undefined ? category.sort_order : 0;
    body.is_active = category.is_active !== undefined ? category.is_active : true;
    
    console.log('📤 Updating category:', url, body);
    console.log('📤 Body JSON string:', JSON.stringify(body));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, read as text to see the error
      const text = await response.text();
      console.error('❌ Update error response (not JSON):', text);
      return {
        success: false,
        message: `خطا در بروزرسانی دسته‌بندی: ${response.status} - ${response.statusText}`,
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error updating category:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'زمان اتصال به سرور به پایان رسید',
      };
    }
    
    return {
      success: false,
      message: 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.',
    };
  }
}

/**
 * حذف دسته‌بندی (برای ادمین)
 */
export async function adminDeleteCategory(id: number): Promise<CategoryResponse> {
  try {
    const token = await getToken();
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/admin/categories/${id}`;
    
    console.log('📤 Deleting category:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, read as text to see the error
      const text = await response.text();
      console.error('❌ Update error response (not JSON):', text);
      return {
        success: false,
        message: `خطا در بروزرسانی دسته‌بندی: ${response.status} - ${response.statusText}`,
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error deleting category:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'زمان اتصال به سرور به پایان رسید',
      };
    }
    
    return {
      success: false,
      message: 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.',
    };
  }
}

