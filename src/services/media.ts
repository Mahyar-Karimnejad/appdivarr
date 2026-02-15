// سرویس API برای آپلود رسانه

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

export interface UploadImageResponse {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    url: string;
    sizes?: {
      thumbnail?: string;
      medium?: string;
      large?: string;
      full?: string;
    };
    alt_text?: string;
    file_size?: number;
    mime_type?: string;
  };
}

// ==================== Helper Functions ====================

/**
 * تبدیل base64 یا data URI به Blob (برای web)
 */
function dataURItoBlob(dataURI: string): Blob {
  // جدا کردن mime type و base64 data
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  
  // تبدیل به ArrayBuffer
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: mimeString });
}

/**
 * تبدیل base64 به File (برای mobile)
 */
function base64ToFile(base64: string, fileName: string): File | Blob {
  if (Platform.OS === 'web') {
    return dataURItoBlob(base64);
  }
  
  // برای mobile، باید به FormData تبدیل شود
  // اینجا فقط dataURI را برمی‌گردانیم و سرور باید آن را parse کند
  return dataURItoBlob(base64);
}

// ==================== API Functions ====================

/**
 * آپلود یک تصویر
 */
export async function uploadImage(
  imageUri: string,
  altText?: string
): Promise<UploadImageResponse> {
  try {
    const token = await getToken();
    if (!token) {
      return {
        success: false,
        message: 'لطفاً ابتدا وارد حساب کاربری خود شوید',
      };
    }

    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/media/upload-image`;
    
    console.log('📤 Uploading image to:', url);
    
    // برای web: استفاده از FormData با Blob
    // برای mobile: استفاده از FormData با base64 (در صورت نیاز)
    const formData = new FormData();
    
    // اگر imageUri یک data URI است (شروع با data:)
    if (imageUri.startsWith('data:')) {
      // استخراج mime type و data
      const matches = imageUri.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return {
          success: false,
          message: 'فرمت تصویر نامعتبر است',
        };
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // تعیین extension بر اساس mime type
      let extension = 'jpg';
      if (mimeType.includes('png')) extension = 'png';
      else if (mimeType.includes('gif')) extension = 'gif';
      else if (mimeType.includes('webp')) extension = 'webp';
      
      const fileName = `image_${Date.now()}.${extension}`;
      
      // برای web: تبدیل به Blob و اضافه به FormData
      if (Platform.OS === 'web') {
        try {
          const blob = dataURItoBlob(imageUri);
          // برای web، باید File object بسازیم
          const file = new File([blob], fileName, { type: mimeType });
          formData.append('file', file);
          console.log('📤 File prepared for upload:', fileName, 'Type:', mimeType, 'Size:', blob.size);
        } catch (error) {
          console.error('❌ Error creating blob:', error);
          return {
            success: false,
            message: 'خطا در آماده‌سازی تصویر برای آپلود',
          };
        }
      } else {
        // برای mobile: استفاده از URI مستقیم
        formData.append('file', {
          uri: imageUri,
          type: mimeType,
          name: fileName,
        } as any);
      }
    } else {
      // اگر imageUri یک URL یا path است
      if (Platform.OS === 'web') {
        // برای web: باید فایل را دانلود کنیم و تبدیل به Blob کنیم
        try {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          // استخراج extension از MIME type
          let extension = 'jpg';
          if (blob.type.includes('png')) extension = 'png';
          else if (blob.type.includes('gif')) extension = 'gif';
          else if (blob.type.includes('webp')) extension = 'webp';
          
          // اگر نام فایل extension دارد، از آن استفاده کن، در غیر این صورت از timestamp + extension
          let fileName = imageUri.split('/').pop() || '';
          if (!fileName || !fileName.includes('.')) {
            // اگر نام فایل extension ندارد (مثل UUID)، از timestamp استفاده کن
            fileName = `image_${Date.now()}.${extension}`;
          } else {
            // اگر extension ندارد یا نامعتبر است، extension را اضافه کن
            const existingExt = fileName.split('.').pop()?.toLowerCase();
            if (!existingExt || !['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(existingExt)) {
              fileName = `${fileName.split('.')[0] || `image_${Date.now()}`}.${extension}`;
            }
          }
          
          formData.append('file', blob, fileName);
          console.log('📤 File prepared for upload (from URL):', fileName, 'Type:', blob.type, 'Size:', blob.size);
        } catch (error) {
          console.error('❌ Error fetching image:', error);
          return {
            success: false,
            message: 'خطا در دانلود تصویر',
          };
        }
      } else {
        // برای mobile: استفاده از URI مستقیم
        // استخراج نام فایل از URI
        let fileName = imageUri.split('/').pop() || `image_${Date.now()}.jpg`;
        
        // اگر نام فایل extension ندارد (مثل UUID)، extension را اضافه کن
        if (!fileName.includes('.')) {
          fileName = `${fileName}.jpg`;
        }
        
        formData.append('file', {
          uri: imageUri,
          type: 'image/jpeg',
          name: fileName,
        } as any);
        console.log('📤 File prepared for upload (mobile):', fileName);
      }
    }
    
    if (altText) {
      formData.append('alt_text', altText);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 ثانیه برای آپلود
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      // برای FormData نباید Content-Type را set کنیم - browser خودش boundary را اضافه می‌کند
    };
    
    console.log('📤 Uploading with headers:', headers);
    console.log('📤 FormData entries:');
    // Log FormData contents (for debugging)
    if (Platform.OS === 'web' && 'entries' in formData) {
      for (const pair of (formData as any).entries()) {
        console.log('  -', pair[0], ':', pair[1] instanceof File ? `File(${pair[1].name}, ${pair[1].size} bytes)` : pair[1]);
      }
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
      mode: 'cors',
      credentials: 'include', // برای web، cookies را هم ارسال کن
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 Upload response status:', response.status);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
      console.log('📥 Upload response data:', data);
    } else {
      // If not JSON, read as text to see the error
      const text = await response.text();
      console.error('❌ Upload error response (not JSON):', text.substring(0, 500));
      return {
        success: false,
        message: `خطا در آپلود تصویر: ${response.status} - ${response.statusText}. ${text.substring(0, 200)}`,
      };
    }
    
    if (!response.ok) {
      console.error('❌ Upload failed:', data);
      return {
        success: false,
        message: data.message || data.data?.message || `خطا: ${response.status} - ${response.statusText}`,
      };
    }
    
    return data;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        message: 'زمان آپلود به پایان رسید',
      };
    }
    
    return {
      success: false,
      message: 'خطا در آپلود تصویر. لطفاً اتصال اینترنت خود را بررسی کنید.',
    };
  }
}

