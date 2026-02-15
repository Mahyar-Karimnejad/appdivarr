// سرویس API برای شهرها

import { Platform } from 'react-native';

// Base URL برای API
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'https://patoq.co/wp-json/patogh/v1';
  }
  return 'https://patoq.co/wp-json/patogh/v1';
};

// ==================== Types ====================

export interface City {
  id: number;
  name: string;
  name_en: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at?: string;
}

export interface GetCitiesResponse {
  success: boolean;
  data?: City[];
  message?: string;
}

// ==================== API Functions ====================

/**
 * دریافت لیست شهرها
 */
export async function getCities(): Promise<GetCitiesResponse> {
  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/cities`;
    
    console.log('📤 Fetching cities from:', url);
    
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
    console.log('📦 Cities Response:', JSON.stringify(data, null, 2));
    
    // Parse و تبدیل string ها به number
    if (data.success && data.data && Array.isArray(data.data)) {
      data.data = data.data.map((city: any) => ({
        ...city,
        id: parseInt(String(city.id), 10),
        sort_order: parseInt(String(city.sort_order || '0'), 10),
        is_active: parseInt(String(city.is_active || '1'), 10),
      }));
      console.log('✅ Parsed cities:', JSON.stringify(data.data, null, 2));
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting cities:', error);
    
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

