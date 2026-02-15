// صفحه جزئیات آگهی برای ادمین و کاربر

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/src/components/common/Button';
import { Icon } from '@/src/components/common/Icon';
import { getAdById, requestExpertReview, toggleAdFeatured, updateAdStatus, type Ad } from '@/src/services/ads';
import type { User } from '@/src/services/auth';
import { getUser } from '@/src/utils/storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function AdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<'approved' | 'rejected' | null>(null);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [requestingExpert, setRequestingExpert] = useState(false);
  const imageScrollViewRef = useRef<ScrollView>(null);
  const imageModalScrollViewRef = useRef<ScrollView>(null);

  // Reset image index when ad changes
  useEffect(() => {
    if (ad?.images && ad.images.length > 0) {
      setCurrentImageIndex(0);
      // Reset scroll position
      imageScrollViewRef.current?.scrollTo({ x: 0, animated: false });
      imageModalScrollViewRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [ad?.id]);

  const rejectionReasons = [
    'آگهی شما با قوانین و شرایط استفاده مطابقت ندارد.',
    'تصاویر درج شده در آگهی مناسب یا واضح نیستند.',
    'اطلاعات وارد شده ناقص یا نادرست است.',
    'آگهی شما در دسته بندی نادرست قرار گرفته است.',
  ];

  useEffect(() => {
    loadUser();
    if (id) {
      loadAd();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadAd = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await getAdById(parseInt(id, 10));

      if (response.success && response.data) {
        setAd(response.data);
      } else {
        setError(response.message || 'خطا در دریافت اطلاعات آگهی');
      }
    } catch (err: any) {
      console.error('Error loading ad:', err);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdateClick = (status: 'approved' | 'rejected') => {
    setPendingStatus(status);
    setSelectedRejectionReason(null);
    setShowConfirmModal(true);
  };

  const handleConfirmStatusUpdate = async () => {
    if (!ad || !pendingStatus) return;

    // اگر رد است و دلیل انتخاب نشده، اجازه نده
    if (pendingStatus === 'rejected' && !selectedRejectionReason) {
      return;
    }

    setShowConfirmModal(false);
    setUpdating(true);
    try {
      const response = await updateAdStatus(
        ad.id,
        pendingStatus,
        pendingStatus === 'rejected' ? selectedRejectionReason || undefined : undefined
      );

      if (response.success) {
        // بروزرسانی وضعیت آگهی در state
        setAd({ ...ad, status: pendingStatus });
        // بازگشت به صفحه قبل
        if (router.canGoBack()) {
          router.back();
        } else {
          // بر اساس نقش کاربر به صفحه مناسب برو
          const redirectPath = user?.is_admin ? '/admin' : '/home';
          router.replace(redirectPath as any);
        }
      } else {
        setError(response.message || 'خطا در بروزرسانی وضعیت آگهی');
      }
    } catch (err: any) {
      console.error('Error updating ad status:', err);
      setError('خطا در بروزرسانی وضعیت آگهی');
    } finally {
      setUpdating(false);
      setPendingStatus(null);
      setSelectedRejectionReason(null);
    }
  };

  const handleCancelStatusUpdate = () => {
    setShowConfirmModal(false);
    setPendingStatus(null);
    setSelectedRejectionReason(null);
  };

  const handleContactInfo = () => {
    // اگر کاربر لاگین نیست، ابتدا او را به صفحه لاگین با redirect برگردان به همین آگهی بفرست
    if (!user) {
      if (id) {
        router.replace({
          pathname: '/login',
          params: {
            redirect: '/ad-detail',
            id: String(id),
            action: 'contact',
          },
        });
      } else {
        router.replace('/login');
      }
      return;
    }

    if (ad) {
      setShowContactModal(true);
    }
  };

  const handleCall = () => {
    if (ad?.user_phone) {
      Linking.openURL(`tel:${ad.user_phone}`);
    }
  };

  const handleExpertRequest = async () => {
    if (!ad) return;

    // اگر کاربر لاگین نیست، او را به صفحه لاگین با redirect و action=expert بفرست
    if (!user) {
      if (id) {
        router.replace({
          pathname: '/login',
          params: {
            redirect: '/ad-detail',
            id: String(id),
            action: 'expert',
          },
        });
      } else {
        router.replace('/login');
      }
      return;
    }

    try {
      setRequestingExpert(true);
      
      // تست endpoint برای بررسی ثبت route
      const baseUrl = 'https://patoq.co/wp-json/patogh/v1';
      const testUrl = `${baseUrl}/expert-requests/test`;
      console.log('🧪 Testing route registration:', testUrl);
      try {
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        console.log('🧪 Test endpoint status:', testResponse.status);
        const testData = await testResponse.text();
        console.log('🧪 Test endpoint response:', testData.slice(0, 200));
      } catch (testError: any) {
        console.error('🧪 Test endpoint error:', testError.message);
      }
      
      const response = await requestExpertReview(ad.id);
      console.log('📦 Expert review response:', JSON.stringify(response, null, 2));

      if (response.success) {
        Alert.alert('موفق', response.message || 'درخواست کارشناسی شما ثبت شد');
      } else {
        Alert.alert('خطا', response.message || 'خطا در ثبت درخواست کارشناسی');
      }
    } catch (error: any) {
      console.error('❌ Error requesting expert review:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('خطا', 'خطا در ثبت درخواست کارشناسی. لطفاً دوباره تلاش کنید.');
    } finally {
      setRequestingExpert(false);
    }
  };

  const handleToggleFeatured = async () => {
    if (!ad) return;
    
    const newFeaturedStatus = !(ad.is_featured === 1);
    
    setTogglingFeatured(true);
    try {
      const response = await toggleAdFeatured(ad.id, newFeaturedStatus);
      
      if (response.success) {
        // بروزرسانی وضعیت آگهی در state
        setAd({ ...ad, is_featured: newFeaturedStatus ? 1 : 0 });
        Alert.alert('موفق', response.message || 'وضعیت ویژه آگهی تغییر کرد');
      } else {
        Alert.alert('خطا', response.message || 'خطا در تغییر وضعیت ویژه آگهی');
      }
    } catch (err: any) {
      console.error('Error toggling featured status:', err);
      Alert.alert('خطا', 'خطا در تغییر وضعیت ویژه آگهی');
    } finally {
      setTogglingFeatured(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatDate = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    const persianDate = date.toLocaleDateString('fa-IR');
    const time = date.toLocaleTimeString('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date: persianDate, time };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ExpoImage
            source={require('../assets/images/Ellipse 1 (1).png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !ad) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Button
            title="تلاش مجدد"
            onPress={loadAd}
            variant="primary"
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!ad) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>آگهی یافت نشد</ThemedText>
          <Button
            title="بازگشت"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                const redirectPath = user?.is_admin ? '/admin' : '/home';
                router.replace(redirectPath as any);
              }
            }}
            variant="primary"
            size="medium"
          />
        </View>
      </SafeAreaView>
    );
  }

  const dateParts = formatDate(ad.created_at);
  const images = ad.images && ad.images.length > 0 ? ad.images : [];
  const firstImage = images.length > 0 ? images[0].image_url : null;
  const pricePerMeter = ad.price && ad.land_area && parseFloat(ad.land_area) > 0 
    ? Math.floor(ad.price / parseFloat(ad.land_area)) 
    : 0;
  
  // Parse other_features JSON
  let otherFeatures: Record<string, any> = {};
  try {
    if (ad.other_features && ad.other_features.trim()) {
      otherFeatures = JSON.parse(ad.other_features);
    }
  } catch (e) {
    console.error('Error parsing other_features:', e);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                const redirectPath = user?.is_admin ? '/admin' : '/home';
                router.replace(redirectPath as any);
              }
            }}
            activeOpacity={0.7}
          >
            <Icon name="chevron-right" size={24} color="rgba(231, 0, 43, 1)" />
          </TouchableOpacity>
        </View>

        {/* Image Gallery Header with Slider */}
        <View style={styles.imageHeader}>
          {images.length > 0 ? (
            <>
              <ScrollView
                ref={imageScrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                  if (index !== currentImageIndex) {
                    setCurrentImageIndex(index);
                  }
                }}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
                  setCurrentImageIndex(index);
                }}
                style={styles.imageScrollView}
                contentContainerStyle={styles.imageScrollContent}
              >
                {images.map((image, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageContainer}
                    activeOpacity={0.9}
                    onPress={() => setShowImageModal(true)}
                  >
                    <ExpoImage
                      source={{ uri: image.image_url }}
                      style={styles.headerImage}
                      contentFit="cover"
                      placeholder={require('@/app/Ellipse 1.png')}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {/* Navigation Buttons */}
              {images.length > 1 && (
                <View style={styles.imageNavButtonsContainer}>
                  {currentImageIndex > 0 && (
                    <TouchableOpacity
                      style={[styles.imageNavButton, styles.imageNavButtonLeft]}
                      onPress={() => {
                        const newIndex = currentImageIndex - 1;
                        setCurrentImageIndex(newIndex);
                        imageScrollViewRef.current?.scrollTo({
                          x: newIndex * Dimensions.get('window').width,
                          animated: true,
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                  {currentImageIndex < images.length - 1 && (
                    <TouchableOpacity
                      style={[styles.imageNavButton, styles.imageNavButtonRight]}
                      onPress={() => {
                        const newIndex = currentImageIndex + 1;
                        setCurrentImageIndex(newIndex);
                        imageScrollViewRef.current?.scrollTo({
                          x: newIndex * Dimensions.get('window').width,
                          animated: true,
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              {/* Image Navigation Dots */}
              {images.length > 1 && (
                <View style={styles.imageDotsContainer}>
                  {images.map((_, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setCurrentImageIndex(index);
                        imageScrollViewRef.current?.scrollTo({
                          x: index * Dimensions.get('window').width,
                          animated: true,
                        });
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.imageDot,
                          index === currentImageIndex && styles.imageDotActive,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.imageOverlay}>
                <View style={styles.imageCountContainer}>
                  <Icon name="chevron-right" size={24} color="#F5F5F5" />
                  <ThemedText style={styles.imageCountText}>
                    {images.length} تصویر
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/home');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={28} color="#333333" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={[styles.headerImage, styles.placeholderImage]}>
              <ThemedText style={styles.placeholderText}>بدون عکس</ThemedText>
            </View>
          )}
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>{ad.title}</ThemedText>
        </View>

        {/* Date and Time */}
        <View style={styles.dateContainer}>
          <ThemedText style={styles.dateText}>
            {`${dateParts.date} ساعت ${dateParts.time}`}
          </ThemedText>
        </View>

        {/* Main Info Card - Only show if at least one field exists */}
        {(ad.land_area || ad.build_year || ad.room_count) ? (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              {ad.land_area ? (
                <>
                  <View style={styles.infoItem}>
                    <ThemedText style={styles.infoLabel}>متراژ زمین</ThemedText>
                    <ThemedText style={styles.infoValue}>
                      {ad.land_area} متر
                    </ThemedText>
                  </View>
                  {(ad.build_year || ad.room_count) ? <View style={styles.infoDivider} /> : null}
                </>
              ) : null}
              {ad.build_year ? (
                <>
                  <View style={styles.infoItem}>
                    <ThemedText style={styles.infoLabel}>سال ساخت</ThemedText>
                    <ThemedText style={styles.infoValue}>{ad.build_year}</ThemedText>
                  </View>
                  {ad.room_count ? <View style={styles.infoDivider} /> : null}
                </>
              ) : null}
              {ad.room_count ? (
                <View style={styles.infoItem}>
                  <ThemedText style={styles.infoLabel}>تعداد اتاق</ThemedText>
                  <ThemedText style={styles.infoValue}>{ad.room_count}</ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Location and Category - Only show if exists */}
        {(ad.location || ad.category_name) ? (
          <View style={styles.detailsCard}>
            {ad.location ? (
              <ThemedText style={styles.detailRow}>
                مکان: {ad.location}
              </ThemedText>
            ) : null}
            {ad.category_name ? (
              <ThemedText style={styles.detailRow}>
                دسته‌بندی: {ad.category_name}
              </ThemedText>
            ) : null}
          </View>
        ) : null}

        {/* Price and Details Card */}
        <View style={styles.detailsCard}>
          <ThemedText style={styles.detailRow}>
            تصویرها برای همین ملک است؟ {ad.images_belong_to_property === 1 ? 'بله' : 'خیر'}
          </ThemedText>
          <ThemedText style={styles.detailRow}>
            قیمت کل: {formatPrice(ad.price)}
          </ThemedText>
          {pricePerMeter > 0 ? (
            <ThemedText style={styles.detailRow}>
              قیمت هر متر: {formatPrice(pricePerMeter)}
            </ThemedText>
          ) : null}
          {ad.room_count ? (
            <ThemedText style={styles.detailRow}>
              تعداد اتاق: {ad.room_count}
            </ThemedText>
          ) : null}
          {ad.build_year ? (
            <ThemedText style={styles.detailRow}>
              سال ساخت: {ad.build_year}
            </ThemedText>
          ) : null}
          {otherFeatures.floor_type ? (
            <ThemedText style={styles.detailRow}>
              نوع کف: {otherFeatures.floor_type}
            </ThemedText>
          ) : null}
          {otherFeatures.bathroom_count ? (
            <ThemedText style={styles.detailRow}>
              تعداد سرویس بهداشتی: {otherFeatures.bathroom_count}
            </ThemedText>
          ) : null}
          {otherFeatures.building_direction ? (
            <ThemedText style={styles.detailRow}>
              جهت ساختمان: {otherFeatures.building_direction}
            </ThemedText>
          ) : null}
          {otherFeatures.cooling_system ? (
            <ThemedText style={styles.detailRow}>
              سیستم سرمایش: {otherFeatures.cooling_system}
            </ThemedText>
          ) : null}
          {otherFeatures.heating_system ? (
            <ThemedText style={styles.detailRow}>
              سیستم گرمایش: {otherFeatures.heating_system}
            </ThemedText>
          ) : null}
          {otherFeatures.document_type ? (
            <ThemedText style={styles.detailRow}>
              نوع سند: {otherFeatures.document_type}
            </ThemedText>
          ) : null}
        </View>

        {/* Features Section - Only show if there are features */}
        {(ad.has_parking === '1' || ad.has_elevator === '1' || ad.has_storage === '1' || 
          otherFeatures.has_yard || otherFeatures.has_pool || otherFeatures.has_jacuzzi || otherFeatures.has_sauna) ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>ویژگی‌ها و امکانات</ThemedText>
            </View>

            <View style={styles.featuresCard}>
              <View style={styles.featureRow}>
                {ad.has_parking === '1' && (
                  <View style={styles.featureItem}>
                    <MaterialIcons name="local-parking" size={24} color="#333333" />
                    <ThemedText style={styles.featureText}>پارکینگ</ThemedText>
                  </View>
                )}
                {ad.has_elevator === '1' && (
                  <View style={styles.featureItem}>
                    <MaterialIcons name="elevator" size={24} color="#333333" />
                    <ThemedText style={styles.featureText}>آسانسور</ThemedText>
                  </View>
                )}
                {ad.has_storage === '1' && (
                  <View style={styles.featureItem}>
                    <MaterialIcons name="inventory" size={24} color="#333333" />
                    <ThemedText style={styles.featureText}>انباری</ThemedText>
                  </View>
                )}
                {otherFeatures.has_yard ? (
                  <View style={styles.featureItem}>
                    <MaterialIcons name="yard" size={24} color="#333333" />
                    <ThemedText style={styles.featureText}>حیاط</ThemedText>
                  </View>
                ) : null}
                {otherFeatures.has_pool ? (
                  <View style={styles.featureItem}>
                    <MaterialIcons name="pool" size={24} color="#333333" />
                    <ThemedText style={styles.featureText}>استخر</ThemedText>
                  </View>
                ) : null}
                {otherFeatures.has_jacuzzi ? (
                  <View style={styles.featureItem}>
                    <MaterialIcons name="hot-tub" size={24} color="#333333" />
                    <ThemedText style={styles.featureText}>جکوزی</ThemedText>
                  </View>
                ) : null}
                {otherFeatures.has_sauna ? (
                  <View style={styles.featureItem}>
                    <MaterialIcons name="hot-tub" size={24} color="#333333" />
                    <ThemedText style={styles.featureText}>سونا</ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
          </>
        ) : null}

        {/* Review / Expert Request Section */}
        <TouchableOpacity
          style={styles.reviewCard}
          onPress={handleExpertRequest}
          activeOpacity={0.8}
          disabled={requestingExpert}
        >
          <View style={styles.reviewHeader}>
            <ThemedText style={styles.reviewTitle}>
              {requestingExpert ? 'در حال ثبت درخواست...' : 'درخواست کارشناسی این آگهی'}
            </ThemedText>
            <Icon name="chevron-right" size={24} color="#F5F5F5" />
          </View>
        </TouchableOpacity>

        {/* Video Section */}
        {ad.video_url ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>ویدیو</ThemedText>
            </View>
            <View style={styles.videoCard}>
              <TouchableOpacity
                style={styles.videoButton}
                onPress={() => Linking.openURL(ad.video_url!)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="play-circle-filled" size={48} color="#E7002B" />
                <ThemedText style={styles.videoText}>مشاهده ویدیو</ThemedText>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {/* Description Section - Only show if description exists */}
        {(ad.description && ad.description.trim()) ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>توضیحات</ThemedText>
            </View>

            <View style={styles.descriptionCard}>
              <ThemedText style={styles.descriptionText}>
                {ad.description}
              </ThemedText>
            </View>
          </>
        ) : null}

        {/* User Info Section - Only show if user info exists */}
        {(ad.user_phone || ad.user_name) ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>اطلاعات آگهی گذار</ThemedText>
            </View>

            <View style={styles.userInfoCard}>
              {ad.user_name ? (
                <ThemedText style={styles.userInfoRow}>
                  نام: {ad.user_name}
                </ThemedText>
              ) : null}
              {ad.user_phone ? (
                <ThemedText style={styles.userInfoRow}>
                  شماره تماس: {ad.user_phone}
                </ThemedText>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Action Buttons */}
        {user?.is_admin ? (
          <View style={styles.adminActionsContainer}>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.approveButton,
                  (updating || ad.status === 'approved') && styles.buttonDisabled,
                ]}
                onPress={() => handleStatusUpdateClick('approved')}
                disabled={updating || ad.status === 'approved'}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.approveButtonText}>تأیید آگهی</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rejectButton,
                  (updating || ad.status === 'rejected') && styles.buttonDisabled,
                ]}
                onPress={() => handleStatusUpdateClick('rejected')}
                disabled={updating || ad.status === 'rejected'}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.rejectButtonText}>رد آگهی</ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.featuredButton,
                ad.is_featured === 1 && styles.featuredButtonActive,
                togglingFeatured && styles.buttonDisabled,
              ]}
              onPress={handleToggleFeatured}
              disabled={togglingFeatured}
              activeOpacity={0.8}
            >
              <ThemedText style={[
                styles.featuredButtonText,
                ad.is_featured === 1 && styles.featuredButtonTextActive,
              ]}>
                {ad.is_featured === 1 ? '⭐ آگهی ویژه' : '☆ ویژه کردن'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.userActionsContainer}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactInfo}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.contactButtonText}>اطلاعات تماس</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelStatusUpdate}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCancelStatusUpdate}
              activeOpacity={0.7}
            >
              <MaterialIcons name="close" size={20} color="#333333" />
            </TouchableOpacity>

            {/* Warning Icon */}
            <View style={styles.modalIconContainer}>
              <Svg width={24} height={20} viewBox="0 0 24 20" fill="none">
                <Path
                  d="M11.6437 2.33482C11.7188 2.21429 11.8547 2.14286 12 2.14286C12.1453 2.14286 12.2812 2.21429 12.3563 2.33482L21.6516 16.875C21.7172 16.9777 21.75 17.0938 21.75 17.2098C21.75 17.567 21.4453 17.8571 21.0703 17.8571H2.92969C2.55469 17.8571 2.25 17.567 2.25 17.2098C2.25 17.0893 2.28281 16.9732 2.34844 16.875L11.6437 2.33482ZM9.72187 1.21875L0.426563 15.7589C0.145313 16.1964 0 16.6964 0 17.2098C0 18.75 1.3125 20 2.92969 20H21.0703C22.6875 20 24 18.75 24 17.2098C24 16.6964 23.85 16.1964 23.5734 15.7589L14.2781 1.21875C13.7953 0.464286 12.9328 0 12 0C11.0672 0 10.2047 0.464286 9.72187 1.21875ZM13.5 15C13.5 14.6211 13.342 14.2578 13.0607 13.9898C12.7794 13.7219 12.3978 13.5714 12 13.5714C11.6022 13.5714 11.2206 13.7219 10.9393 13.9898C10.658 14.2578 10.5 14.6211 10.5 15C10.5 15.3789 10.658 15.7422 10.9393 16.0102C11.2206 16.2781 11.6022 16.4286 12 16.4286C12.3978 16.4286 12.7794 16.2781 13.0607 16.0102C13.342 15.7422 13.5 15.3789 13.5 15ZM13.125 6.78571C13.125 6.19196 12.6234 5.71429 12 5.71429C11.3766 5.71429 10.875 6.19196 10.875 6.78571V11.0714C10.875 11.6652 11.3766 12.1429 12 12.1429C12.6234 12.1429 13.125 11.6652 13.125 11.0714V6.78571Z"
                  fill="#212121"
                />
              </Svg>
            </View>

            {/* Title */}
            <ThemedText style={styles.modalTitle}>
              {pendingStatus === 'approved' ? 'تأیید انتشار آگهی' : 'رد آگهی'}
            </ThemedText>

            {/* Message */}
            {pendingStatus === 'approved' ? (
              <ThemedText style={styles.modalMessage}>
                آیا مطمئن هستید که می‌خواهید این آگهی منتشر شود؟ پس از تأیید، آگهی برای عموم کاربران نمایش داده خواهد شد.
              </ThemedText>
            ) : (
              <>
                <ThemedText style={styles.modalMessage}>
                  برای رد کردن آگهی، یکی از دلایل زیر را انتخاب کنید تا برای کاربر ارسال شود.
                </ThemedText>

                {/* Rejection Reasons List */}
                <View style={styles.rejectionReasonsContainer}>
                  {rejectionReasons.map((reason, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.rejectionReasonItem,
                        selectedRejectionReason === reason && styles.rejectionReasonItemSelected,
                      ]}
                      onPress={() => setSelectedRejectionReason(reason)}
                      activeOpacity={0.7}
                    >
                      <ThemedText
                        style={[
                          styles.rejectionReasonText,
                          selectedRejectionReason === reason && styles.rejectionReasonTextSelected,
                        ]}
                      >
                        {reason}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={handleCancelStatusUpdate}
                activeOpacity={0.8}
              >
                <ThemedText style={styles.modalCancelButtonText}>لغو</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalConfirmButton,
                  pendingStatus === 'rejected' && !selectedRejectionReason && styles.modalButtonDisabled,
                ]}
                onPress={handleConfirmStatusUpdate}
                activeOpacity={0.8}
                disabled={updating || (pendingStatus === 'rejected' && !selectedRejectionReason)}
              >
                <ThemedText style={styles.modalConfirmButtonText}>
                  {pendingStatus === 'approved' ? 'تأیید' : 'تأیید'}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Contact Info Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <TouchableOpacity
          style={styles.contactModalOverlay}
          activeOpacity={1}
          onPress={() => setShowContactModal(false)}
        >
          <TouchableOpacity
            style={styles.contactModalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.contactModalHeader}>
              <ThemedText style={styles.contactModalTitle}>شماره موبایل</ThemedText>
              <ThemedText style={styles.contactModalPhone}>
                {typeof ad?.user_phone === 'string' && ad.user_phone.trim() ? ad.user_phone : 'شماره تماس موجود نیست'}
              </ThemedText>
            </View>

            {/* Warning Message */}
            <View style={styles.contactWarningBox}>
              <MaterialIcons name="info-outline" size={24} color="#333333" />
              <ThemedText style={styles.contactWarningText}>
                درخواست بیعانه از نشانه‌های کلاهبرداری است
              </ThemedText>
            </View>

            {/* Call Button */}
            <TouchableOpacity
              style={styles.contactCallButton}
              onPress={handleCall}
              activeOpacity={0.8}
              disabled={!(typeof ad?.user_phone === 'string' && ad.user_phone.trim())}
            >
              <ThemedText style={styles.contactCallButtonText}>تماس</ThemedText>
            </TouchableOpacity>
          </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

      {/* Image Slider Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseButton}
            onPress={() => setShowImageModal(false)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <ScrollView
            ref={imageModalScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              if (index !== currentImageIndex) {
                setCurrentImageIndex(index);
              }
            }}
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / Dimensions.get('window').width);
              setCurrentImageIndex(index);
            }}
            style={styles.imageModalScrollView}
            contentContainerStyle={styles.imageModalScrollContent}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.imageModalImageContainer}>
                <ExpoImage
                  source={{ uri: image.image_url }}
                  style={styles.imageModalImage}
                  contentFit="contain"
                />
              </View>
            ))}
          </ScrollView>
          {images.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <TouchableOpacity
                  style={[styles.imageModalNavButton, styles.imageModalNavButtonLeft]}
                  onPress={() => {
                    const newIndex = currentImageIndex - 1;
                    setCurrentImageIndex(newIndex);
                    imageModalScrollViewRef.current?.scrollTo({
                      x: newIndex * Dimensions.get('window').width,
                      animated: true,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="chevron-right" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              {currentImageIndex < images.length - 1 && (
                <TouchableOpacity
                  style={[styles.imageModalNavButton, styles.imageModalNavButtonRight]}
                  onPress={() => {
                    const newIndex = currentImageIndex + 1;
                    setCurrentImageIndex(newIndex);
                    imageModalScrollViewRef.current?.scrollTo({
                      x: newIndex * Dimensions.get('window').width,
                      animated: true,
                    });
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="chevron-left" size={32} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              <View style={styles.imageModalDotsContainer}>
                {images.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setCurrentImageIndex(index);
                      imageModalScrollViewRef.current?.scrollTo({
                        x: index * Dimensions.get('window').width,
                        animated: true,
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.imageModalDot,
                        index === currentImageIndex && styles.imageModalDotActive,
                      ]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(241, 248, 244, 1)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#E7002B',
    textAlign: 'center',
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHeader: {
    width: '100%',
    height: 190,
    position: 'relative',
    overflow: 'hidden',
  },
  imageScrollView: {
    width: '100%',
    height: 190,
  },
  imageScrollContent: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: Dimensions.get('window').width,
    height: 190,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#757575',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  imageCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    gap: 8,
  },
  imageCountText: {
    fontFamily: 'Vazir-Light',
    fontSize: 14,
    color: '#FFFFFF',
  },
  closeButton: {
    width: 28,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Vazir-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 21,
  },
  dateContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dateText: {
    fontFamily: 'Vazir-Light',
    fontSize: 14,
    color: '#928383',
    textAlign: 'right',
    lineHeight: 21,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: 'Vazir-Light',
    fontSize: 14,
    color: '#928383',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoValue: {
    fontFamily: 'Vazir-Light',
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  infoDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#D3D3D3',
  },
  detailsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#757575',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 21,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 21,
  },
  featuresCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontFamily: 'Vazir',
    fontSize: 12,
    color: '#333333',
    marginTop: 8,
    textAlign: 'center',
  },
  reviewCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    minHeight: 53,
    justifyContent: 'center',
  },
  reviewHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewTitle: {
    fontFamily: 'Vazir-Medium',
    fontSize: 12,
    color: '#333333',
    textAlign: 'right',
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    minHeight: 235,
  },
  descriptionText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#757575',
    textAlign: 'right',
    lineHeight: 21,
  },
  userInfoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#D3D3D3',
    borderRadius: 8,
    padding: 16,
  },
  userInfoRow: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#212121',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 21,
  },
  adminActionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  userActionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  contactButton: {
    width: '100%',
    backgroundColor: '#E7002B',
    borderRadius: 34,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 25,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#E7002B',
    borderRadius: 34,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E7002B',
    borderRadius: 34,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  approveButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 25,
  },
  rejectButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    fontWeight: '500',
    color: '#E7002B',
    lineHeight: 25,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  featuredButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E7002B',
    borderRadius: 34,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredButtonActive: {
    backgroundColor: '#E7002B',
    borderColor: '#E7002B',
  },
  featuredButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    fontWeight: '500',
    color: '#E7002B',
    lineHeight: 25,
  },
  featuredButtonTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalIconContainer: {
    marginTop: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 21,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 40,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E7002B',
  },
  modalConfirmButton: {
    backgroundColor: '#E7002B',
  },
  modalCancelButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    fontWeight: '500',
    color: '#E7002B',
  },
  modalConfirmButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  rejectionReasonsContainer: {
    width: '100%',
    marginTop: 16,
    marginBottom: 24,
    gap: 12,
  },
  rejectionReasonItem: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  rejectionReasonItemSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#E7002B',
    borderWidth: 1,
  },
  rejectionReasonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#333333',
    textAlign: 'right',
    lineHeight: 21,
  },
  rejectionReasonTextSelected: {
    color: '#E7002B',
  },
  contactModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contactModalContent: {
    backgroundColor: '#FAFAFA',
    borderRadius: 24,
    width: '100%',
    maxWidth: 398,
    padding: 16,
    alignItems: 'center',
  },
  contactModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  contactModalTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 25,
  },
  contactModalPhone: {
    fontFamily: 'Vazir-Light',
    fontSize: 16,
    fontWeight: '300',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 24,
  },
  contactWarningBox: {
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  contactWarningText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 18,
    flex: 1,
  },
  contactCallButton: {
    width: '100%',
    backgroundColor: '#E7002B',
    borderRadius: 34,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  contactCallButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  imageNavButtonsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // pointerEvents فقط روی native؛ روی web باعث هشدار می‌شود
    ...(Platform.OS !== 'web' ? { pointerEvents: 'box-none' as const } : {}),
  },
  imageDotsContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    ...(Platform.OS !== 'web' ? { pointerEvents: 'box-none' as const } : {}),
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  imageNavButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  imageNavButtonLeft: {
    right: 16,
  },
  imageNavButtonRight: {
    left: 16,
  },
  extraFeaturesRow: {
    marginTop: 8,
  },
  videoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  videoText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#E7002B',
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalScrollView: {
    flex: 1,
  },
  imageModalScrollContent: {
    flexDirection: 'row',
  },
  imageModalImageContainer: {
    width: Dimensions.get('window').width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
  },
  imageModalNavButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
    zIndex: 10,
  },
  imageModalNavButtonLeft: {
    right: 20,
  },
  imageModalNavButtonRight: {
    left: 20,
  },
  imageModalDotsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imageModalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageModalDotActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
});

