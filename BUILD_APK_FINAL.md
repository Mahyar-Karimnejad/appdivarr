# راه حل نهایی برای ساخت APK

## مشکل احتمالی: فیلترشکن یا شبکه

خطای 403 می‌تواند به دلیل:
1. **فیلترشکن**: اگر از VPN استفاده می‌کنید، ممکن است IP شما block شده باشد
2. **مشکل شبکه**: اتصال به سرورهای Expo مشکل دارد
3. **مشکل Subscription**: حساب شما محدودیت دارد

## راه حل‌های سریع

### راه حل 1: خاموش کردن فیلترشکن

```powershell
# اگر از VPN استفاده می‌کنید، آن را خاموش کنید
# سپس دوباره build کنید:
eas build --platform android --profile preview
```

### راه حل 2: تغییر DNS

اگر مشکل از DNS است:

```powershell
# استفاده از DNS عمومی Google
# در Windows Settings > Network > Change adapter options
# Properties > IPv4 > Use the following DNS server addresses:
# Preferred: 8.8.8.8
# Alternate: 8.8.4.4
```

### راه حل 3: ساخت محلی با Gradle (بدون نیاز به EAS)

این روش نیاز به فیلترشکن ندارد:

```powershell
# 1. Prepare کردن پروژه
npx expo prebuild --platform android

# 2. ساخت APK
cd android
.\gradlew.bat assembleRelease

# APK در مسیر زیر ساخته می‌شود:
# android/app/build/outputs/apk/release/app-release.apk
```

### راه حل 4: استفاده از Proxy در EAS

اگر باید از فیلترشکن استفاده کنید:

```powershell
# تنظیم proxy برای EAS
$env:HTTP_PROXY="http://proxy-server:port"
$env:HTTPS_PROXY="http://proxy-server:port"
eas build --platform android --profile preview
```

### راه حل 5: بررسی اتصال به Expo

```powershell
# تست اتصال
curl https://expo.dev
# یا
ping expo.dev
```

## راه حل پیشنهادی: ساخت محلی

اگر EAS Build کار نمی‌کند، بهترین راه ساخت محلی است:

### مراحل:

1. **نصب پیش‌نیازها:**
   - Android Studio
   - Java JDK 17 یا بالاتر
   - Android SDK

2. **Prepare کردن پروژه:**
   ```powershell
   npx expo prebuild --platform android
   ```

3. **ساخت APK:**
   ```powershell
   cd android
   .\gradlew.bat assembleRelease
   ```

4. **پیدا کردن APK:**
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

## بررسی مشکل شبکه

اگر فکر می‌کنید مشکل از شبکه است:

```powershell
# تست اتصال به Expo API
curl -I https://expo.dev
curl -I https://api.expo.dev

# بررسی DNS
nslookup expo.dev
```

## تماس با پشتیبانی

اگر هیچکدام کار نکرد:
1. به https://expo.dev/support بروید
2. مشکل را با لاگ‌های کامل گزارش دهید
3. یا در Discord Expo سوال بپرسید: https://chat.expo.dev/
