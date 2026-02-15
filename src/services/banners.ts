// سرویس API برای مدیریت بنرها

import { Platform } from 'react-native';
import { getToken } from '../utils/storage';
import { API_BASE_URL } from '../config/api';

// ==================== Types ====================

export interface Banner {
  id: number;
  user_id: number;
  user_name?: string;
  user_email: string;
  image_url: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

export interface UploadBannerResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    image_url: string;
    status: string;
  };
}

export interface GetBannersListResponse {
  success: boolean;
  message?: string;
  data?: Banner[];
  pagination?: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface UpdateBannerStatusResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    status: string;
  };
}

export interface GetUserApprovedBannersResponse {
  success: boolean;
  message?: string;
  data?: Banner[];
}

// ==================== API Functions ====================

/**
 * آپلود بنر تبلیغاتی
 */
export async function uploadBanner(
  imageUri: string
): Promise<UploadBannerResponse> {
  try {
    const token = await getToken();
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = API_BASE_URL;
    const url = `${baseUrl}/banners`;

    console.log('📤 Uploading banner to:', url);

    const formData = new FormData();

    // Handle data URI or file path
    if (imageUri.startsWith('data:')) {
      const matches = imageUri.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return {
          success: false,
          message: 'فرمت تصویر نامعتبر است',
        };
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      let extension = 'jpg';
      if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('gif')) extension = 'gif';
      else if (mimeType.includes('webp')) extension = 'webp';

      const fileName = `banner_${Date.now()}.${extension}`;

      if (Platform.OS === 'web') {
        try {
          const byteString = atob(base64Data);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeType });
          const file = new File([blob], fileName, { type: mimeType });
          formData.append('file', file);
        } catch (error) {
          console.error('❌ Error creating blob:', error);
          return {
            success: false,
            message: 'خطا در آماده‌سازی تصویر برای آپلود',
          };
        }
      } else {
        formData.append('file', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
        } as any);
      }
    } else {
      // If imageUri is a file path
      if (Platform.OS === 'web') {
        // For web, we need to fetch the file and convert it
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const fileName = `banner_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`;
          const file = new File([blob], fileName, { type: blob.type });
          formData.append('file', file);
        } catch (error) {
          console.error('❌ Error fetching image:', error);
          return {
            success: false,
            message: 'خطا در خواندن فایل تصویر',
          };
        }
      } else {
        const fileName = imageUri.split('/').pop() || `banner_${Date.now()}.jpg`;
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: fileName,
        } as any);
      }
    }

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
      method: 'POST',
      headers,
      body: formData,
      mode: 'cors',
      cache: 'no-store',
      credentials: 'include',
    });

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
        console.error('❌ Error parsing error response:', parseError);
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
    return data;
  } catch (error: any) {
    console.error('Error uploading banner:', error);
    return {
      success: false,
      message: error?.message || 'خطا در آپلود بنر',
    };
  }
}

/**
 * دریافت لیست بنرها (فقط برای ادمین)
 */
export async function getBannersList(
  page: number = 1,
  perPage: number = 20,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<GetBannersListResponse> {
  try {
    const token = await getToken();

    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = API_BASE_URL;
    let url = `${baseUrl}/admin/banners?page=${page}&per_page=${perPage}`;

    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }

    // اضافه کردن timestamp برای cache-busting
    const urlWithCache = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;

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

    const response = await fetch(urlWithCache, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
      credentials: 'include',
    });

    clearTimeout(timeoutId);

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
      data.data = data.data.map((banner: any) => ({
        ...banner,
        id: parseInt(String(banner.id), 10),
        user_id: parseInt(String(banner.user_id), 10),
      }));
    }

    return data;
  } catch (error: any) {
    console.error('Error getting banners list:', error);
    return {
      success: false,
      message: error?.message || 'خطا در دریافت لیست بنرها',
    };
  }
}

/**
 * به‌روزرسانی وضعیت بنر (تایید/رد) - فقط برای ادمین
 */
export async function updateBannerStatus(
  bannerId: number,
  status: 'approved' | 'rejected',
  adminNotes?: string
): Promise<UpdateBannerStatusResponse> {
  try {
    const token = await getToken();

    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = API_BASE_URL;
    const url = `${baseUrl}/admin/banners/${bannerId}/status`;

    console.log('📤 Updating banner status:', { url, bannerId, status });

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }

    const body: any = {
      status,
    };

    if (adminNotes) {
      body.admin_notes = adminNotes;
    }

    console.log('📤 Request body:', JSON.stringify(body));

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      mode: 'cors',
      cache: 'no-store',
      credentials: 'include',
    });

    console.log('📥 Response status:', response.status, response.statusText);

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
    return data;
  } catch (error: any) {
    console.error('Error updating banner status:', error);
    return {
      success: false,
      message: error?.message || 'خطا در به‌روزرسانی وضعیت بنر',
    };
  }
}

/**
 * دریافت بنرهای تایید شده کاربر فعلی
 */
export async function getUserApprovedBanners(): Promise<GetUserApprovedBannersResponse> {
  try {
    const token = await getToken();

    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = API_BASE_URL;
    const url = `${baseUrl}/banners/my-approved`;

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
      method: 'GET',
      headers,
      mode: 'cors',
      cache: 'no-store',
      credentials: 'include',
    });

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
      data.data = data.data.map((banner: any) => ({
        ...banner,
        id: parseInt(String(banner.id), 10),
        user_id: parseInt(String(banner.user_id), 10),
      }));
    }

    return data;
  } catch (error: any) {
    console.error('Error getting user approved banners:', error);
    return {
      success: false,
      message: error?.message || 'خطا در دریافت بنرهای تایید شده',
    };
  }
}

