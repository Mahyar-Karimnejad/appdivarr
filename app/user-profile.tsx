// صفحه پروفایل کاربر عادی

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/src/components/common/Icon';
import { CollapsibleAdsTab } from '@/src/components/dashboards/CollapsibleAdsTab';
import type { Ad } from '@/src/services/ads';
import type { User } from '@/src/services/auth';
import { uploadBanner } from '@/src/services/banners';
import { clearAuth, getToken, getUser } from '@/src/utils/storage';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    // باز کردن صفحه ویرایش (همان صفحه profile.tsx فعلی)
    router.push('/profile' as any);
  };

  const handleAdPress = (ad: Ad) => {
    router.push({
      pathname: '/ad-detail',
      params: { id: String(ad.id) },
    } as any);
  };

  const handlePickBannerImage = async () => {
    try {
      // For web, use FileReader API
      if (Platform.OS === 'web') {
        return new Promise<void>((resolve, reject) => {
          if (typeof document === 'undefined') {
            reject(new Error('Document is not available'));
            return;
          }

          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.style.display = 'none';
          
          const cleanup = () => {
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
          };
          
          input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            cleanup();
            
            if (!file) {
              resolve();
              return;
            }
            
            if (!file.type.startsWith('image/')) {
              Alert.alert('خطا', 'لطفاً یک فایل تصویری انتخاب کنید');
              resolve();
              return;
            }
            
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
              const dataUri = event.target?.result as string;
              if (dataUri) {
                setBannerImage(dataUri);
                setBannerModalVisible(true);
              }
              resolve();
            };
            reader.onerror = () => {
              Alert.alert('خطا', 'خطا در خواندن فایل تصویر');
              reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
          };
          
          input.oncancel = () => {
            cleanup();
            resolve();
          };
          
          document.body.appendChild(input);
          input.click();
        });
      }
      
      // For mobile (iOS/Android), use expo-image-picker
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const ImagePicker = await import('expo-image-picker');
        
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('خطا', 'دسترسی به گالری تصاویر لازم است');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [16, 9], // Banner aspect ratio
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          if (asset.base64) {
            const mimeType = asset.type || 'image/jpeg';
            const dataUri = `data:${mimeType};base64,${asset.base64}`;
            setBannerImage(dataUri);
            setBannerModalVisible(true);
          } else if (asset.uri) {
            setBannerImage(asset.uri);
            setBannerModalVisible(true);
          }
        }
      }
    } catch (error) {
      console.error('Error picking banner image:', error);
      Alert.alert('خطا', 'خطا در انتخاب تصویر');
    }
  };

  const handleUploadBanner = async () => {
    if (!bannerImage) {
      Alert.alert('خطا', 'لطفاً یک تصویر انتخاب کنید');
      return;
    }

    setUploadingBanner(true);
    try {
      const response = await uploadBanner(bannerImage);
      if (response.success) {
        Alert.alert('موفق', 'بنر با موفقیت آپلود شد و در انتظار تأیید است');
        setBannerModalVisible(false);
        setBannerImage(null);
      } else {
        Alert.alert('خطا', response.message || 'خطا در آپلود بنر');
      }
    } catch (error: any) {
      console.error('Error uploading banner:', error);
      Alert.alert('خطا', 'خطا در آپلود بنر');
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleAbout = () => {
    router.push('/about' as any);
  };

  const handleRules = () => {
    router.push('/rules' as any);
  };

  const handleSupport = () => {
    // TODO: Navigate to support page
    Alert.alert('اطلاعیه', 'صفحه پشتیبانی به زودی اضافه می‌شود');
  };

  const handleLogout = async () => {
    console.log('🔴 handleLogout called!');
    
    // First, try to clear auth immediately without Alert (for testing)
    try {
      console.log('🔄 Starting logout process immediately...');
      
      // Clear auth data first
      await clearAuth();
      console.log('✅ Auth cleared successfully');
      
      // Verify that auth is cleared
      const token = await getToken();
      const user = await getUser();
      console.log('🔍 Verification - Token:', token, 'User:', user);
      
      // Navigate to index which will check auth and redirect to login
      console.log('🔄 Navigating to index...');
      router.replace('/' as any);
      
      // Also try navigating to login directly as fallback
      setTimeout(() => {
        console.log('🔄 Fallback: Navigating to login...');
        router.replace('/login' as any);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error during logout:', error);
      // Even if there's an error, try to navigate
      router.replace('/' as any);
      router.replace('/login' as any);
    }
    
    // Show Alert after navigation (optional confirmation)
    Alert.alert(
      'خروج از حساب کاربری',
      'شما از حساب کاربری خود خارج شدید',
      [
        {
          text: 'باشه',
          onPress: () => {
            console.log('Alert dismissed');
          },
        },
      ]
    );
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>در حال بارگذاری...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/home' as any);
              }
            }}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={28} color="#333333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>حساب کاربری</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <View style={styles.profileCardContent}>
            {/* Profile Image - Right */}
            <View style={styles.profileImageContainer}>
              {user.profile_image ? (
                <ExpoImage
                  source={{ uri: user.profile_image }}
                  style={styles.profileImage}
                  contentFit="cover"
                />
              ) : (
                <Image
                  source={require('@/assets/images/generic user.png')}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Phone Number - Center */}
            <ThemedText style={styles.phoneNumber}>
              {user.phone_number || 'شماره تماس ثبت نشده'}
            </ThemedText>

            {/* Edit Button and Chevron - Left */}
            <View style={styles.editSection}>
              <ThemedText style={styles.editButtonText}>ویرایش</ThemedText>
              <Icon name="arrow-left" size={17} color="#FF4C4C" />
            </View>
          </View>
        </TouchableOpacity>

        {/* آگهی‌های من - با دیزاین AdminDashboard */}
        <View style={styles.myAdsContainer}>
          <CollapsibleAdsTab
            status="pending"
            icon="clipboard-list"
            title="آگهی‌های در انتظار تأیید"
            onAdPress={handleAdPress}
            useMyAds={true}
          />
          
          <CollapsibleAdsTab
            status="approved"
            icon="check-double"
            title="آگهی‌های تأیید شده"
            onAdPress={handleAdPress}
            useMyAds={true}
          />
          
          <CollapsibleAdsTab
            status="rejected"
            icon="xmark-to-slot"
            title="آگهی‌های رد شده"
            onAdPress={handleAdPress}
            useMyAds={true}
          />
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>

          {/* درباره پاتوق */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleAbout}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.menuItemText}>درباره پاتوق</ThemedText>
            <ExpoImage
              source={require('@/assets/images/circle-question 1.svg')}
              style={styles.menuIcon}
              contentFit="contain"
            />
          </TouchableOpacity>

          {/* قوانین و مقررات */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleRules}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.menuItemText}>قوانین و مقررات</ThemedText>
            <ExpoImage
              source={require('@/assets/images/circle-info 1 (1).svg')}
              style={styles.menuIcon}
              contentFit="contain"
            />
          </TouchableOpacity>

          {/* پشتیبانی */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSupport}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.menuItemText}>پشتیبانی</ThemedText>
            <ExpoImage
              source={require('@/assets/images/circle-info 1 (2).svg')}
              style={styles.menuIcon}
              contentFit="contain"
            />
          </TouchableOpacity>

          {/* خروج از حساب کاربری */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.menuItemTextDanger}>خروج از حساب کاربری</ThemedText>
            <ExpoImage
              source={require('@/assets/images/right-from-bracket 1.svg')}
              style={styles.menuIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <TouchableOpacity
          style={styles.bannerContainer}
          onPress={handlePickBannerImage}
          activeOpacity={0.8}
        >
          {bannerImage ? (
            <ExpoImage
              source={{ uri: bannerImage }}
              style={styles.bannerImage}
              contentFit="cover"
            />
          ) : (
            <ThemedText style={styles.bannerText}>بنر تبلیغاتی</ThemedText>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Banner Upload Modal */}
      <Modal
        visible={bannerModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBannerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>آپلود بنر تبلیغاتی</ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setBannerModalVisible(false);
                  setBannerImage(null);
                }}
                style={styles.modalCloseButton}
              >
                <Icon name="xmark" size={24} color="#333333" />
              </TouchableOpacity>
            </View>

            {bannerImage && (
              <View style={styles.modalImageContainer}>
                <ExpoImage
                  source={{ uri: bannerImage }}
                  style={styles.modalImage}
                  contentFit="contain"
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setBannerModalVisible(false);
                  setBannerImage(null);
                }}
                disabled={uploadingBanner}
              >
                <ThemedText style={styles.modalButtonTextCancel}>انصراف</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleUploadBanner}
                disabled={uploadingBanner}
              >
                {uploadingBanner ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.modalButtonTextConfirm}>آپلود</ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation - با SafeArea برای اندروید */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom }]}>
        {/* خانه */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.replace('/home' as any)}
        >
          <ExpoImage
            source={require('@/assets/images/Vector (2).svg')}
            style={styles.navIcon}
            contentFit="contain"
            tintColor="#333333"
          />
          <ThemedText style={styles.navItemText}>خانه</ThemedText>
        </TouchableOpacity>

        <View style={styles.navDivider} />

        {/* ثبت آگهی */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/post-ad' as any)}
        >
          <ExpoImage
            source={require('@/assets/images/Vector (1).svg')}
            style={styles.navIcon}
            contentFit="contain"
            tintColor="#333333"
          />
          <ThemedText style={styles.navItemText}>افزودن</ThemedText>
        </TouchableOpacity>

        <View style={styles.navDivider} />

        {/* پروفایل - فعال */}
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <ExpoImage
            source={require('@/assets/images/Vector (3).svg')}
            style={styles.navIcon}
            contentFit="contain"
            tintColor="#E7002B"
          />
          <ThemedText style={styles.navItemTextActive}>پروفایل</ThemedText>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#757575',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 25,
  },
  headerSpacer: {
    width: 40,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    height: 64,
  },
  profileCardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  profileImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  phoneNumber: {
    fontFamily: 'Vazir-Light',
    fontSize: 18,
    fontWeight: '300',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 27,
    flex: 1,
    marginHorizontal: 16,
  },
  editSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  editButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: '#E7002B',
    textAlign: 'left',
    lineHeight: 21,
  },
  myAdsContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  menuContainer: {
    marginHorizontal: 16,
    gap: 8,
  },
  menuItem: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    height: 48,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  menuItemText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 21,
  },
  menuItemTextDanger: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: '#FF4C4C',
    textAlign: 'right',
    lineHeight: 21,
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  bannerContainer: {
    marginHorizontal: 32,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerText: {
    fontFamily: 'Vazir-Bold',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
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
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'right',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalImageContainer: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalButtons: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonConfirm: {
    backgroundColor: '#00964E',
  },
  modalButtonTextCancel: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  modalButtonTextConfirm: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  bottomNav: {
    position: 'absolute',
    backgroundColor: '#F1F8F4',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopWidth: 0.5,
    borderTopColor: '#D3D3D3',
    flexDirection: 'row-reverse', // I18nManager خودش RTL را اعمال می‌کند
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 0, // SafeAreaView خودش padding اضافه می‌کند
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  navItemText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'center',
    lineHeight: 18,
  },
  navItemTextActive: {
    fontFamily: 'Vazir-Medium',
    fontSize: 12,
    fontWeight: '500',
    color: '#E7002B',
    textAlign: 'center',
    lineHeight: 18,
  },
  navDivider: {
    width: 0.5,
    height: 48,
    backgroundColor: '#D3D3D3',
  },
});

