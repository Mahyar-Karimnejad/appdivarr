# راه حل کامل خطای 403 Forbidden در EAS Build

## مشکل
پس از لاگین موفق و configure کردن پروژه، هنوز خطای `403 (Forbidden)` دریافت می‌کنید.

## راه حل‌های پیشنهادی

### راه حل 1: بررسی Subscription و Plan حساب کاربری

خطای 403 ممکن است به دلیل محدودیت‌های plan رایگان باشد:

1. به https://expo.dev/accounts/mahyarmp/settings/billing بروید
2. بررسی کنید که آیا plan شما فعال است
3. اگر plan رایگان دارید، ممکن است محدودیت build داشته باشید

**راه حل موقت**: استفاده از Local Build (روی کامپیوتر خودتان)

### راه حل 2: استفاده از Local Build (پیشنهادی)

اگر مشکل از subscription است، می‌توانید روی کامپیوتر خودتان build کنید:

```bash
# ساخت APK محلی
npx expo run:android --variant release
```

این دستور APK را در مسیر زیر می‌سازد:
- `android/app/build/outputs/apk/release/app-release.apk`

### راه حل 3: بررسی دسترسی به پروژه در Expo Dashboard

1. به https://expo.dev/accounts/mahyarmp/projects/patoq بروید
2. بررسی کنید که:
   - شما owner یا admin هستید
   - پروژه فعال است
   - هیچ محدودیتی وجود ندارد

### راه حل 4: استفاده از Access Token

اگر مشکل از authentication است:

1. به https://expo.dev/accounts/mahyarmp/settings/access-tokens بروید
2. یک Access Token جدید ایجاد کنید
3. در PowerShell:
```powershell
$env:EXPO_TOKEN="your-access-token-here"
eas build --platform android --profile preview
```

### راه حل 5: پاک کردن فایل‌های اضافی قبل از Build

بعضی فایل‌ها ممکن است باعث مشکل شوند:

```powershell
# پاک کردن node_modules و rebuild
Remove-Item -Recurse -Force node_modules
npm install

# پاک کردن cache
npx expo start --clear
```

### راه حل 6: ساخت با Flag های مختلف

```bash
# ساخت با non-interactive mode
eas build --platform android --profile preview --non-interactive

# ساخت با local credentials
eas build --platform android --profile preview --local
```

### راه حل 7: بررسی فایل .easignore

اگر فایل `.easignore` وجود دارد، بررسی کنید که فایل‌های مهم ignore نشده باشند.

## راه حل موقت: ساخت محلی (Local Build)

اگر EAS Build کار نمی‌کند، می‌توانید روی کامپیوتر خودتان build کنید:

### پیش‌نیازها:
1. Android Studio نصب باشد
2. Android SDK تنظیم شده باشد
3. Java JDK نصب باشد

### دستورات:

```bash
# نصب dependencies
npm install

# ساخت APK
npx expo run:android --variant release
```

APK در مسیر زیر ساخته می‌شود:
```
android/app/build/outputs/apk/release/app-release.apk
```

## بررسی‌های اضافی

### بررسی لاگ‌های کامل:
```bash
eas build --platform android --profile preview --verbose
```

### بررسی وضعیت حساب:
```bash
eas whoami
eas account:view
```

## تماس با پشتیبانی Expo

اگر هیچکدام کار نکرد:
1. به https://expo.dev/support بروید
2. مشکل را با لاگ‌های کامل گزارش دهید
3. یا در Discord Expo سوال بپرسید: https://chat.expo.dev/
