import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useAdForm } from '@/src/contexts/AdFormContext';
import { Category, getCategories } from '@/src/services/categories';

// Map category names to icons
const getCategoryIcon = (categoryName: string): { name: keyof typeof MaterialIcons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap; library: 'MaterialIcons' | 'MaterialCommunityIcons' } => {
  const nameLower = categoryName.toLowerCase();
  
  if (nameLower.includes('املاک') || nameLower.includes('خانه')) {
    return { name: 'home', library: 'MaterialIcons' };
  }
  if (nameLower.includes('دست دو') || nameLower.includes('دست‌دو')) {
    return { name: 'autorenew', library: 'MaterialIcons' };
  }
  if (nameLower.includes('نو') || nameLower.includes('کالای نو')) {
    return { name: 'shopping-bag', library: 'MaterialIcons' };
  }
  if (nameLower.includes('نقلیه') || nameLower.includes('ماشین')) {
    return { name: 'directions-car', library: 'MaterialIcons' };
  }
  if (nameLower.includes('استخدام') || nameLower.includes('کاریابی')) {
    return { name: 'work', library: 'MaterialIcons' };
  }
  if (nameLower.includes('خدمات')) {
    return { name: 'build', library: 'MaterialIcons' };
  }
  if (nameLower.includes('بیزنس') || nameLower.includes('تجارت')) {
    return { name: 'handshake', library: 'MaterialCommunityIcons' };
  }
  if (nameLower.includes('رویداد')) {
    return { name: 'event', library: 'MaterialIcons' };
  }
  if (nameLower.includes('سایر')) {
    return { name: 'category', library: 'MaterialIcons' };
  }
  
  return { name: 'category', library: 'MaterialIcons' };
};

