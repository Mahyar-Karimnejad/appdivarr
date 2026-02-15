import { AdminDashboard } from '@/src/components/dashboards/AdminDashboard';
import type { User } from '@/src/services/auth';
import { clearAuth, getUser } from '@/src/utils/storage';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUser();
    }, 1000); // تاخیر کوتاه برای نمایش loading

    return () => clearTimeout(timer);
  }, [loadUser]);

  // Reload user data when screen comes into focus (e.g., after returning from profile)
  useFocusEffect(
    useCallback(() => {
      if (!loading) {
        loadUser();
      }
    }, [loadUser, loading])
  );


  const handleLogout = async () => {
    await clearAuth();
    router.replace('/login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <Image
            source={require('../assets/images/Ellipse 1 (1).png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    // اگر user وجود نداشت، به login برو
    router.replace('/login');
    return null;
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(241, 248, 244, 1)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
});

