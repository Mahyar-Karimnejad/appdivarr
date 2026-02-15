// صفحه پروفایل ادمین

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/src/components/common/Button';
import { Icon } from '@/src/components/common/Icon';
import type { User } from '@/src/services/auth';
import { updateProfile } from '@/src/services/auth';
import { clearAuth, getToken, getUser, saveUser } from '@/src/utils/storage';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
        // Parse display_name to first and last name
        const nameParts = userData.display_name?.split(' ') || [];
        setFirstName(nameParts[0] || '');
        setLastName(nameParts.slice(1).join(' ') || '');
        // Load phone number from user data
        setPhoneNumber(userData.phone_number || '');
        // Load profile image from user data
        setProfileImage(userData.profile_image || null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      Alert.alert('خطا', 'خطا در بارگذاری اطلاعات کاربر');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // For web, use FileReader API (completely bypass expo-image-picker)
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
            
            // Check file type
            if (!file.type.startsWith('image/')) {
              Alert.alert('خطا', 'لطفاً یک فایل تصویری انتخاب کنید');
              resolve();
              return;
            }
            
            const reader = new FileReader();
            reader.onload = (event: ProgressEvent<FileReader>) => {
              const dataUri = event.target?.result as string;
              if (dataUri) {
                setProfileImage(dataUri);
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
      // Only import on mobile platforms
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
          aspect: [1, 1],
          quality: 0.8,
          base64: true, // Enable base64 encoding
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          // If base64 is available, use it; otherwise use URI
          if (asset.base64) {
            // Create data URI with base64
            const mimeType = asset.type || 'image/jpeg';
            const dataUri = `data:${mimeType};base64,${asset.base64}`;
            setProfileImage(dataUri);
          } else {
            setProfileImage(asset.uri);
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطا', 'خطا در انتخاب تصویر');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!firstName.trim()) {
      Alert.alert('خطا', 'لطفاً نام خود را وارد کنید');
      return;
    }

    setSaving(true);
    try {
      console.log('📤 Sending profile update request...');
      console.log('📤 Data:', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        profileImage: profileImage || undefined,
      });

      const response = await updateProfile(
        firstName.trim(),
        lastName.trim(),
        phoneNumber.trim() || undefined,
        profileImage || undefined
      );

      console.log('📥 Profile update response:', response);
      console.log('📥 Response success:', response.success);
      console.log('📥 Response user:', response.user);

      if (response.success) {
        if (response.user) {
          await saveUser(response.user);
          setUser(response.user);
          // به‌روزرسانی profileImage state از response.user
          setProfileImage(response.user.profile_image || null);
        } else {
          // اگر user برنگشت، user فعلی را با display_name جدید بروزرسانی کن
          const updatedUser: User = {
            ...user,
            display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          };
          await saveUser(updatedUser);
          setUser(updatedUser);
        }

        Alert.alert('موفق', 'اطلاعات پروفایل با موفقیت بروزرسانی شد', [
          {
            text: 'باشه',
            onPress: () => {
              // Try to go back, if not possible, go to appropriate home based on user role
              if (router.canGoBack()) {
                router.back();
              } else {
                // Navigate based on user role
                const currentUser = response.user || user;
                if (currentUser?.is_admin) {
                  router.replace('/admin');
                } else {
                  router.replace('/home');
                }
              }
            },
          },
        ]);
      } else {
        console.error('❌ Profile update failed:', response.message);
        Alert.alert('خطا', response.message || 'خطا در بروزرسانی اطلاعات پروفایل');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      Alert.alert('خطا', 'خطا در بروزرسانی اطلاعات پروفایل');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'خروج از حساب کاربری',
      'آیا مطمئن هستید که می‌خواهید از حساب کاربری خود خارج شوید؟',
      [
        {
          text: 'لغو',
          style: 'cancel',
        },
        {
          text: 'خروج',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🔄 Starting logout process...');
              
              // Clear auth data first
              await clearAuth();
              console.log('✅ Auth cleared successfully');
              
              // Verify that auth is cleared
              const token = await getToken();
              const user = await getUser();
              console.log('🔍 Verification - Token:', token, 'User:', user);
              
              // Navigate to index which will check auth and redirect to login
              // This is more reliable than going directly to login
              console.log('🔄 Navigating to index...');
              router.replace('/' as any);
              
            } catch (error) {
              console.error('❌ Error during logout:', error);
              // Even if there's an error, try to navigate
              router.replace('/' as any);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E7002B" />
          <ThemedText style={styles.loadingText}>در حال بارگذاری...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>خطا در بارگذاری اطلاعات کاربر</ThemedText>
          <Button
            title="بازگشت"
            onPress={() => router.back()}
            variant="primary"
            size="medium"
          />
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
              // Try to go back, if not possible, go to appropriate home based on user role
              if (router.canGoBack()) {
                router.back();
              } else {
                // Navigate based on user role
                if (user?.is_admin) {
                  router.replace('/admin');
                } else {
                  router.replace('/home');
                }
              }
            }}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.backButtonText}>بازگشت</ThemedText>
            <Icon name="arrow-left" size={18} color="#E7002B" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>پروفایل</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity
            style={styles.profileImageWrapper}
            onPress={handlePickImage}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <ExpoImage
                source={{ uri: profileImage }}
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
            <View style={styles.editImageOverlay}>
              <ThemedText style={styles.editImageText}>ویرایش</ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* First Name */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>نام</ThemedText>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="نام خود را وارد کنید"
              placeholderTextColor="#9E9E9E"
              textAlign="right"
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>نام خانوادگی</ThemedText>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="نام خانوادگی خود را وارد کنید"
              placeholderTextColor="#9E9E9E"
              textAlign="right"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>شماره تماس</ThemedText>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="شماره تماس خود را وارد کنید"
              placeholderTextColor="#9E9E9E"
              keyboardType="phone-pad"
              textAlign="right"
            />
          </View>

          {/* Email (Read Only) */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>ایمیل</ThemedText>
            <View style={[styles.input, styles.inputDisabled]}>
              <ThemedText style={styles.inputDisabledText}>{user.email}</ThemedText>
            </View>
          </View>
        </View>

        {/* Menu Items for Admin */}
        {user?.is_admin && (
          <View style={styles.menuContainer}>
            {/* دسته‌بندی‌ها */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/categories-management' as any)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.menuItemText}>دسته‌بندی‌ها</ThemedText>
              <Icon name="arrow-left" size={17} color="#00964E" />
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <View style={styles.menuContainer}>
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

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <Button
            title="ذخیره تغییرات"
            onPress={handleSave}
            variant="primary"
            size="large"
            loading={saving}
            disabled={saving}
          />
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#757575',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 8,
  },
  backButtonText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    marginBottom: -5,
    color: '#E7002B',
  },
  headerTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  headerSpacer: {
    width: 60,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  profileImageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    alignItems: 'center',
  },
  editImageText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  formContainer: {
    paddingHorizontal: 16,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#333333',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Vazir-Medium',
    color: '#333333',
    minHeight: 48,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  inputDisabledText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#757575',
    textAlign: 'left',
  },
  menuContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
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
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
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
  saveButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 32,
    marginBottom: 40,
    alignItems: 'center',
  },
});

