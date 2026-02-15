// سرویس API احراز هویت

import { Platform } from 'react-native';
import { API_BASE_URL } from '../config/api';
import { getToken } from '../utils/storage';

// Base URL برای API
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'https://patoq.co/wp-json/patogh/v1';
  }
  return 'https://patoq.co/wp-json/patogh/v1';
};

/**
 * Helper function برای ارسال POST request
 * مطمئن می‌شه که method و body درست ارسال می‌شن
 */
async function postRequest(url: string, body: any, signal?: AbortSignal) {
  // ساخت body string با دقت
  let bodyString: string;
  
  try {
    bodyString = JSON.stringify(body);
    // تست کردن که آیا parse می‌شود
    const testParse = JSON.parse(bodyString);
    console.log('✅ Body stringify successful:', bodyString);
    console.log('✅ Body can be parsed back:', testParse);
  } catch (error) {
    console.error('❌ Error stringifying body:', error);
    throw new Error('خطا در ساخت body: ' + String(error));
  }
  
  console.log('═══════════════════════════════════════');
  console.log('📤 POST REQUEST DETAILS');
  console.log('═══════════════════════════════════════');
  console.log('📍 URL:', url);
  console.log('🔧 Method: POST');
  console.log('📦 Body Object:', body);
  console.log('📦 Body String:', bodyString);
  console.log('📦 Body Type:', typeof bodyString);
  console.log('📦 Body Length:', bodyString.length);
  console.log('🖥️  Platform:', Platform.OS);
  console.log('🌐 User Agent:', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A');
  
  // ساخت headers دقیقاً مثل Postman
  // در Postman وقتی raw JSON می‌فرستی، Content-Type باید application/json باشه
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
  };
  
  // اضافه کردن Origin header برای CORS (فقط برای web)
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    headers['Origin'] = window.location.origin;
  }
  
  console.log('📋 Request Headers:');
  Object.entries(headers).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  // مطمئن شدن از اینکه body یک string معتبر JSON است
  console.log('🔍 Body Check:');
  console.log('   Type:', typeof bodyString);
  console.log('   Length:', bodyString.length);
  console.log('   Is Valid JSON:', (() => {
    try {
      JSON.parse(bodyString);
      return true;
    } catch {
      return false;
    }
  })());
  console.log('   Body Preview (first 200 chars):', bodyString.substring(0, 200));
  
  // ساخت fetch options - مطمئن شدن از اینکه body دقیقاً مثل Postman ارسال میشه
  const fetchOptions: RequestInit = {
    method: 'POST',
    headers: headers,
    body: bodyString, // باید string JSON باشه دقیقاً مثل Postman raw JSON
    redirect: 'follow',
    // در React Native iOS، mode: 'cors' ممکن است مشکل ایجاد کند
    ...(Platform.OS === 'web' && { mode: 'cors' }), // فقط برای web
    cache: 'no-store',
    credentials: 'omit',
  };
  
  // برای iOS/Android، ممکن است نیاز باشد که body را به شکل دیگری ارسال کنیم
  // اما فعلاً با string JSON ادامه می‌دهیم
  
  if (signal) {
    fetchOptions.signal = signal;
  }
  
  console.log('⏳ Sending request...');
  console.log('⚙️  Fetch Options:', JSON.stringify(fetchOptions, null, 2));
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, fetchOptions);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('═══════════════════════════════════════');
    console.log('📥 RAW RESPONSE RECEIVED');
    console.log('═══════════════════════════════════════');
    console.log('⏱️  Duration:', duration + 'ms');
    console.log('📊 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);
    console.log('✅ OK:', response.ok);
    console.log('📋 Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });
    console.log('🔄 Redirected:', response.redirected);
    console.log('🔗 Response URL:', response.url);
    console.log('📦 Response Type:', response.type);
    
    return response;
  } catch (fetchError: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log('═══════════════════════════════════════');
    console.log('❌ FETCH ERROR');
    console.log('═══════════════════════════════════════');
    console.log('⏱️  Duration before error:', duration + 'ms');
    console.log('🚨 Error Name:', fetchError?.name);
    console.log('🚨 Error Message:', fetchError?.message);
    console.log('🚨 Error Stack:', fetchError?.stack);
    throw fetchError;
  }
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
  expires_in?: number;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    display_name: string;
    registered_date: string;
    role: string;
    is_admin: boolean;
  };
}

export interface User {
  id: number;
  email: string;
  display_name: string;
  registered_date: string;
  role: string;
  is_admin: boolean;
  phone_number?: string;
  profile_image?: string;
}

export interface GetUsersListResponse {
  success: boolean;
  data?: User[];
  pagination?: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
  message?: string;
}

/**
 * ارسال کد تأیید به ایمیل
 */
