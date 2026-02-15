# کوئری SQL برای ساخت دسته‌بندی با عکس

```sql
-- ساخت دسته‌بندی با عکس
-- توجه: پیشوند جدول keosiu_ است

INSERT INTO `keosiu_patogh_categories` 
(`name`, `slug`, `description`, `image_url`, `parent_id`, `sort_order`, `is_active`, `created_at`, `updated_at`) 
VALUES 
('نام دسته‌بندی', 'slug-daste-bandi', 'توضیحات دسته‌بندی', 'https://example.com/image.jpg', NULL, 0, 1, NOW(), NOW());
```

