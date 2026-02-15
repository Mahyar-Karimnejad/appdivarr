// کامپوننت تب تاشو برای آگهی‌ها

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/src/components/common/Icon';
import { getAdsByStatus, getMyAds, type Ad } from '@/src/services/ads';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AdCard } from './AdCard';

interface CollapsibleAdsTabProps {
  status: 'pending' | 'approved' | 'rejected';
  icon: 'clipboard-list' | 'check-double' | 'xmark-to-slot';
  title: string;
  onAdPress?: (ad: Ad) => void;
  useMyAds?: boolean; // اگر true باشد، از getMyAds استفاده می‌کند
  searchQuery?: string; // برای جستجو
  refreshKey?: number; // برای refresh
}

export function CollapsibleAdsTab({
  status,
  icon,
  title,
  onAdPress,
  useMyAds = false,
  searchQuery = '',
  refreshKey = 0,
}: CollapsibleAdsTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRenderContent, setShouldRenderContent] = useState(false);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));
  const [heightAnim] = useState(new Animated.Value(0));
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (isExpanded && !hasLoaded) {
      loadAds();
    }
  }, [isExpanded]);

  // Reload when search query changes or refresh key changes
  useEffect(() => {
    if (isExpanded && hasLoaded) {
      loadAds();
    }
  }, [searchQuery, refreshKey]);

  const loadAds = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = useMyAds 
        ? await getMyAds(status, 1, 20, searchQuery || undefined)
        : await getAdsByStatus(status, 1, 20, undefined, searchQuery || undefined);

      if (response.success && response.data) {
        setAds(response.data);
        setHasLoaded(true);
      } else {
        setError(response.message || 'خطا در دریافت آگهی‌ها');
      }
    } catch (err: any) {
      console.error('Error loading ads:', err);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    if (!isExpanded) {
      // باز شدن: ابتدا محتوا را render کن
      setShouldRenderContent(true);
      // کمی delay برای اینکه محتوا render شود و ارتفاع اندازه‌گیری شود
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
      // بسته شدن: ابتدا انیمیشن را شروع کن
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
        // بعد از اتمام انیمیشن، محتوا را unmount کن
        setShouldRenderContent(false);
      });
    }

    setIsExpanded(!isExpanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['90deg', '180deg'], // از چپ (180deg) به بالا (-90deg)
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

  return (
    <View style={[styles.container, isExpanded && styles.containerExpanded]}>
      {/* Header Card */}
      <TouchableOpacity
        style={styles.headerCard}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        {/* Chevron Icon - سمت چپ - همیشه نمایش داده می‌شود */}
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
        <ThemedText style={styles.headerTitle}>{title}</ThemedText>

        {/* Icon - سمت راست - فقط وقتی بسته است */}
        {!isExpanded && (
          <View style={styles.iconContainer}>
            <Icon name={icon} size={18} />
          </View>
        )}
      </TouchableOpacity>

      {/* Content - وقتی باز میشه - داخل container با بک‌گراند مشترک */}
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
            ) : ads.length > 0 ? (
              <>
                <View style={styles.adsList}>
                  {ads.map((ad) => (
                    <AdCard
                      key={ad.id}
                      ad={ad}
                      onPress={() => onAdPress?.(ad)}
                    />
                  ))}
                </View>

                {/* دکمه نمایش بیشتر */}
                <View style={styles.showMoreContainer}>
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => {
                      // Navigate to ads list page with status filter
                      router.push({
                        pathname: '/ads-list' as any,
                        params: { status },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <ThemedText style={styles.showMoreText}>نمایش بیشتر</ThemedText>
                    <View style={styles.divider} />
                  </TouchableOpacity>
                </View>

                {/* خط جداکننده */}
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  هیچ آگهی‌ای در این دسته وجود ندارد
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
  adsList: {
    gap: 16,
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
  showMoreContainer: {
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  showMoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMoreText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(231, 0, 43, 1)',
    fontFamily: 'Vazir-Medium',
    lineHeight: 25,
  },
  divider: {
    height: 0.7,
    backgroundColor: '#E7002B',
    marginTop: 10,
    marginHorizontal: 16,
    width: 98,
    alignSelf: 'center',
  },
});

