// سرویس API برای آگهی‌ها

import { Platform } from 'react-native';
import { getToken, getUser } from '../utils/storage';

// Base URL برای API های غیر auth
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'https://patoq.co/wp-json/patogh/v1';
  }
  return 'https://patoq.co/wp-json/patogh/v1';
};

// Helper function برای GET requests
async function getRequest(url: string): Promise<Response> {
  const token = await getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
  if (Platform.OS !== 'web') {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    headers['Pragma'] = 'no-cache';
    headers['Expires'] = '0';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔑 Token found, adding to headers');
  } else {
    console.log('⚠️ No token found');
  }
  
  // اضافه کردن timestamp برای cache-busting
  const urlWithCache = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
  
  console.log('📤 GET Request URL:', urlWithCache);
  console.log('📋 Request Headers:', headers);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    const response = await fetch(urlWithCache, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('❌ Fetch error:', error);
    throw error;
  }
}

// ==================== Types ====================

export interface AdImage {
  image_url: string;
  alt_text: string;
}

export interface Ad {
  id: number;
  user_id: number;
  category_id: number;
  title: string;
  description: string;
  location: string;
  price: number;
  images_belong_to_property: number;
  video_url: string | null;
  room_count: string;
  build_year: string;
  land_area?: string; // متراژ زمین
  has_parking: string;
  has_storage: string;
  has_elevator: string;
  other_features: string;
  status: 'pending' | 'approved' | 'rejected';
  category_name: string;
  user_name?: string; // ممکنه در response نباشه
  user_phone?: string; // شماره تماس آگهی‌گذار
  user_email?: string; // ایمیل آگهی‌گذار
  images: AdImage[];
  views_count: number;
  is_featured?: number;
  admin_notes?: string;
  expires_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface GetAdsListResponse {
  success: boolean;
  data?: Ad[];
  pagination?: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
  message?: string;
}

export interface UpdateAdStatusResponse {
  success: boolean;
  message?: string;
}

export interface ToggleFeaturedResponse {
  success: boolean;
  message?: string;
  data?: {
    is_featured: number;
  };
}

export interface ExpertRequestResponse {
  success: boolean;
  message?: string;
}

// ==================== API Functions ====================

/**
 * دریافت لیست آگهی‌ها بر اساس status
 * استفاده از endpoint ادمین /admin/ads که نیاز به authentication دارد
 */
export async function getAdsByStatus(
  status: 'pending' | 'approved' | 'rejected',
  page: number = 1,
  perPage: number = 20,
  categoryId?: number,
  search?: string
): Promise<GetAdsListResponse> {
  try {
    const token = await getToken();
    
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    // استفاده از endpoint ادمین /admin/ads
    let url = `${baseUrl}/admin/ads?status=${status}&page=${page}&per_page=${perPage}`;
    
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    console.log('📤 Fetching ads from:', url);
    console.log('📤 Status:', status);
    console.log('📤 Page:', page, 'Per Page:', perPage);
    console.log('📤 Category ID:', categoryId);
    console.log('📤 Search:', search);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    // فقط برای authentication از Authorization header استفاده می‌کنیم
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // اضافه کردن timestamp برای cache-busting
    const urlWithCache = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
    
    const response = await fetch(urlWithCache, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
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
    console.log('📦 Raw API Response:', JSON.stringify(data, null, 2));
    
    // Parse و تبدیل string ها به number
    if (data.success && data.data && Array.isArray(data.data)) {
      data.data = data.data.map((ad: any) => {
        const parsedAd = {
          ...ad,
          id: parseInt(String(ad.id), 10),
          user_id: parseInt(String(ad.user_id), 10),
          category_id: parseInt(String(ad.category_id), 10),
          price: parseInt(String(ad.price), 10),
          images_belong_to_property: parseInt(String(ad.images_belong_to_property || '0'), 10),
          views_count: parseInt(String(ad.views_count || '0'), 10),
          is_featured: ad.is_featured ? parseInt(String(ad.is_featured), 10) : 0,
          images: ad.images || [],
          user_name: ad.user_name || undefined,
        };
        return parsedAd;
      });
      console.log('✅ Parsed Ads:', data.data.length, 'ads');
      console.log('✅ First Ad Sample:', JSON.stringify(data.data[0], null, 2));
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting ads by status:', error);
    
    if (error.name === 'AbortError' || error.message === 'Request timeout') {
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
 * دریافت آگهی‌های کاربر فعلی
 * استفاده از endpoint /my-ads که نیاز به authentication دارد
 */
export async function getMyAds(
  status?: 'pending' | 'approved' | 'rejected',
  page: number = 1,
  perPage: number = 20,
  search?: string
): Promise<GetAdsListResponse> {
  try {
    const token = await getToken();
    
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    let url = `${baseUrl}/ads/my-ads?page=${page}&per_page=${perPage}`;
    
    if (status) {
      url += `&status=${status}`;
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
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
      data.data = data.data.map((ad: any) => {
        const parsedAd = {
          ...ad,
          id: parseInt(String(ad.id), 10),
          user_id: parseInt(String(ad.user_id), 10),
          category_id: parseInt(String(ad.category_id), 10),
          price: parseInt(String(ad.price), 10),
          images_belong_to_property: parseInt(String(ad.images_belong_to_property || '0'), 10),
          views_count: parseInt(String(ad.views_count || '0'), 10),
          is_featured: ad.is_featured ? parseInt(String(ad.is_featured), 10) : 0,
          images: ad.images || [],
          user_name: ad.user_name || undefined,
        };
        return parsedAd;
      });
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting my ads:', error);
    return {
      success: false,
      message: error?.message || 'خطا در دریافت آگهی‌های شما',
    };
  }
}

/**
 * دریافت لیست آگهی‌های عمومی (برای کاربران عادی)
 * استفاده از endpoint عمومی /ads که نیاز به authentication ندارد
 */
export async function getPublicAds(
  status: 'approved' | 'pending' | 'rejected' = 'approved',
  page: number = 1,
  perPage: number = 20,
  categoryId?: number,
  search?: string,
  isFeatured?: boolean,
  location?: string
): Promise<GetAdsListResponse> {
  try {
    const baseUrl = getBaseUrl();
    let url = `${baseUrl}/ads?status=${status}&page=${page}&per_page=${perPage}`;
    
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    if (isFeatured !== undefined) {
      url += `&is_featured=${isFeatured ? '1' : '0'}`;
    }
    
    if (location) {
      url += `&location=${encodeURIComponent(location)}`;
    }
    
    console.log('📤 Fetching public ads from:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: 'cors',
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
    console.log('📦 Public Ads Response:', data);
    
    // Parse و تبدیل string ها به number
    if (data.success && data.data && Array.isArray(data.data)) {
      data.data = data.data.map((ad: any) => {
        const parsedAd = {
          ...ad,
          id: parseInt(String(ad.id), 10),
          user_id: parseInt(String(ad.user_id), 10),
          category_id: parseInt(String(ad.category_id), 10),
          price: parseInt(String(ad.price), 10),
          images_belong_to_property: parseInt(String(ad.images_belong_to_property || '0'), 10),
          views_count: parseInt(String(ad.views_count || '0'), 10),
          is_featured: ad.is_featured ? parseInt(String(ad.is_featured), 10) : 0,
          images: ad.images || [],
          user_name: ad.user_name || undefined,
        };
        return parsedAd;
      });
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting public ads:', error);
    
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
 * تغییر وضعیت آگهی توسط ادمین (تأیید یا رد)
 */
export async function updateAdStatus(
  adId: number,
  status: 'approved' | 'rejected',
  adminNotes?: string
): Promise<UpdateAdStatusResponse> {
  try {
    const token = await getToken();
    
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/admin/ads/${adId}/status`;
    
    console.log('📤 Updating ad status:', url);
    console.log('📤 Ad ID:', adId);
    console.log('📤 New Status:', status);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const body: any = {
      status,
    };
    
    if (adminNotes) {
      // اگر status rejected است، rejection_reason را ارسال می‌کنیم
      if (status === 'rejected') {
        body.rejection_reason = adminNotes;
      } else {
        body.admin_notes = adminNotes;
      }
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    // فقط برای authentication از Authorization header استفاده می‌کنیم
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
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
    console.log('📡 Response ok:', response.ok);
    
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
    console.log('📦 Update Status Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error: any) {
    console.error('Error updating ad status:', error);
    
    if (error.name === 'AbortError' || error.message === 'Request timeout') {
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
 * تغییر وضعیت ویژه آگهی توسط ادمین
 */
export async function toggleAdFeatured(
  adId: number,
  isFeatured: boolean
): Promise<ToggleFeaturedResponse> {
  try {
    const token = await getToken();
    
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/admin/ads/${adId}/featured`;
    
    console.log('📤 Toggling ad featured status:', url);
    console.log('📤 Ad ID:', adId);
    console.log('📤 Is Featured:', isFeatured);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const body = {
      is_featured: isFeatured,
    };
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
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
    console.log('📦 Toggle Featured Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error: any) {
    console.error('Error toggling ad featured status:', error);
    
    if (error.name === 'AbortError' || error.message === 'Request timeout') {
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
 * ثبت درخواست کارشناسی برای یک آگهی
 * نیاز به احراز هویت (توکن) دارد
 */
export async function requestExpertReview(
  adId: number,
  note?: string
): Promise<ExpertRequestResponse> {
  try {
    const token = await getToken();

    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/expert-requests`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const body: any = {
      ad_id: adId,
    };

    if (note && note.trim()) {
      body.note = note.trim();
    }

    console.log('📤 Creating expert review request:', url);
    console.log('📤 Ad ID:', adId);
    console.log('📤 Token exists:', !!token);
    console.log('📤 Request body:', JSON.stringify(body, null, 2));

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    console.log('📡 Expert request status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('📡 Response URL:', response.url);

    if (!response.ok) {
      let errorData: { message?: string };
      const contentType = response.headers.get('content-type');
      console.log('📡 Response content-type:', contentType);

      try {
        const text = await response.text();
        console.log('📡 Response body (first 500 chars):', text.slice(0, 500));
        if (contentType && contentType.includes('application/json')) {
          try {
            errorData = JSON.parse(text);
          } catch {
            errorData = { message: `خطای سرور (${response.status}). پاسخ: ${text.slice(0, 200)}` };
          }
        } else {
          console.error('📥 Non-JSON expert request error:', text);
          const short = text.slice(0, 300).replace(/\s+/g, ' ').trim();
          errorData = {
            message: response.status === 500
              ? `خطای سرور (۵۰۰). در صورت فعال بودن WP_DEBUG، جزئیات در کنسول نمایش داده شده است.`
              : `خطای ${response.status}: ${response.statusText}`,
          };
          if (short && response.status === 500) {
            console.error('📥 Server response body:', short);
          }
        }
      } catch (parseError) {
        console.error('📥 Parse error in expert request:', parseError);
        errorData = { message: `خطا: ${response.status} ${response.statusText}` };
      }

      const message =
        response.status === 404
          ? (errorData.message || 'مسیر API یافت نشد. لطفاً از به‌روز بودن پلاگین روی سرور (patoq.co) اطمینان حاصل کنید.')
          : (errorData.message || `خطا: ${response.status} - ${response.statusText}`);

      return {
        success: false,
        message,
      };
    }

    const data = await response.json();
    console.log('📦 Expert Request Response:', JSON.stringify(data, null, 2));

    return data;
  } catch (error: any) {
    console.error('Error creating expert review request:', error);

    if (error.name === 'AbortError' || error.message === 'Request timeout') {
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

export interface CreateAdRequest {
  category_id: number;
  title: string;
  description: string;
  location: string;
  price: number;
  images_belong_to_property?: boolean;
  video_url?: string | null;
  room_count?: string | null;
  build_year?: string | null;
  has_parking?: string | null;
  has_storage?: string | null;
  has_elevator?: string | null;
  other_features?: string;
  image_urls?: Array<string | { url: string; alt_text?: string }>;
}

export interface CreateAdResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    status: string;
    expires_at: string;
  };
}

export interface GetAdDetailResponse {
  success: boolean;
  data?: Ad;
  message?: string;
}

/**
 * ایجاد آگهی جدید
 */
export async function createAd(adData: CreateAdRequest): Promise<CreateAdResponse> {
  try {
    console.log('🚀 createAd function called');
    const token = await getToken();
    
    if (!token) {
      console.error('❌ No token found');
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/ads`;
    
    console.log('📤 Creating ad:', url);
    console.log('📤 Ad data:', JSON.stringify(adData, null, 2));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds for image uploads
    
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
    
    console.log('📤 Request headers:', headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(adData),
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          console.error('📥 JSON error response:', errorData);
        } else {
          const text = await response.text();
          console.error('📥 Non-JSON error response:', text);
          errorData = {
            success: false,
            message: `خطای ${response.status}: ${response.statusText}`,
          };
        }
      } catch (parseError) {
        console.error('📥 Parse error:', parseError);
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
    console.log('📦 Create Ad Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error: any) {
    console.error('❌ Error creating ad:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    
    if (error.name === 'AbortError' || error.message === 'Request timeout') {
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
 * دریافت جزئیات یک آگهی بر اساس ID
 */
export async function getAdById(adId: number): Promise<GetAdDetailResponse> {
  try {
    const token = await getToken();
    const user = await getUser();
    
    const baseUrl = getBaseUrl();
    // اگر کاربر ادمین است، از endpoint ادمین استفاده کن، وگرنه از endpoint عمومی
    const isAdmin = user?.is_admin || false;
    const url = isAdmin 
      ? `${baseUrl}/admin/ads/${adId}`
      : `${baseUrl}/ads/${adId}`;
    
    console.log('📤 Fetching ad detail from:', url);
    console.log('📤 Ad ID:', adId);
    console.log('📤 User is admin:', isAdmin);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // فقط برای endpoint ادمین نیاز به token داریم
    if (isAdmin && token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (token) {
      // برای endpoint عمومی هم token را ارسال می‌کنیم (اختیاری)
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      mode: 'cors',
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
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
    console.log('📦 Ad Detail Response:', JSON.stringify(data, null, 2));
    
    // Parse و تبدیل string ها به number
    if (data.success && data.data) {
      const ad = data.data;
      data.data = {
        ...ad,
        id: parseInt(String(ad.id), 10),
        user_id: parseInt(String(ad.user_id), 10),
        category_id: parseInt(String(ad.category_id), 10),
        price: parseInt(String(ad.price), 10),
        images_belong_to_property: parseInt(String(ad.images_belong_to_property || '0'), 10),
        views_count: parseInt(String(ad.views_count || '0'), 10),
        is_featured: ad.is_featured ? parseInt(String(ad.is_featured), 10) : 0,
        images: ad.images || [],
        user_name: ad.user_name || undefined,
        user_phone: ad.user_phone || undefined,
        user_email: ad.user_email || undefined,
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting ad detail:', error);
    
    if (error.name === 'AbortError' || error.message === 'Request timeout') {
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

