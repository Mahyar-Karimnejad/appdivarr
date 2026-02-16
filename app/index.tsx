import { Redirect } from 'expo-router';

/**
 * صفحه ورودی اپ: بلافاصله به صفحه اصلی (home) ریدایرکت می‌شود.
 * استفاده از Redirect به‌جای router.replace در useEffect از خطای
 * "Attempted to navigate before mounting the Root Layout" جلوگیری می‌کند.
 */
export default function IndexScreen() {
  return <Redirect href="/home" />;
}