export default function PostAdCategoryScreen() {
  const { formData, updateFormData } = useAdForm();
  const params = useLocalSearchParams<{ parentId?: string; level?: string }>();
  const parentId = params.parentId ? parseInt(params.parentId, 10) : null;
  const level = params.level ? parseInt(params.level, 10) : 0;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [parentId]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      // برای نمایش children، باید include_children را true بگذاریم
      console.log('🔄 Loading categories - parentId:', parentId, 'level:', level);
      const response = await getCategories(parentId, true);
      console.log('📥 Response received:', response.success, 'data length:', response.data?.length || 0);
      
      if (response.success && response.data) {
        setCategories(response.data);
        // Debug: بررسی children
        console.log('📦 Categories loaded:', response.data.length);
        response.data.forEach(cat => {
          console.log(`  - ${cat.name} (ID: ${cat.id}): ${cat.children?.length || 0} children`);
          if (cat.children && cat.children.length > 0) {
            cat.children.forEach(child => {
              console.log(`    └ ${child.name} (ID: ${child.id})`);
            });
          }
        });
      } else {
        console.warn('⚠️ No categories data in response:', response);
      }
    } catch (error: any) {
      console.error('❌ Error loading categories:', error);
      if (error.name !== 'AbortError') {
        // فقط خطاهای غیر AbortError را نمایش بده
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: Category) => {
    // انتخاب دسته (کلیک روی آیکن یا نام)
    console.log('✅ Category selected:', category.id, category.name);
    // ذخیره category_id و نام دسته در context
    updateFormData({ category_id: category.id });
    // برگشت به صفحه اصلی ثبت آگهی
    router.replace('/post-ad' as any);
  };

  const handleArrowPress = (category: Category) => {
    // رفتن به سطح بعدی (کلیک روی فلش)
    // اجازه می‌دهیم تا لول 3 (level 0, 1, 2)
    if (category.children && category.children.length > 0 && level < 3) {
      console.log('➡️ Navigating to level', level + 1, 'for category:', category.name);
      router.push({
        pathname: '/post-ad-category',
        params: {
          parentId: String(category.id),
          level: String(level + 1),
        },
      } as any);
    } else {
      console.log('⚠️ Cannot navigate: children:', category.children?.length || 0, 'level:', level);
    }
  };

  const handleBack = () => {
    if (level > 0) {
      // برگشت به سطح قبلی
      router.back();
    } else {
      // برگشت به صفحه ثبت آگهی
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#F1F8F4" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerArrow}
          activeOpacity={0.7}
          onPress={handleBack}
        >
          <ExpoImage
            source={require('@/assets/images/Vector.svg')}
            style={styles.headerArrowIcon}
            contentFit="contain"
            tintColor="#333333"
          />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>انتخاب دسته آگهی</ThemedText>

        <View style={styles.headerArrowPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#E7002B" size="large" />
          <ThemedText style={styles.loadingText}>در حال بارگذاری...</ThemedText>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* لیست دسته‌ها */}
            <View style={styles.categoriesContainer}>
              {categories.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <ThemedText style={styles.emptyText}>
                    {parentId ? 'زیردسته‌ای یافت نشد' : 'دسته‌بندی‌ای یافت نشد'}
                  </ThemedText>
                </View>
              ) : (
                categories.map((category) => {
                  // برای لول 3، باید level < 3 باشد
                  const hasChildren = category.children && category.children.length > 0 && level < 3;
                  const isSelected = formData.category_id === category.id;
                  const iconInfo = getCategoryIcon(category.name);

                  return (
                    <View key={category.id} style={styles.categoryCard}>
                      <View style={styles.categoryInnerRow}>
                        {/* آیکن دسته - قابل کلیک برای انتخاب */}
                        <TouchableOpacity
                          style={styles.categoryMainSection}
                          activeOpacity={0.7}
                          onPress={() => handleCategorySelect(category)}
                        >
                          <View style={styles.categoryIconContainer}>
                            {category.image_url ? (
                              <ExpoImage
                                source={{ uri: category.image_url }}
                                style={styles.categoryImage}
                                contentFit="cover"
                              />
                            ) : (
                              <>
                                {iconInfo.library === 'MaterialCommunityIcons' ? (
                                  <MaterialCommunityIcons
                                    name={iconInfo.name as any}
                                    size={24}
                                    color="#FFFFFF"
                                  />
                                ) : (
                                  <MaterialIcons
                                    name={iconInfo.name as any}
                                    size={24}
                                    color="#FFFFFF"
                                  />
                                )}
                              </>
                            )}
                          </View>

                          {/* نام دسته */}
                          <ThemedText style={styles.categoryTitle}>
                            {category.name}
                          </ThemedText>
                        </TouchableOpacity>

                        {/* فلش راست - فقط برای دسته‌هایی که children دارند */}
                        {hasChildren && (
                          <TouchableOpacity
                            style={styles.chevronCircle}
                            activeOpacity={0.7}
                            onPress={() => handleArrowPress(category)}
                          >
                            <MaterialIcons name="chevron-right" size={20} color="#E7002B" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>

          {/* دکمه‌های قبلی / بعدی */}
          <View style={styles.footerButtonsRow}>
            {/* بعدی - فقط اگر دسته انتخاب شده باشد */}
            {formData.category_id && (
              <TouchableOpacity
                style={styles.nextButton}
                activeOpacity={0.7}
                onPress={() => {
                  router.replace('/post-ad' as any);
                }}
              >
                <ThemedText style={styles.nextButtonText}>بعدی</ThemedText>
              </TouchableOpacity>
            )}

            {/* قبلی */}
            <TouchableOpacity
              style={[
                styles.prevButton,
                formData.category_id ? styles.prevButtonWithNext : null,
              ]}
              activeOpacity={0.7}
              onPress={handleBack}
            >
              <ThemedText style={styles.prevButtonText}>قبلی</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerArrow: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerArrowIcon: {
    width: 28,
    height: 25,
  },
  headerArrowPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Vazir-Bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Vazir',
  },
  categoriesContainer: {
    marginTop: 8,
    gap: 16,
  },
  categoryCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    paddingHorizontal: 12,
    paddingVertical: 14,
    minHeight: 52,
  },
  categoryInnerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryMainSection: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  categoryImage: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    flex: 1,
  },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 15,
    backgroundColor: '#F1F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    transform: [{ rotate: '180deg' }],
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
  footerButtonsRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#E7002B',
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  prevButton: {
    flex: 1,
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E7002B',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  prevButtonWithNext: {
    flex: 1,
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E7002B',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
});