export async function sendVerificationCode(email: string): Promise<SendCodeResponse> {
  try {
    // حذف trailing slash از API_BASE_URL اگر وجود داشته باشه
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const url = `${baseUrl}/auth/send-code`;
    
    // ساخت body دقیقاً مطابق API spec
    const requestBody = {
      email: email
    };
    
    // اضافه کردن timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 ثانیه timeout

    // استفاده از helper function برای POST
    const response = await postRequest(url, requestBody, controller.signal);

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      let rawResponseText = '';
      
      try {
        // خواندن raw response قبل از parse
        const text = await response.text();
        rawResponseText = text;
        
        if (contentType && contentType.includes('application/json')) {
          errorData = JSON.parse(text);
        } else {
          // اگر response HTML باشه (مثل خطای 405)
          console.log('Error response (HTML):', text.substring(0, 200));
          errorData = { 
            message: `خطای ${response.status}: ${response.statusText}. لطفاً endpoint را بررسی کنید.`,
            raw_response: text.substring(0, 500)
          };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        errorData = { 
          message: `خطا: ${response.status} ${response.statusText}`,
          parse_error: String(parseError),
          raw_response: rawResponseText.substring(0, 500)
        };
      }
      
      return {
        success: false,
        message: errorData.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }

    // خواندن raw response قبل از parse
    const rawResponseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(rawResponseText);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      return {
        success: false,
        message: 'خطا در دریافت پاسخ از سرور',
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    
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
 * تأیید کد و ورود
 */
export async function verifyCode(
  email: string,
  code: string
): Promise<VerifyCodeResponse> {
  try {
    // حذف trailing slash از API_BASE_URL اگر وجود داشته باشه
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const url = `${baseUrl}/auth/verify-code`;
    
    // ساخت body دقیقاً مطابق API spec
    const requestBody = {
      email: email,
      code: code
    };
    
    // اضافه کردن timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 ثانیه timeout
    
    // استفاده از helper function برای POST
    const response = await postRequest(url, requestBody, controller.signal);

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      let rawResponseText = '';
      
      try {
        // خواندن raw response قبل از parse
        const text = await response.text();
        rawResponseText = text;
        
        if (contentType && contentType.includes('application/json')) {
          errorData = JSON.parse(text);
        } else {
          console.log('❌ Error response (HTML):', text.substring(0, 200));
          errorData = { 
            message: `خطای ${response.status}: ${response.statusText}`,
            raw_response: text.substring(0, 500)
          };
        }
      } catch (parseError) {
        console.error('❌ Error parsing response:', parseError);
        errorData = { 
          message: `خطا: ${response.status} ${response.statusText}`,
          parse_error: String(parseError),
          raw_response: rawResponseText.substring(0, 500)
        };
      }
      
      return {
        success: false,
        message: errorData.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }

    // خواندن raw response قبل از parse
    const rawResponseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(rawResponseText);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      return {
        success: false,
        message: 'خطا در دریافت پاسخ از سرور',
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error verifying code:', error);
    
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
 * دریافت اطلاعات کاربر جاری
 */
export async function getCurrentUser(token: string): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    const response = await fetch(`${API_BASE_URL}/me?_t=${Date.now()}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return {
      success: false,
      message: 'خطا در اتصال به سرور',
    };
  }
}

export interface UpdateProfileResponse {
  success: boolean;
  message?: string;
  user?: User;
}

/**
 * بروزرسانی پروفایل کاربر
 */
export async function updateProfile(
  firstName: string,
  lastName: string,
  phoneNumber?: string,
  profileImage?: string
): Promise<UpdateProfileResponse> {
  try {
    const token = await getToken();
    
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    // Get base URL
    const baseUrl = 'https://patoq.co/wp-json/patogh/v1';
    const url = `${baseUrl}/auth/profile`;

    const body: any = {
      display_name: `${firstName} ${lastName}`.trim(),
    };

    if (phoneNumber) {
      body.phone_number = phoneNumber;
    }

    if (profileImage) {
      body.profile_image = profileImage;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('📤 PUT Request URL:', url);
    console.log('📤 Request Headers:', headers);
    console.log('📤 Request Body:', JSON.stringify(body, null, 2));

    console.log('📤 PUT Request URL:', url);
    console.log('📤 Request Headers:', headers);
    console.log('📤 Request Body:', JSON.stringify(body, null, 2));

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
    console.log('📦 Profile update response data:', JSON.stringify(data, null, 2));
    console.log('📦 Data success:', data.success);
    console.log('📦 Data user:', data.user);
    return data;
  } catch (error: any) {
    console.error('❌ Error updating profile:', error);
    
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
 * دریافت لیست کاربران (فقط برای ادمین)
 */
export async function getUsersList(
  page: number = 1,
  perPage: number = 20,
  search?: string
): Promise<GetUsersListResponse> {
  try {
    const token = await getToken();
    
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    let url = `${baseUrl}/admin/users?page=${page}&per_page=${perPage}`;
    
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
    console.log('📦 Users Response:', JSON.stringify(data, null, 2));
    
    // Parse و تبدیل string ها به number
    if (data.success && data.data && Array.isArray(data.data)) {
      console.log('✅ Users count:', data.data.length);
      data.data = data.data.map((user: any) => {
        console.log('👤 User:', user.display_name, 'Phone:', user.phone_number);
        return {
          ...user,
          id: parseInt(String(user.id), 10),
          is_admin: user.is_admin ? (typeof user.is_admin === 'boolean' ? user.is_admin : parseInt(String(user.is_admin), 10) === 1) : false,
        };
      });
    }
    
    return data;
  } catch (error: any) {
    console.error('Error getting users list:', error);
    return {
      success: false,
      message: error?.message || 'خطا در دریافت لیست کاربران',
    };
  }
}

/**
 * خروج از حساب
 */
export async function logout(token: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };
    
    // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
    if (Platform.OS !== 'web') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      headers['Pragma'] = 'no-cache';
      headers['Expires'] = '0';
    }
    
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers,
      cache: 'no-store',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging out:', error);
    return {
      success: false,
      message: 'خطا در اتصال به سرور',
    };
  }
}

