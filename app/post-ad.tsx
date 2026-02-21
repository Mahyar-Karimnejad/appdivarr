import { MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAdForm } from '@/src/contexts/AdFormContext';
import { createAd } from '@/src/services/ads';
import { Category, getCategories, getCategoryById } from '@/src/services/categories';
import { getCities, type City } from '@/src/services/cities';
import { uploadImage } from '@/src/services/media';
import { getUser } from '@/src/utils/storage';

const ROOM_OPTIONS = ['بدون اتاق', 'یک', 'دو', 'سه', 'چهار', 'پنج یا بیشتر'];
const BUILD_YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => (2024 - i).toString());
const YES_NO_OPTIONS = [
  { label: 'بله', value: 'yes' },
  { label: 'خیر', value: 'no' },
];
const IMAGES_BELONG_OPTIONS = [
  { label: 'بله', value: true },
  { label: 'خیر', value: false },
];

export default function PostAdScreen() {
  const { formData, updateFormData, resetFormData } = useAdForm();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Modal states
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [buildYearModalVisible, setBuildYearModalVisible] = useState(false);
  const [parkingModalVisible, setParkingModalVisible] = useState(false);
  const [storageModalVisible, setStorageModalVisible] = useState(false);
  const [elevatorModalVisible, setElevatorModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [imagesBelongModalVisible, setImagesBelongModalVisible] = useState(false);
  // Categories - برای نمایش نام دسته انتخاب شده
  const [categories, setCategories] = useState<Category[]>([]);
  // Cities - برای انتخاب شهر
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');

  useEffect(() => {
    // ابتدا احراز هویت را چک کن؛ اگر لاگین نیست، به صفحه لاگین با redirect برگرد
    const checkAuth = async () => {
      try {
        const user = await getUser();
        if (!user) {
          router.replace({
            pathname: '/login',
            params: { redirect: '/post-ad' },
          } as any);
          return;
        }
      } catch (error) {
        console.error('Error checking auth before opening post-ad:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();

    // بارگذاری دسته‌ها و شهرها (برای کاربر لاگین‌شده)
    loadCategories();
    loadCities();
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      loadCategoryName(formData.category_id);
    } else {
      setSelectedCategoryName('');
    }
  }, [formData.category_id]);

  const loadCategories = async () => {
    try {
      const response = await getCategories(null, true);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error: any) {
      console.error('Error loading categories:', error);
      // فقط خطاهای غیر AbortError را log کن
    }
  };

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const response = await getCities();
      if (response.success && response.data) {
        setCities(response.data);
      }
    } catch (error: any) {
      console.error('Error loading cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const loadCategoryName = async (categoryId: number) => {
    try {
      const findCategoryInState = (cats: Category[], id: number): Category | null => {
        for (const cat of cats) {
          if (cat.id === id) return cat;
          if (cat.children?.length) {
            const found = findCategoryInState(cat.children, id);
            if (found) return found;
          }
        }
        return null;
      };
      const categoryInState = findCategoryInState(categories, categoryId);
      if (categoryInState) {
        setSelectedCategoryName(categoryInState.name);
        return;
      }
      try {
        const categoryResponse = await getCategoryById(categoryId);
        if (categoryResponse.success && categoryResponse.data) {
          setSelectedCategoryName(categoryResponse.data.name);
          return;
        }
      } catch {
        // fallback to getCategories
      }
      const response = await getCategories(null, true);
      if (response.success && response.data) {
        const findCategory = (cats: Category[], id: number): Category | null => {
          for (const cat of cats) {
            if (cat.id === id) return cat;
            if (cat.children?.length) {
              const found = findCategory(cat.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        const category = findCategory(response.data, categoryId);
        if (category) {
          setSelectedCategoryName(category.name);
          setCategories(response.data);
        } else {
          setSelectedCategoryName('نامشخص');
        }
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') setSelectedCategoryName('نامشخص');
    }
  };

  if (checkingAuth) {
    // تا زمان چک کردن احراز هویت، چیزی رندر نکن
    return null;
  }

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطا', 'دسترسی به گالری تصاویر نیاز است');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        setUploadingImages(true);
        const uploadedImages = [];
        
        for (const asset of result.assets) {
          try {
            const uploadResult = await uploadImage(asset.uri);
            if (uploadResult.success && uploadResult.data) {
              uploadedImages.push({
                uri: asset.uri,
                url: uploadResult.data.url,
                alt_text: '',
              });
            }
          } catch (error) {
            console.error('Error uploading image:', error);
          }
        }
        
        updateFormData({ images: [...formData.images, ...uploadedImages] });
        setUploadingImages(false);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      setUploadingImages(false);
    }
  };

  const handleVideoPicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطا', 'دسترسی به گالری ویدیو نیاز است');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // TODO: Upload video to server
        updateFormData({ video_url: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking video:', error);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData({ images: newImages });
  };

  const handleSave = async () => {
    console.log('💾 handleSave called');
    console.log('📋 Form data:', {
      title: formData.title,
      description: formData.description,
      category_id: formData.category_id,
      location: formData.location,
      price: formData.price,
      images_belong_to_property: formData.images_belong_to_property,
      images_count: formData.images.length,
      land_area: formData.land_area,
    });
    
    // Validation - فقط فیلدهای اجباری: عکس، عنوان، توضیحات، دسته‌بندی
    const errors: string[] = [];
    
    if (!formData.images || formData.images.length === 0) {
      errors.push('• تصاویر آگهی (حداقل یک تصویر)');
    }
    if (!formData.title || !formData.title.trim()) {
      errors.push('• عنوان آگهی');
    }
    if (!formData.description || !formData.description.trim()) {
      errors.push('• توضیحات آگهی');
    }
    if (!formData.category_id) {
      errors.push('• دسته‌بندی');
    }
    
    // اگر خطایی وجود داشت، همه را یکجا نمایش بده
    if (errors.length > 0) {
      const errorMessage = 'لطفاً فیلدهای زیر را پر کنید:\n\n' + errors.join('\n');
      console.log('❌ Validation failed:', errors);
      console.log('📢 Showing alert with message:', errorMessage);
      
      // استفاده از setTimeout برای اطمینان از نمایش Alert
      setTimeout(() => {
        try {
          // برای web platform از window.alert استفاده می‌کنیم
          if (Platform.OS === 'web') {
            window.alert('خطا در ثبت آگهی\n\n' + errorMessage);
          } else {
            // برای mobile از Alert.alert استفاده می‌کنیم
            Alert.alert(
              'خطا در ثبت آگهی',
              errorMessage,
              [{ text: 'متوجه شدم', style: 'default' }],
              { cancelable: true }
            );
          }
        } catch (alertError) {
          console.error('❌ Error showing alert:', alertError);
          // Fallback: استفاده از window.alert در همه حالات
          if (typeof window !== 'undefined' && window.alert) {
            window.alert('خطا در ثبت آگهی\n\n' + errorMessage);
          }
        }
      }, 50);
      
      return;
    }

    console.log('✅ All validations passed');
    setLoading(true);
    
    try {
      // Prepare other_features JSON
      const otherFeatures: any = {};
      if (formData.building_direction) otherFeatures.building_direction = formData.building_direction;
      if (formData.floor_type) otherFeatures.floor_type = formData.floor_type;
      if (formData.bathroom_count) otherFeatures.bathroom_count = formData.bathroom_count;
      if (formData.cooling_system) otherFeatures.cooling_system = formData.cooling_system;
      if (formData.heating_system) otherFeatures.heating_system = formData.heating_system;
      if (formData.document_type) otherFeatures.document_type = formData.document_type;
      if (formData.has_yard) otherFeatures.has_yard = true;
      if (formData.has_pool) otherFeatures.has_pool = true;
      if (formData.has_jacuzzi) otherFeatures.has_jacuzzi = true;
      if (formData.has_sauna) otherFeatures.has_sauna = true;

      const adData: any = {
        category_id: formData.category_id!,
        title: formData.title.trim(),
        description: formData.description.trim(),
        // فیلدهای اختیاری - اگر خالی بودند، null یا مقدار پیش‌فرض بفرست
        location: formData.location || '',
        price: formData.price && formData.price.trim() ? parseInt(formData.price.replace(/,/g, '')) : 0,
        images_belong_to_property: formData.images_belong_to_property !== null ? (formData.images_belong_to_property ? 1 : 0) : 1, // پیش‌فرض: بله
        other_features: Object.keys(otherFeatures).length > 0 ? JSON.stringify(otherFeatures) : '',
        image_urls: formData.images
          .map(img => {
            // اگر url وجود دارد، از آن استفاده کن، در غیر این صورت از uri
            if (img.url) return { url: img.url, alt_text: img.alt_text || '' };
            if (img.uri) return { url: img.uri, alt_text: img.alt_text || '' };
            return null;
          })
          .filter(Boolean) as Array<{ url: string; alt_text?: string }>,
      };

      // فقط فیلدهای اختیاری را اضافه کن اگر مقدار دارند (نه null)
      if (formData.room_count) {
        adData.room_count = formData.room_count;
      }
      if (formData.build_year) {
        adData.build_year = formData.build_year;
      }
      if (formData.has_parking) {
        adData.has_parking = formData.has_parking;
      }
      if (formData.has_storage) {
        adData.has_storage = formData.has_storage;
      }
      if (formData.has_elevator) {
        adData.has_elevator = formData.has_elevator;
      }

      // فقط video_url را در صورت وجود اضافه کن
      if (formData.video_url && formData.video_url.trim()) {
        adData.video_url = formData.video_url.trim();
      }

      console.log('📤 Sending ad data to API:', JSON.stringify(adData, null, 2));
      const response = await createAd(adData);
      console.log('📥 API response:', response);
      
      if (response.success) {
        console.log('✅ Ad created successfully');
        // Reset form and redirect to home without showing alert
        resetFormData();
        router.replace('/home');
      } else {
        console.error('❌ Ad creation failed:', response.message);
        // Show error alert
        Alert.alert('خطا', response.message || 'خطا در ثبت آگهی');
      }
    } catch (error: any) {
      console.error('❌ Error creating ad:', error);
      // Show error alert with detailed message if available
      const errorMessage = error?.message || 'خطا در ثبت آگهی. لطفاً دوباره تلاش کنید';
      Alert.alert('خطا', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'انتخاب';
    
    // اگر selectedCategoryName وجود دارد، از آن استفاده کن
    if (selectedCategoryName && selectedCategoryName !== 'نامشخص') {
      return selectedCategoryName;
    }
    
    // در غیر این صورت، از categories state جستجو کن
    const findCategoryInState = (cats: Category[], id: number): Category | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryInState(cat.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    
    const category = findCategoryInState(categories, categoryId);
    if (category) {
      return category.name;
    }
    
    return selectedCategoryName || 'در حال بارگذاری...';
  };

  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    for (const cat of cats) {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children));
      }
    }
    return result;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#F1F8F4" />

      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>ثبت آگهی</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* کارت عکس آگهی + عنوان و توضیحات */}
        <View style={styles.card}>
          {/* عنوان بخش */}
          <View style={styles.cardHeaderRow}>
            <ThemedText style={styles.cardHeaderTitle}>عکس آگهی</ThemedText>
          </View>

          {/* توضیح بالای باکس آپلود */}
          <ThemedText style={styles.uploadHint}>
            از ابعاد مختلف کالا/ خدمت خود عکس اضافه کنید
          </ThemedText>

          {/* نمایش تصاویر انتخاب شده */}
          {formData.images.length > 0 && (
            <View style={styles.imagesContainer}>
              {formData.images.map((img, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <MaterialIcons name="close" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* دکمه اضافه کردن عکس */}
          <TouchableOpacity 
            style={styles.uploadBox} 
            activeOpacity={0.7}
            onPress={handleImagePicker}
            disabled={uploadingImages}
          >
            {uploadingImages ? (
              <ActivityIndicator color="#E7002B" />
            ) : (
              <ExpoImage
                source={require('@/assets/images/circle-camera 2.svg')}
                style={styles.uploadIconFull}
                contentFit="contain"
              />
            )}
          </TouchableOpacity>

          {/* خط جداکننده پایین سکشن عکس */}
          <View style={styles.cardDivider} />

          {/* عنوان آگهی */}
          <View style={styles.fieldWrapper}>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(text) => updateFormData({ title: text })}
              placeholder="عنوان آگهی"
              placeholderTextColor="#757575"
              textAlign="right"
            />
            <View style={styles.fieldFloatingLabel}>
              <ThemedText style={styles.fieldLabel}>عنوان آگهی</ThemedText>
              <ThemedText style={styles.requiredMark}>*</ThemedText>
            </View>
          </View>

          {/* توضیحات آگهی */}
          <View style={styles.fieldWrapper}>
            <TextInput
              style={[styles.input, styles.inputMultiLine]}
              value={formData.description}
              onChangeText={(text) => updateFormData({ description: text })}
              placeholder="توضیحات آگهی"
              placeholderTextColor="#757575"
              textAlign="right"
              multiline
              numberOfLines={4}
            />
            <View style={styles.fieldFloatingLabel}>
              <ThemedText style={styles.fieldLabel}>توضیحات آگهی</ThemedText>
              <ThemedText style={styles.requiredMark}>*</ThemedText>
            </View>
          </View>
        </View>

        {/* کارت دسته و محل آگهی / امکانات / قیمت ملک */}
        <View style={styles.card}>
          {/* هشدار بالای کارت */}
          <ThemedText style={styles.infoText}>
            تغییر دسته و محل آگهی پس از انتشار آگهی ممکن نیست.
          </ThemedText>

          {/* دسته و محل آگهی */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionTitleRow}>
              <ThemedText style={styles.sectionTitle}>دسته و محل آگهی</ThemedText>
              <ThemedText style={styles.requiredMark}>*</ThemedText>
            </View>

            {/* ردیف دسته */}
            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => router.push('/post-ad-category' as any)}
              >
                <View style={styles.metaLabelWrapper}>
                  <ThemedText style={styles.metaLabel}>دسته</ThemedText>
                  <ThemedText style={styles.requiredMark}>*</ThemedText>
                </View>
                <ThemedText style={styles.metaValue}>
                  {getCategoryName(formData.category_id)}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>

            {/* ردیف مکان ملک */}
            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => setLocationModalVisible(true)}
              >
                <View style={styles.metaLabelWrapper}>
                  <ThemedText style={styles.metaLabel}>مکان ملک</ThemedText>
                  <ThemedText style={styles.requiredMark}>*</ThemedText>
                </View>
                <ThemedText style={styles.metaValue}>
                  {formData.location || 'انتخاب'}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>

            {/* ردیف آیا عکس‌ها متعلق به خود ملک است؟ */}
            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => setImagesBelongModalVisible(true)}
              >
                <View style={styles.metaLabelWrapper}>
                  <ThemedText style={styles.metaLabel}>
                    آیا عکس‌ها متعلق به خود ملک است؟
                  </ThemedText>
                  <ThemedText style={styles.requiredMark}>*</ThemedText>
                </View>
                <ThemedText style={styles.metaValue}>
                  {formData.images_belong_to_property === null 
                    ? 'انتخاب' 
                    : formData.images_belong_to_property 
                    ? 'بله' 
                    : 'خیر'}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          {/* ویدیو تمام فضای ملک */}
          <View style={styles.sectionBlock}>
            <ThemedText style={styles.sectionTitle}>ویدیو تمام فضای ملک</ThemedText>
            <View style={styles.videoRow}>
              <TouchableOpacity 
                style={styles.videoUploadBox} 
                activeOpacity={0.7}
                onPress={handleVideoPicker}
              >
                {formData.video_url ? (
                  <ThemedText style={styles.videoText}>ویدیو انتخاب شده</ThemedText>
                ) : (
                  <ExpoImage
                    source={require('@/assets/images/circle-camera 2.svg')}
                    style={styles.uploadIconFull}
                    contentFit="contain"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          {/* امکانات */}
          <View style={styles.sectionBlock}>
            <ThemedText style={styles.sectionLabel}>امکانات</ThemedText>

            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => setRoomModalVisible(true)}
              >
                <View style={styles.metaLabelWrapper}>
                  <ThemedText style={styles.metaLabel}>تعداد اتاق</ThemedText>
                  <ThemedText style={styles.requiredMark}>*</ThemedText>
                </View>
                <ThemedText style={styles.metaValue}>
                  {formData.room_count || 'انتخاب'}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>

            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => setBuildYearModalVisible(true)}
              >
                <View style={styles.metaLabelWrapper}>
                  <ThemedText style={styles.metaLabel}>سال ساخت</ThemedText>
                  <ThemedText style={styles.requiredMark}>*</ThemedText>
                </View>
                <ThemedText style={styles.metaValue}>
                  {formData.build_year || 'انتخاب'}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>

            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => setParkingModalVisible(true)}
              >
                <View style={styles.metaLabelWrapper}>
                  <ThemedText style={styles.metaLabel}>پارکینگ</ThemedText>
                  <ThemedText style={styles.requiredMark}>*</ThemedText>
                </View>
                <ThemedText style={styles.metaValue}>
                  {formData.has_parking === null 
                    ? 'انتخاب' 
                    : formData.has_parking === 'yes' 
                    ? 'بله' 
                    : 'خیر'}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>

            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => setStorageModalVisible(true)}
              >
                <View style={styles.metaLabelWrapper}>
                  <ThemedText style={styles.metaLabel}>انباری</ThemedText>
                  <ThemedText style={styles.requiredMark}>*</ThemedText>
                </View>
                <ThemedText style={styles.metaValue}>
                  {formData.has_storage === null 
                    ? 'انتخاب' 
                    : formData.has_storage === 'yes' 
                    ? 'بله' 
                    : 'خیر'}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>

            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => setElevatorModalVisible(true)}
              >
                <View style={styles.metaLabelWrapper}>
                  <ThemedText style={styles.metaLabel}>آسانسور</ThemedText>
                  <ThemedText style={styles.requiredMark}>*</ThemedText>
                </View>
                <ThemedText style={styles.metaValue}>
                  {formData.has_elevator === null 
                    ? 'انتخاب' 
                    : formData.has_elevator === 'yes' 
                    ? 'بله' 
                    : 'خیر'}
                </ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>

            <View>
              <TouchableOpacity
                style={styles.metaRow}
                activeOpacity={0.7}
                onPress={() => router.push('/post-ad-extra-features' as any)}
              >
                <ThemedText style={styles.metaLabel}>سایر ویژگی‌ها و امکانات</ThemedText>
                <ThemedText style={styles.metaValue}>انتخاب</ThemedText>
              </TouchableOpacity>
              <View style={styles.metaDivider} />
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          {/* قیمت ملک */}
          <View style={styles.sectionBlock}>
            <ThemedText style={styles.sectionLabel}>قیمت ملک</ThemedText>

            <View style={styles.fieldLabelRow}>
              <ThemedText style={styles.smallLabel}>متراژ زمین(متر مربع)</ThemedText>
              <ThemedText style={styles.requiredMark}>*</ThemedText>
            </View>
            <TextInput
              style={styles.inputSmall}
              value={formData.land_area}
              onChangeText={(text) => updateFormData({ land_area: text.replace(/[^0-9]/g, '') })}
              placeholder="متراژ زمین(متر مربع)"
              placeholderTextColor="#757575"
              textAlign="right"
              keyboardType="numeric"
            />

            <View style={styles.fieldLabelRow}>
              <ThemedText style={styles.smallLabel}>قیمت(تومان)</ThemedText>
              <ThemedText style={styles.requiredMark}>*</ThemedText>
            </View>
            <TextInput
              style={styles.inputSmall}
              value={formData.price}
              onChangeText={(text) => updateFormData({ price: text.replace(/[^0-9]/g, '') })}
              placeholder="قیمت(تومان)"
              placeholderTextColor="#757575"
              textAlign="right"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* دکمه‌های بعدی و ذخیره */}
        <View style={styles.buttonsContainer}>
          {/* دکمه بعدی - برای رفتن به صفحه دسته‌بندی */}
          <TouchableOpacity
            style={styles.nextButton}
            activeOpacity={0.7}
            onPress={() => router.push('/post-ad-category' as any)}
          >
            <ThemedText style={styles.nextButtonText}>بعدی</ThemedText>
          </TouchableOpacity>

          {/* دکمه ذخیره - برای ثبت نهایی آگهی */}
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.nextButtonDisabled]}
            activeOpacity={0.7}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.saveButtonText}>ذخیره و ثبت آگهی</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* پاپ‌آپ انتخاب تعداد اتاق */}
      <Modal
        visible={roomModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoomModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setRoomModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>تعداد اتاق</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {ROOM_OPTIONS.map((label) => (
                <TouchableOpacity
                  key={label}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ room_count: label });
                    setRoomModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{label}</ThemedText>
                  {formData.room_count === label && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* پاپ‌آپ انتخاب سال ساخت */}
      <Modal
        visible={buildYearModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBuildYearModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setBuildYearModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>سال ساخت</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {BUILD_YEAR_OPTIONS.map((year) => (
                <TouchableOpacity
                  key={year}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ build_year: year });
                    setBuildYearModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{year}</ThemedText>
                  {formData.build_year === year && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* پاپ‌آپ انتخاب پارکینگ */}
      <Modal
        visible={parkingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setParkingModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setParkingModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>پارکینگ</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {YES_NO_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ has_parking: option.value });
                    setParkingModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option.label}</ThemedText>
                  {formData.has_parking === option.value && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* پاپ‌آپ انتخاب انباری */}
      <Modal
        visible={storageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStorageModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setStorageModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>انباری</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {YES_NO_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ has_storage: option.value });
                    setStorageModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option.label}</ThemedText>
                  {formData.has_storage === option.value && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* پاپ‌آپ انتخاب آسانسور */}
      <Modal
        visible={elevatorModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setElevatorModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setElevatorModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>آسانسور</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {YES_NO_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ has_elevator: option.value });
                    setElevatorModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option.label}</ThemedText>
                  {formData.has_elevator === option.value && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* پاپ‌آپ انتخاب مکان */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setLocationModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>مکان ملک</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {loadingCities ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="small" color="#00964E" />
                  <ThemedText style={styles.modalLoadingText}>در حال بارگذاری...</ThemedText>
                </View>
              ) : cities.length > 0 ? (
                cities.map((city) => (
                  <TouchableOpacity
                    key={city.id}
                    style={styles.modalOptionRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      updateFormData({ location: city.name });
                      setLocationModalVisible(false);
                    }}
                  >
                    <ThemedText style={styles.modalOptionText}>{city.name}</ThemedText>
                    {formData.location === city.name && (
                      <MaterialIcons name="check" size={20} color="#00964E" />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.modalEmptyContainer}>
                  <ThemedText style={styles.modalEmptyText}>شهری یافت نشد</ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* پاپ‌آپ انتخاب آیا عکس‌ها متعلق به خود ملک است */}
      <Modal
        visible={imagesBelongModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImagesBelongModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setImagesBelongModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>آیا عکس‌ها متعلق به خود ملک است؟</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {IMAGES_BELONG_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={String(option.value)}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ images_belong_to_property: option.value });
                    setImagesBelongModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option.label}</ThemedText>
                  {formData.images_belong_to_property === option.value && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {/* پروفایل */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/profile' as any)}
        >
          <ExpoImage
            source={require('@/assets/images/Vector (3).svg')}
            style={styles.navIcon}
            contentFit="contain"
            tintColor="#333333"
          />
          <ThemedText style={styles.navItemText}>پروفایل</ThemedText>
        </TouchableOpacity>

        <View style={styles.navDivider} />

        {/* ثبت آگهی - فعال */}
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <ExpoImage
            source={require('@/assets/images/Vector (1).svg')}
            style={styles.navIcon}
            contentFit="contain"
            tintColor="#E7002B"
          />
          <ThemedText style={styles.navItemTextActive}>ثبت آگهی</ThemedText>
        </TouchableOpacity>

        <View style={styles.navDivider} />

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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F4',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Vazir-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#D3D3D3',
    marginBottom: 12,
  },
  uploadHint: {
    fontSize: 8,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    marginTop: 12,
    marginBottom: 20,
  },
  imagesContainer: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBox: {
    width: 80,
    height: 80,
    alignSelf: 'flex-end',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  uploadIconFull: {
    width: 80,
    height: 80,
  },
  fieldWrapper: {
    marginTop: 24,
    marginBottom: 12,
    position: 'relative',
  },
  input: {
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#757575',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 12,
    fontFamily: 'Vazir',
    color: '#212121',
    textAlign: 'right',
    backgroundColor: '#FFFFFF',
  },
  inputMultiLine: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputSmall: {
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#D3D3D3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    marginTop: 4,
    fontSize: 12,
    fontFamily: 'Vazir',
    color: '#212121',
    textAlign: 'right',
    backgroundColor: '#FFFFFF',
  },
  fieldFloatingLabel: {
    position: 'absolute',
    top: -10,
    right: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: '#FAFAFA',
    borderRadius: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
  },
  requiredMark: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E7002B',
    fontFamily: 'Vazir-Medium',
    marginRight: 4,
  },
  sectionBlock: {
    marginTop: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
    marginLeft: 4,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 4,
  },
  metaLabelWrapper: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
    textAlign: 'left',
  },
  metaDivider: {
    height: 1,
    backgroundColor: '#D3D3D3',
    marginTop: 8,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#D3D3D3',
    marginTop: 16,
  },
  videoRow: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  videoUploadBox: {
    width: 80,
    height: 80,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    fontSize: 10,
    color: '#757575',
    fontFamily: 'Vazir',
  },
  fieldLabelRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
    marginLeft: 4,
  },
  infoText: {
    fontSize: 8,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
  },
  buttonsContainer: {
    flexDirection: 'row-reverse',
    gap: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#E7002B',
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  saveButton: {
    backgroundColor: '#00964E',
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Medium',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Medium',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 80,
    backgroundColor: '#F1F8F4',
    borderTopWidth: 0.5,
    borderTopColor: '#D3D3D3',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingHorizontal: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: 65,
  },
  navIcon: {
    width: 24,
    height: 24,
    marginBottom: 9,
  },
  navItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    lineHeight: 18.78,
    textAlign: 'center',
  },
  navItemTextActive: {
    fontSize: 12,
    fontWeight: '500',
    color: '#E7002B',
    fontFamily: 'Vazir-Medium',
    lineHeight: 18.78,
    textAlign: 'center',
  },
  navDivider: {
    width: 0.5,
    height: 48,
    backgroundColor: '#D3D3D3',
    alignSelf: 'flex-start',
    marginTop: 1,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  modalHeaderArrow: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modalHeaderPlaceholder: {
    width: 40,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'Vazir-Bold',
    textAlign: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalScrollContent: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  modalOptionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalOptionRowSelected: {
    backgroundColor: '#E8F5E9',
  },
  modalOptionText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    flex: 1,
  },
  modalOptionTextSelected: {
    color: '#00964E',
    fontWeight: '700',
  },
  modalOptionRight: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  modalLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modalLoadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
  },
  modalEmptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Vazir',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Vazir',
    textAlign: 'center',
  },
});
