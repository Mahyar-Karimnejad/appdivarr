import { LoadingSpinner } from '@/src/components/common/LoadingSpinner';
import { UserDashboard } from '@/src/components/dashboards/UserDashboard';
import type { User } from '@/src/services/auth';
import { clearAuth, getUser } from '@/src/utils/storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

export default function HomeScreen({ onLogout }: { onLogout?: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/login');
  };

  if (loading) {
    return <LoadingSpinner text="در حال بارگذاری..." />;
  }

  // اگر لاگین نیست، به‌عنوان «مهمان» داشبورد عمومی را نشان بده
  const effectiveUser: User =
    user ?? {
      id: 0,
      email: '',
      display_name: 'کاربر مهمان',
      registered_date: '',
      role: 'guest',
      is_admin: false,
    };

  return <UserDashboard user={effectiveUser} onLogout={onLogout || handleLogout} />;
}
