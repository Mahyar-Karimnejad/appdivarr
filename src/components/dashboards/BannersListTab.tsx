// کامپوننت لیست بنرها برای ادمین

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/src/components/common/Icon';
import { getBannersList, updateBannerStatus, type Banner } from '@/src/services/banners';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface BannersListTabProps {
  onBannerPress?: (banner: Banner) => void;
  searchQuery?: string; // برای جستجو (فعلاً در API پشتیبانی نمی‌شود)
  refreshKey?: number; // برای refresh
}

export function BannersListTab({ onBannerPress, searchQuery = '', refreshKey = 0 }: BannersListTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRenderContent, setShouldRenderContent] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [rotateAnim] = useState(new Animated.Value(0));
  const [heightAnim] = useState(new Animated.Value(0));
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (isExpanded && !hasLoaded) {
      loadBanners();
    }
  }, [isExpanded]);

  // Reload when refresh key changes
  useEffect(() => {
    if (isExpanded && hasLoaded) {
      loadBanners();
    }
  }, [refreshKey]);

  const loadBanners = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getBannersList(1, 20);

      if (response.success && response.data) {
        setBanners(response.data);
        setHasLoaded(true);
      } else {
        setError(response.message || 'خطا در دریافت لیست بنرها');
      }
    } catch (err: any) {
      console.error('Error loading banners:', err);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    if (!isExpanded) {
      setShouldRenderContent(true);
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(rotateAnim, {
            toValue,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(heightAnim, {
            toValue,
            duration: 200,
            useNativeDriver: false,
          }),
        ]).start();
      }, 10);
    } else {
      Animated.parallel([
        Animated.timing(rotateAnim, {
          toValue,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heightAnim, {
          toValue,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start(() => {
        setShouldRenderContent(false);
      });
    }

    setIsExpanded(!isExpanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['90deg', '180deg'],
  });

  const heightInterpolate = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight || 1000],
  });

  const handleContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && height !== contentHeight) {
      setContentHeight(height);
    }
  };

  const handleApprove = async (banner: Banner) => {
    console.log('✅ Approve button pressed for banner:', banner.id);
    setUpdatingStatus(banner.id);
    try {
      console.log('📤 Calling updateBannerStatus with:', { bannerId: banner.id, status: 'approved' });
      const response = await updateBannerStatus(banner.id, 'approved');
      console.log('📥 Update response:', response);
      if (response.success) {
        // Update local state immediately
        setBanners(prevBanners => 
          prevBanners.map(b => 
            b.id === banner.id ? { ...b, status: 'approved' as const } : b
          )
        );
        Alert.alert('موفق', 'بنر با موفقیت تأیید شد');
        // Reload list after a short delay to ensure backend is updated
        setTimeout(() => {
          loadBanners();
        }, 500);
      } else {
        console.error('❌ Update failed:', response.message);
        Alert.alert('خطا', response.message || 'خطا در تأیید بنر');
      }
    } catch (error: any) {
      console.error('❌ Error approving banner:', error);
      Alert.alert('خطا', error?.message || 'خطا در تأیید بنر');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleReject = async (banner: Banner) => {
    console.log('❌ Reject button pressed for banner:', banner.id);
    setUpdatingStatus(banner.id);
    try {
      console.log('📤 Calling updateBannerStatus with:', { bannerId: banner.id, status: 'rejected' });
      const response = await updateBannerStatus(banner.id, 'rejected');
      console.log('📥 Update response:', response);
      if (response.success) {
        // Update local state immediately
        setBanners(prevBanners => 
          prevBanners.map(b => 
            b.id === banner.id ? { ...b, status: 'rejected' as const } : b
          )
        );
        Alert.alert('موفق', 'بنر رد شد');
        // Reload list after a short delay to ensure backend is updated
        setTimeout(() => {
          loadBanners();
        }, 500);
      } else {
        console.error('❌ Update failed:', response.message);
        Alert.alert('خطا', response.message || 'خطا در رد بنر');
      }
    } catch (error: any) {
      console.error('❌ Error rejecting banner:', error);
      Alert.alert('خطا', error?.message || 'خطا در رد بنر');
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <View style={[styles.container, isExpanded && styles.containerExpanded]}>
      {/* Header Card */}
      <TouchableOpacity
        style={styles.headerCard}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        {/* Chevron Icon - سمت چپ */}
        <Animated.View
          style={[
            styles.chevronContainer,
            { transform: [{ rotate: rotateInterpolate }] },
          ]}
        >
          <Icon
            name="chevron-right"
            size={24}
            color="rgba(231, 0, 43, 1)"
          />
        </Animated.View>

        {/* Title - سمت راست */}
        <ThemedText style={styles.headerTitle}>بنرهای تبلیغاتی</ThemedText>

        {/* Icon - سمت راست - فقط وقتی بسته است */}
        {!isExpanded && (
          <View style={styles.iconContainer}>
            <Icon name="box" size={18} />
          </View>
        )}
      </TouchableOpacity>

      {/* Content */}
      {shouldRenderContent && (
        <Animated.View
          style={[
            styles.contentContainer,
            {
              maxHeight: heightInterpolate,
              opacity: heightAnim,
            },
          ]}
        >
          <View onLayout={handleContentLayout} style={styles.contentWrapper}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#E7002B" />
                <ThemedText style={styles.loadingText}>در حال بارگذاری...</ThemedText>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
              </View>
            ) : banners.length > 0 ? (
              <View style={styles.bannersList}>
                {banners.map((banner) => (
                  <View key={banner.id} style={styles.bannerCard}>
                    {/* Banner Image */}
                    <TouchableOpacity
                      style={styles.bannerImageContainer}
                      onPress={() => onBannerPress?.(banner)}
                      activeOpacity={0.7}
                    >
                      <ExpoImage
                        source={{ uri: banner.image_url }}
                        style={styles.bannerImage}
                        contentFit="cover"
                      />
                    </TouchableOpacity>

                    {/* User Info */}
                    <View style={styles.bannerInfo}>
                      <View style={styles.userInfoRow}>
                        <Icon name="user" size={16} color="#757575" />
                        <ThemedText style={styles.userName} numberOfLines={1}>
                          {banner.user_name || banner.user_email}
                        </ThemedText>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          banner.status === 'approved' && styles.statusBadgeApproved,
                          banner.status === 'rejected' && styles.statusBadgeRejected,
                          banner.status === 'pending' && styles.statusBadgePending,
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.statusText,
                            banner.status === 'approved' && styles.statusTextApproved,
                            banner.status === 'rejected' && styles.statusTextRejected,
                            banner.status === 'pending' && styles.statusTextPending,
                          ]}
                        >
                          {banner.status === 'approved' && 'تأیید شده'}
                          {banner.status === 'rejected' && 'رد شده'}
                          {banner.status === 'pending' && 'در انتظار تأیید'}
                        </ThemedText>
                      </View>

                      {/* Action Buttons */}
                      {banner.status === 'pending' && (
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.approveButton]}
                            onPress={() => handleApprove(banner)}
                            disabled={updatingStatus === banner.id}
                            activeOpacity={0.7}
                          >
                            {updatingStatus === banner.id ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <ThemedText style={styles.approveButtonText}>
                                تأیید
                              </ThemedText>
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionButton, styles.rejectButton]}
                            onPress={() => handleReject(banner)}
                            disabled={updatingStatus === banner.id}
                            activeOpacity={0.7}
                          >
                            {updatingStatus === banner.id ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                              <ThemedText style={styles.rejectButtonText}>
                                رد
                              </ThemedText>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  هیچ بنری یافت نشد
                </ThemedText>
              </View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 12,
    overflow: 'hidden',
  },
  containerExpanded: {
    // وقتی باز است، بک‌گراند و border حفظ می‌شود
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    minHeight: 52,
  },
  chevronContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    marginRight: 8,
    lineHeight: 21,
  },
  iconContainer: {
    width: 18,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    marginLeft: 8,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  contentWrapper: {
    // Wrapper برای اندازه‌گیری ارتفاع
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontFamily: 'Vazir-Medium',
    fontSize: 12,
    color: '#757575',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
  errorText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 12,
    color: '#E7002B',
    textAlign: 'center',
  },
  bannersList: {
    gap: 16,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerInfo: {
    padding: 12,
    gap: 12,
  },
  userInfoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    flex: 1,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeApproved: {
    backgroundColor: '#E8F5E9',
  },
  statusBadgeRejected: {
    backgroundColor: '#FFEBEE',
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Vazir-Medium',
  },
  statusTextApproved: {
    color: '#2E7D32',
  },
  statusTextRejected: {
    color: '#C62828',
  },
  statusTextPending: {
    color: '#E65100',
  },
  actionButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#00964E',
  },
  rejectButton: {
    backgroundColor: '#E7002B',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Medium',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Medium',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
});

