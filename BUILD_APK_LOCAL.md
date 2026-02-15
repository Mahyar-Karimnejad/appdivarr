# ساخت APK بدون Device یا Emulator

## روش 1: ساخت مستقیم با Gradle (پیشنهادی)

اگر Android Studio نصب دارید، می‌توانید مستقیماً APK بسازید:

```bash
# ابتدا پروژه را prepare کنید
npx expo prebuild --platform android

# سپس با Gradle build کنید
cd android
./gradlew assembleRelease

# در Windows PowerShell:
cd android
.\gradlew.bat assembleRelease
```

APK در مسیر زیر ساخته می‌شود:
```
android/app/build/outputs/apk/release/app-release.apk
```

## روش 2: استفاده از EAS Build با Local Flag

اگر می‌خواهید از EAS استفاده کنید اما build روی کامپیوتر خودتان انجام شود:

```bash
eas build --platform android --profile preview --local
```

**نکته**: این روش نیاز به Android SDK و Java JDK دارد.

## روش 3: حل مشکل 403 در EAS Build

### بررسی Subscription:

1. به https://expo.dev/accounts/mahyarmp/settings/billing بروید
2. بررسی کنید که plan شما فعال است
3. اگر plan رایگان دارید، ممکن است محدودیت build داشته باشید

### استفاده از Access Token:

1. به https://expo.dev/accounts/mahyarmp/settings/access-tokens بروید
2. یک Access Token جدید ایجاد کنید
3. در PowerShell:
```powershell
$env:EXPO_TOKEN="your-access-token-here"
eas build --platform android --profile preview
```

### بررسی دسترسی پروژه:

1. به https://expo.dev/accounts/mahyarmp/projects/patoq بروید
2. بررسی کنید که:
   - شما owner هستید
   - پروژه فعال است
   - هیچ محدودیتی وجود ندارد

## روش 4: ساخت با EAS Build (Cloud) - حل مشکل 403

اگر مشکل از subscription است، می‌توانید:

1. **بررسی کنید که آیا build های قبلی موفق بوده‌اند:**
   ```bash
   eas build:list
   ```

2. **ساخت با verbose برای دیدن خطای دقیق:**
   ```bash
   eas build --platform android --profile preview --verbose
   ```

3. **تماس با پشتیبانی Expo:**
   - به https://expo.dev/support بروید
   - مشکل را با لاگ‌های کامل گزارش دهید

## پیش‌نیازهای Local Build

اگر می‌خواهید روی کامپیوتر خودتان build کنید:

1. **Android Studio** نصب باشد
2. **Android SDK** تنظیم شده باشد
3. **Java JDK** نصب باشد (JDK 17 یا بالاتر)
4. **ANDROID_HOME** environment variable تنظیم شده باشد

### بررسی پیش‌نیازها:

```powershell
# بررسی Java
java -version

# بررسی Android SDK
$env:ANDROID_HOME

# بررسی Gradle
cd android
.\gradlew.bat --version
```
