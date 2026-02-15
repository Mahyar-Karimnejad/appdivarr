# راه حل خطای 403 Forbidden در EAS Build

## مشکل
خطای `403 (Forbidden)` هنگام ساخت پروژه با EAS Build

## راه حل‌ها (به ترتیب اولویت)

### 1. بررسی و لاگین مجدد به EAS

```bash
# بررسی وضعیت لاگین
eas whoami

# اگر لاگین نیستید یا مشکل دارید، لاگ اوت کنید
eas logout

# سپس دوباره لاگین کنید
eas login
```

### 2. بررسی Owner و Project ID

در فایل `app.json` بررسی کنید:
- `owner`: باید با نام کاربری Expo شما مطابقت داشته باشد
- `projectId`: باید با پروژه شما در Expo Dashboard مطابقت داشته باشد

اگر `owner` اشتباه است:
```bash
# حذف owner از app.json (خط 76)
# سپس اجرا کنید:
eas build:configure
```

### 3. بررسی دسترسی‌های حساب کاربری

1. به https://expo.dev بروید
2. وارد حساب کاربری خود شوید
3. به بخش Projects بروید
4. پروژه `patoq` را پیدا کنید
5. بررسی کنید که شما owner یا member هستید

### 4. بررسی Project ID

اگر projectId اشتباه است:
```bash
# حذف projectId از app.json (خط 72-74)
# سپس اجرا کنید:
eas build:configure
```

### 5. پاک کردن Cache و Token

```bash
# پاک کردن cache EAS
rm -rf ~/.expo
rm -rf ~/.eas

# در Windows PowerShell:
Remove-Item -Recurse -Force $env:USERPROFILE\.expo
Remove-Item -Recurse -Force $env:USERPROFILE\.eas

# سپس دوباره لاگین کنید
eas login
```

### 6. بررسی نسخه EAS CLI

```bash
# بررسی نسخه
eas --version

# آپدیت به آخرین نسخه
npm install -g eas-cli@latest
```

### 7. استفاده از Access Token

اگر مشکل ادامه داشت، می‌توانید از Access Token استفاده کنید:

1. به https://expo.dev/accounts/[username]/settings/access-tokens بروید
2. یک Access Token جدید ایجاد کنید
3. سپس استفاده کنید:
```bash
export EXPO_TOKEN=your-access-token-here
eas build --platform android --profile preview
```

## بررسی‌های اضافی

### بررسی فایل app.json
- مطمئن شوید که `owner` با نام کاربری Expo شما مطابقت دارد
- مطمئن شوید که `projectId` معتبر است

### بررسی فایل eas.json
- مطمئن شوید که profile های build درست تنظیم شده‌اند

## دستورات مفید

```bash
# بررسی وضعیت
eas whoami

# لاگ اوت
eas logout

# لاگین مجدد
eas login

# پیکربندی مجدد پروژه
eas build:configure

# ساخت با لاگ verbose
eas build --platform android --profile preview --verbose
```

## اگر هیچکدام کار نکرد

1. یک پروژه جدید در Expo Dashboard ایجاد کنید
2. `projectId` جدید را در `app.json` قرار دهید
3. دوباره build کنید
