-- کوئری SQL برای ساخت دسته‌بندی تستی
-- توجه: پیشوند جدول را بررسی کنید (معمولاً wp_ یا keosiu_ است)

-- برای بررسی پیشوند جدول، این کوئری را اجرا کنید:
-- SHOW TABLES LIKE '%patogh_categories%';

-- ============================================
-- کوئری با پیشوند wp_ (استاندارد وردپرس)
-- ============================================
INSERT INTO `wp_patogh_categories` 
(`name`, `slug`, `description`, `image_url`, `parent_id`, `sort_order`, `is_active`, `created_at`, `updated_at`) 
VALUES 
('دسته‌بندی تستی', 'test-category', 'این یک دسته‌بندی تستی است', NULL, NULL, 0, 1, NOW(), NOW());

-- ============================================
-- کوئری با پیشوند keosiu_ (اگر پیشوند شما این است)
-- ============================================
-- INSERT INTO `keosiu_patogh_categories` 
-- (`name`, `slug`, `description`, `image_url`, `parent_id`, `sort_order`, `is_active`, `created_at`, `updated_at`) 
-- VALUES 
-- ('دسته‌بندی تستی', 'test-category', 'این یک دسته‌بندی تستی است', NULL, NULL, 0, 1, NOW(), NOW());

-- ============================================
-- کوئری برای بررسی دسته‌بندی‌های موجود
-- ============================================
-- SELECT * FROM `wp_patogh_categories` ORDER BY `id` DESC LIMIT 10;

-- ============================================
-- کوئری برای حذف دسته‌بندی تستی (در صورت نیاز)
-- ============================================
-- DELETE FROM `wp_patogh_categories` WHERE `slug` = 'test-category';
