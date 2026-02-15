// سرویس‌های API

import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants';
import type { ApiResponse } from '../types';

class ApiService {
  private baseURL = API_BASE_URL;

  /**
   * درخواست GET
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const urlWithCache = endpoint.includes('?') 
        ? `${this.baseURL}${endpoint}&_t=${Date.now()}`
        : `${this.baseURL}${endpoint}?_t=${Date.now()}`;
      
      const headers: Record<string, string> = {};
      // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
      if (Platform.OS !== 'web') {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }
      
      const response = await fetch(urlWithCache, {
        cache: 'no-store',
        headers,
      });
      const data = await response.json();
      
      return {
        success: response.ok,
        data,
        message: response.ok ? undefined : 'خطا در دریافت داده‌ها'
      };
    } catch (error) {
      return {
        success: false,
        data: null as T,
        message: 'خطا در اتصال به سرور'
      };
    }
  }

  /**
   * درخواست POST
   */
  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      // برای web platform، header های cache را اضافه نمی‌کنیم (مشکل CORS)
      if (Platform.OS !== 'web') {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
      }
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        cache: 'no-store',
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        data,
        message: response.ok ? undefined : 'خطا در ارسال داده‌ها'
      };
    } catch (error) {
      return {
        success: false,
        data: null as T,
        message: 'خطا در اتصال به سرور'
      };
    }
  }
}

export const apiService = new ApiService();
