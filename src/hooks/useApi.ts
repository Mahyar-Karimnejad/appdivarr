// Hook برای مدیریت API calls

import { useState, useEffect } from 'react';
import type { ApiResponse } from '../types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook برای مدیریت درخواست‌های API
 */
export function useApi<T>(
  apiCall: () => Promise<ApiResponse<T>>,
  immediate = true
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'خطای نامشخص');
      }
    } catch (err) {
      setError('خطا در دریافت داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
