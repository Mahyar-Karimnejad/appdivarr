# راهنمای ساخت APK/AAB برای اندروید

## 📱 روش‌های ساخت خروجی اندروید

### روش 1: استفاده از EAS Build (پیشنهادی) 🌟

این روش ساده‌ترین و بهترین روش برای ساخت APK/AAB هست.

#### مرحله 1: نصب EAS CLI

```bash
npm install -g eas-cli
```

یا با yarn:

```bash
yarn global add eas-cli
```

#### مرحله 2: لاگین به Expo

```bash
eas login
```

اگر اکانت Expo نداری، می‌تونی رایگان ثبت‌نام کنی:
```bash
eas register
```

#### مرحله 3: پیکربندی پروژه

```bash
eas build:configure
```

این دستور فایل `eas.json` رو بررسی می‌کنه (که قبلاً ساخته شده).

#### مرحله 4: ساخت APK (برای تست)

```bash
npm run build:android:apk
```

یا:

```bash
eas build --platform android --profile preview
```

این یک APK می‌سازه که می‌تونی مستقیماً روی گوشی نصب کنی.

#### مرحله 5: ساخت AAB (برای انتشار در Google Play)

```bash
npm run build:android:aab
```

یا:

```bash
eas build --platform android --profile production
```

این یک AAB (Android App Bundle) می‌سازه که برای انتشار در Google Play Store لازمه.

---

### روش 2: ساخت محلی (Local Build) 🔧

اگر می‌خوای روی کامپیوتر خودت build بگیری:

#### پیش‌نیازها:
- Android Studio نصب باشه
- Android SDK تنظیم شده باشه
- Java JDK نصب باشه

#### دستورات:

```bash
# نصب dependencies
npm install

# ساخت APK محلی
npx expo run:android --variant release
```

---

## 📦 تفاوت APK و AAB

- **APK**: برای تست و نصب مستقیم روی گوشی
- **AAB**: برای انتشار در Google Play Store (بهینه‌تر و کوچک‌تر)

---

## 🚀 مراحل بعد از ساخت

### برای APK:
1. فایل APK رو دانلود کن
2. روی گوشی اندروید نصب کن
3. اگر خطای "Unknown source" داد، از Settings > Security > Unknown sources رو فعال کن

### برای AAB:
1. فایل AAB رو دانلود کن
2. به Google Play Console برو
3. در بخش "Release" > "Production" آپلود کن

---

## ⚙️ تنظیمات اضافی

### تغییر Package Name:
در `app.json`:
```json
"android": {
  "package": "com.Patoq.app"
}
```

### تغییر Version:
در `app.json`:
```json
"version": "1.0.0",
"android": {
  "versionCode": 1
}
```

هر بار که می‌خوای نسخه جدید بسازی، `versionCode` رو افزایش بده.

---

## 🔍 عیب‌یابی

### خطای "EAS CLI not found":
```bash
npm install -g eas-cli
```

### خطای "Not logged in":
```bash
eas login
```

### خطای "Build failed":
- لاگ‌های build رو بررسی کن
- مطمئن شو که همه dependencies نصب شدن
- فایل `app.json` رو چک کن

---

## 📞 پشتیبانی

اگر مشکلی داشتی:
1. لاگ‌های console رو بررسی کن
2. مستندات Expo رو چک کن: https://docs.expo.dev/build/introduction/
3. مستندات EAS Build: https://docs.expo.dev/build/introduction/

---

## ✅ چک‌لیست قبل از Build

- [ ] همه dependencies نصب شدن (`npm install`)
- [ ] فایل `app.json` درست تنظیم شده
- [ ] Package name منحصر به فرد هست
- [ ] Icon و splash screen تنظیم شدن
- [ ] Version و versionCode درست هستن
- [ ] API URL برای production تنظیم شده (اگر لازمه)

---

**نکته مهم**: برای اولین بار، build ممکنه 10-15 دقیقه طول بکشه. صبور باش! 😊

