// کامپوننت داشبورد ادمین

import { MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/src/components/common/Button';
import { Icon } from '@/src/components/common/Icon';
import type { Ad } from '@/src/services/ads';
import { getAdsByStatus } from '@/src/services/ads';
import type { User } from '@/src/services/auth';
import { BannersListTab } from './BannersListTab';
import { CollapsibleAdsTab } from './CollapsibleAdsTab';
import { UsersListTab } from './UsersListTab';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

interface MenuCardProps {
  icon: 'clipboard-list' | 'check-double' | 'xmark-to-slot' | 'user';
  title: string;
  onPress: () => void;
}

function MenuCard({ icon, title, onPress }: MenuCardProps) {
  return (
    <TouchableOpacity style={styles.menuCard} onPress={onPress} activeOpacity={0.7}>
      {/* Chevron Right Icon - سمت چپ */}
      <View style={styles.chevronContainer}>
        <Icon name="chevron-right" size={24} />
      </View>
      
      {/* Title - وسط (متن فارسی) */}
      <ThemedText style={styles.menuCardTitle}>{title}</ThemedText>
      
      {/* Icon - سمت راست */}
      <View style={styles.iconContainer}>
        <Icon name={icon} size={24} />
      </View>
    </TouchableOpacity>
  );
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [pendingAdsCount, setPendingAdsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadPendingAdsCount();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1); // Trigger refresh in all tabs
    await loadPendingAdsCount();
    setRefreshing(false);
  }, []);

  const loadPendingAdsCount = async () => {
    try {
      const response = await getAdsByStatus('pending', 1, 1);
      if (response.success && response.pagination) {
        setPendingAdsCount(response.pagination.total_items);
      }
    } catch (error) {
      console.error('Error loading pending ads count:', error);
    }
  };

  const handleAdPress = (ad: Ad) => {
    router.push({
      pathname: '/ad-detail',
      params: { id: String(ad.id) },
    } as any);
  };

  const handleMenuPress = (screen: string) => {
    // TODO: Navigate to specific screen
    console.log('Navigate to:', screen);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#F1F8F4" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#00964E']}
            tintColor="#00964E"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Left Side - Profile and Notification Icons */}
          <View style={styles.leftIconsContainer}>
            {/* Profile Icon */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                router.push('/profile' as any);
              }}
              activeOpacity={0.7}
            >
              {user.profile_image ? (
                <ExpoImage
                  source={{ uri: user.profile_image }}
                  style={styles.profileIcon}
                  contentFit="cover"
                />
              ) : (
                <Image
                  source={require('@/assets/images/generic user.png')}
                  style={styles.profileIcon}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>

            {/* Notification Icon with Badge */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                // TODO: Navigate to notifications
                console.log('Notifications pressed');
              }}
              activeOpacity={0.7}
            >
              <View style={styles.bellBackground}>
                <MaterialIcons name="notifications" size={20} color="#FFFFFF" />
                {pendingAdsCount > 0 && (
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>
                      {pendingAdsCount > 99 ? '99+' : pendingAdsCount}
                    </ThemedText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Right Side - Logo */}
          <View style={styles.logoContainer}>
            <ExpoImage
              source={require('@/assets/images/Ellipse 1 (1).png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <View style={styles.searchIconContainer}>
              <Icon name="magnifying-glass" size={24} />
            </View>
            <RNTextInput
              style={styles.searchInput}
              placeholder="... جستجو"
              placeholderTextColor="rgba(51, 51, 51, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              textAlign="right"
            />
          </View>
        </View>

        {/* Collapsible Tabs */}
        <View style={styles.tabsContainer}>
          <CollapsibleAdsTab
            status="pending"
            icon="clipboard-list"
            title="آگهی‌های در انتظار تأیید"
            onAdPress={handleAdPress}
            searchQuery={debouncedSearchQuery}
            refreshKey={refreshKey}
          />
          
          <CollapsibleAdsTab
            status="approved"
            icon="check-double"
            title="آگهی‌های تأیید شده"
            onAdPress={handleAdPress}
            searchQuery={debouncedSearchQuery}
            refreshKey={refreshKey}
          />
          
          <CollapsibleAdsTab
            status="rejected"
            icon="xmark-to-slot"
            title="آگهی‌های رد شده"
            onAdPress={handleAdPress}
            searchQuery={debouncedSearchQuery}
            refreshKey={refreshKey}
          />
        </View>

        {/* Users List Tab */}
        <View style={styles.tabsContainer}>
          <UsersListTab
            onUserPress={(user) => {
              // TODO: Navigate to user detail or show user info
              console.log('User pressed:', user);
            }}
            searchQuery={debouncedSearchQuery}
            refreshKey={refreshKey}
          />
        </View>

        {/* Banners List Tab */}
        <View style={styles.tabsContainer}>
          <BannersListTab
            onBannerPress={(banner) => {
              // TODO: Show banner detail or full image
              console.log('Banner pressed:', banner);
            }}
            searchQuery={debouncedSearchQuery}
            refreshKey={refreshKey}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="خروج از حساب"
            onPress={onLogout}
            variant="outline"
            size="large"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  leftIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  bellBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 150, 78, 0.26)', // رنگ سبز با شفافیت
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E7002B',
    borderRadius: 10,
    minWidth: 28,
    height: 17,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Vazir-Medium',
    lineHeight: 18,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
    height: 48,
    backgroundColor: '#FAFAFA',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    paddingVertical: 0,
  },
  searchIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  menuContainer: {
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    backgroundColor: '#FAFAFA',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 12,
    paddingHorizontal: 0,
    position: 'relative',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginRight: 0,
  },
  menuCardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    marginRight: 16,
    lineHeight: 21, // fontSize * 1.5
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginLeft: 16,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    marginTop: 16,
  },
});