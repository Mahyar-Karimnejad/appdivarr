// تنظیمات API

// IP address کامپیوتر شما: 192.168.1.103
// برای موبایل باید از IP address استفاده کنید نه localhost یا domain name
// اگر IP تغییر کرد، اینجا آپدیت کن

import { Platform } from 'react-native';

// در موبایل از IP استفاده می‌کنیم، در web از localhost
// مهم: در iOS/Android باید از IP استفاده کنی، نه domain name
export const API_BASE_URL = Platform.OS === 'web'
  ? 'https://patoq.co/wp-json/patogh/v1'
  : 'https://patoq.co/wp-json/patogh/v1';

// Log برای debug
if (__DEV__) {
  console.log('Platform:', Platform.OS);
  console.log('API Base URL:', API_BASE_URL);
}

