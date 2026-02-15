# راهنمای استفاده از Postman برای API دسته‌بندی‌ها

## تنظیمات کلی Postman

### 1. بررسی Headers
- مطمئن شوید که **Content-Type: application/json** تنظیم شده است
- برای ادمین endpoints، **Authorization: Bearer {token}** اضافه کنید
- Headers اضافی مثل `Accept-Encoding: gzip` را حذف کنید

### 2. تنظیمات Body
- **Body** را روی **raw** تنظیم کنید
- نوع را **JSON** انتخاب کنید (نه Text)
- از JSON معتبر استفاده کنید

### 3. حل مشکل "incorrect header check"

#### راه‌حل 1: بررسی Content-Type
```
Headers:
  Content-Type: application/json
  Accept: application/json
```

#### راه‌حل 2: حذف Headers اضافی
در Postman:
1. به تب **Headers** بروید
2. Headers اضافی مثل `Accept-Encoding` را حذف کنید
3. فقط این headers را نگه دارید:
   - `Content-Type: application/json` (برای POST/PUT)
   - `Authorization: Bearer {token}` (برای admin endpoints)
   - `Accept: application/json`

#### راه‌حل 3: بررسی Body
- مطمئن شوید که Body به صورت **raw JSON** است
- از کاماهای اضافی یا syntax errors پرهیز کنید
- از JSON validator استفاده کنید

#### راه‌حل 4: تنظیمات Postman
1. Settings > General
2. "Automatically follow redirects" را غیرفعال کنید
3. "SSL certificate verification" را بررسی کنید

## مثال‌های کامل

### GET - دریافت دسته‌بندی‌ها (عمومی)
```
Method: GET
URL: https://patoq.co/wp-json/patogh/v1/categories
Headers: (خالی)
```

### GET - دریافت دسته‌بندی‌های یک والد
```
Method: GET
URL: https://patoq.co/wp-json/patogh/v1/categories?parent_id=1&include_children=true
Headers: (خالی)
```

### GET - دریافت دسته‌بندی‌ها (ادمین)
```
Method: GET
URL: https://patoq.co/wp-json/patogh/v1/admin/categories
Headers:
  Authorization: Bearer YOUR_TOKEN
  Accept: application/json
```

### POST - ایجاد دسته‌بندی جدید
```
Method: POST
URL: https://patoq.co/wp-json/patogh/v1/admin/categories
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
  Accept: application/json

Body (raw - JSON):
{
  "name": "دسته جدید",
  "description": "توضیحات دسته",
  "image_url": "",
  "parent_id": null,
  "sort_order": 0,
  "is_active": true
}
```

### PUT - ویرایش دسته‌بندی
```
Method: PUT
URL: https://patoq.co/wp-json/patogh/v1/admin/categories/1
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json
  Accept: application/json

Body (raw - JSON):
{
  "name": "نام جدید",
  "is_active": false
}
```

### DELETE - حذف دسته‌بندی
```
Method: DELETE
URL: https://patoq.co/wp-json/patogh/v1/admin/categories/1
Headers:
  Authorization: Bearer YOUR_TOKEN
  Accept: application/json
```

## دریافت Token برای Admin Endpoints

برای دریافت token، از endpoint لاگین استفاده کنید:
```
POST https://patoq.co/wp-json/patogh/v1/auth/login
```

یا از token موجود در اپ استفاده کنید (از AsyncStorage یا localStorage)

## Troubleshooting

### خطا: "incorrect header check"
1. ✅ Content-Type را بررسی کنید: باید `application/json` باشد
2. ✅ Body را روی raw JSON تنظیم کنید
3. ✅ Headers اضافی را حذف کنید
4. ✅ JSON syntax را بررسی کنید

### خطا: "Unauthorized" یا 401
- Token را بررسی کنید
- مطمئن شوید که token معتبر است
- Format header را چک کنید: `Bearer {token}` (با فاصله)

### خطا: "Method not allowed" یا 405
- Method را بررسی کنید (GET, POST, PUT, DELETE)
- URL را دوباره بررسی کنید

### خطا: "Not found" یا 404
- URL را بررسی کنید
- مطمئن شوید که endpoint درست است
- Namespace را چک کنید: `/patogh/v1/`

