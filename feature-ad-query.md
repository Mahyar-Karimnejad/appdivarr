# کوئری SQL برای ویژه کردن آگهی

```sql
-- ویژه کردن آگهی با ID 4
-- توجه: پیشوند جدول keosiu_ است

UPDATE `keosiu_patogh_ads` 
SET `is_featured` = 1 
WHERE `id` = 4;

-- برای ویژه کردن چند آگهی:
UPDATE `keosiu_patogh_ads` 
SET `is_featured` = 1 
WHERE `id` IN (4, 5, 6);

-- برای غیر ویژه کردن یک آگهی:
UPDATE `keosiu_patogh_ads` 
SET `is_featured` = 0 
WHERE `id` = 4;

-- برای غیر ویژه کردن همه آگهی‌ها:
UPDATE `keosiu_patogh_ads` 
SET `is_featured` = 0;

-- برای مشاهده آگهی‌های ویژه:
SELECT * FROM `keosiu_patogh_ads` WHERE `is_featured` = 1;

-- برای مشاهده همه آگهی‌ها و وضعیت ویژه بودن:
SELECT `id`, `title`, `is_featured`, `status` FROM `keosiu_patogh_ads`;
```

