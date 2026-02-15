// Utility برای مدیریت AsyncStorage

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../services/auth';

const TOKEN_KEY = 'patogh_token';
const USER_KEY = 'patogh_user';

/**
 * ذخیره token
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

/**
 * دریافت token
 */
export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * ذخیره اطلاعات کاربر
 */
export async function saveUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
}

/**
 * دریافت اطلاعات کاربر
 */
export async function getUser(): Promise<User | null> {
  try {
    const userString = await AsyncStorage.getItem(USER_KEY);
    if (userString) {
      return JSON.parse(userString) as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * پاک کردن تمام اطلاعات احراز هویت
 */
export async function clearAuth(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
}

/**
 * چک کردن آیا کاربر لاگین هست
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return token !== null;
}

