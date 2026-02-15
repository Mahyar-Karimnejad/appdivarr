import { Redirect } from 'expo-router';

/**
 * صفحه ورودی اپ: بلافاصله به لیست آگهی‌های عمومی ریدایرکت می‌شود
 * تا بدون نیاز به لاگین کاربر بتواند آگهی‌ها را ببیند.
 * استفاده از Redirect به‌جای router.replace در useEffect از خطای
 * "Attempted to navigate before mounting the Root Layout" جلوگیری می‌کند.
 */
export default function IndexScreen() {
  return <Redirect href="/ads-list?status=approved" />;
}
