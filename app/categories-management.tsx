// صفحه مدیریت دسته‌بندی‌ها برای ادمین

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/src/components/common/Button';
import { Icon } from '@/src/components/common/Icon';
import type { Category, CreateCategoryRequest } from '@/src/services/categories';
import {
    adminCreateCategory,
    adminDeleteCategory,
    adminUpdateCategory,
    getCategories,
} from '@/src/services/categories';
import { uploadImage } from '@/src/services/media';
import { getUser } from '@/src/utils/storage';
import { MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

// تبدیل ساختار درختی به لیست تخت با indentation (با پشتیبانی از expand/collapse)
function flattenCategories(
  categories: Category[],
  level: number = 0,
  excludeId?: number,
  expandedSet?: Set<number>
): Array<Category & { level: number }> {
  const result: Array<Category & { level: number }> = [];
  
  for (const category of categories) {
    // اگر در حال ویرایش هستیم، دسته فعلی و فرزندانش را نمایش نده
    if (excludeId && category.id === excludeId) {
      continue;
    }
    
    result.push({ ...category, level });
    
    // اگر فرزند دارد و expand شده است، فرزندان را نمایش بده
    const hasChildren = category.children && category.children.length > 0;
    // اگر expandedSet undefined باشد، همه را expand می‌کنیم
    // اگر expandedSet خالی باشد (new Set())، هیچ کدام را expand نمی‌کنیم
    // اگر expandedSet داشته باشد، فقط آنهایی که در set هستند را expand می‌کنیم
    const isExpanded = expandedSet === undefined ? true : (expandedSet.size === 0 ? false : expandedSet.has(category.id));
    
    if (hasChildren && isExpanded && level < 2) {
      const children = flattenCategories(category.children || [], level + 1, excludeId, expandedSet);
      result.push(...children);
    }
  }
  
  return result;
}

export default function CategoriesManagementScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CreateCategoryRequest>({
    name: '',
    description: '',
    image_url: '',
    parent_id: null,
    sort_order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [parentPickerVisible, setParentPickerVisible] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCategories();
  }, []);

  // تابع برای expand کردن همه دسته‌بندی‌ها
  const expandAllCategories = (cats: Category[]): Set<number> => {
    const expanded = new Set<number>();
    const traverse = (items: Category[]) => {
      for (const item of items) {
        if (item.children && item.children.length > 0) {
          expanded.add(item.id);
          traverse(item.children);
        }
      }
    };
    traverse(cats);
    return expanded;
  };

  // برای picker modal، همه دسته‌بندی‌ها باید expand باشند
  // استفاده از undefined به جای Set خالی تا همه expand شوند

  const loadCategories = async () => {
    setLoading(true);
    try {
      // استفاده از endpoint عمومی که نیاز به authentication ندارد
      const response = await getCategories(null, true);
      if (response.success && response.data) {
        setCategories(response.data);
        // Expand کردن همه دسته‌بندی‌ها به صورت پیش‌فرض
        setExpandedCategories(expandAllCategories(response.data));
      } else {
        Alert.alert('خطا', response.message || 'خطا در دریافت دسته‌بندی‌ها');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('خطا', 'خطا در دریافت دسته‌بندی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      image_url: '',
      parent_id: null,
      sort_order: 0,
      is_active: true,
    });
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
      parent_id: category.parent_id || null,
      sort_order: category.sort_order || 0,
      is_active: category.is_active === 1,
    });
    setModalVisible(true);
  };

  const handleDelete = (category: Category) => {
    Alert.alert(
      'حذف دسته‌بندی',
      `آیا مطمئن هستید که می‌خواهید دسته‌بندی "${category.name}" را حذف کنید؟`,
      [
        {
          text: 'لغو',
          style: 'cancel',
        },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await adminDeleteCategory(category.id);
              if (response.success) {
                Alert.alert('موفق', 'دسته‌بندی با موفقیت حذف شد');
                loadCategories();
              } else {
                Alert.alert('خطا', response.message || 'خطا در حذف دسته‌بندی');
              }
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('خطا', 'خطا در حذف دسته‌بندی');
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    try {
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

          input.onchange = async (e: Event) => {
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
            reader.onload = async (event: ProgressEvent<FileReader>) => {
              const dataUri = event.target?.result as string;
              if (dataUri) {
                await handleUploadImage(dataUri);
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
          aspect: [4, 3],
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          if (asset.base64) {
            const mimeType = asset.type || 'image/jpeg';
            const dataUri = `data:${mimeType};base64,${asset.base64}`;
            await handleUploadImage(dataUri);
          } else if (asset.uri) {
            await handleUploadImage(asset.uri);
          }
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطا', 'خطا در انتخاب تصویر');
    }
  };

  const handleUploadImage = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      const response = await uploadImage(imageUri);
      if (response.success && response.data) {
        setFormData({ ...formData, image_url: response.data.url });
        Alert.alert('موفق', 'تصویر با موفقیت آپلود شد');
      } else {
        Alert.alert('خطا', response.message || 'خطا در آپلود تصویر');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('خطا', 'خطا در آپلود تصویر');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('خطا', 'لطفاً نام دسته‌بندی را وارد کنید');
      return;
    }

    setSaving(true);
    try {
      let response;
      if (editingCategory) {
        // ویرایش
        response = await adminUpdateCategory(editingCategory.id, formData);
      } else {
        // ایجاد
        response = await adminCreateCategory(formData);
      }

      if (response.success) {
        Alert.alert('موفق', response.message || 'عملیات با موفقیت انجام شد');
        setModalVisible(false);
        loadCategories();
      } else {
        Alert.alert('خطا', response.message || 'خطا در انجام عملیات');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('خطا', 'خطا در انجام عملیات');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const flatCategories = flattenCategories(
    categories,
    0,
    editingCategory?.id,
    expandedCategories
  );

  const handleBack = async () => {
    // Try to go back, if not possible, go to appropriate home based on user role
    if (router.canGoBack()) {
      router.back();
    } else {
      // Navigate based on user role
      const user = await getUser();
      if (user?.is_admin) {
        router.replace('/admin');
      } else {
        router.replace('/home');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <ThemedText style={styles.backButtonText}>بازگشت</ThemedText>
          <Icon name="arrow-left" size={18} color="#E7002B" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>مدیریت دسته‌بندی‌ها</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E7002B" />
          <ThemedText style={styles.loadingText}>در حال بارگذاری...</ThemedText>
        </View>
      ) : (
        <>
          {/* Add Button */}
          <View style={styles.addButtonContainer}>
            <Button
              title="افزودن دسته‌بندی جدید"
              onPress={handleAddNew}
              variant="primary"
              size="medium"
            />
          </View>

          {/* Categories List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {flatCategories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  هیچ دسته‌بندی‌ای وجود ندارد
                </ThemedText>
              </View>
            ) : (
              flatCategories.map((category) => {
                const hasChildren = category.children && category.children.length > 0;
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <View
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      { marginRight: category.level * 24 },
                    ]}
                  >
                    {/* Category Image */}
                    {category.image_url && (
                      <ExpoImage
                        source={{ uri: category.image_url }}
                        style={styles.categoryImage}
                        contentFit="cover"
                      />
                    )}

                    {/* Category Info */}
                    <View style={styles.categoryInfo}>
                      <View style={styles.categoryHeaderRow}>
                        {hasChildren && (
                          <TouchableOpacity
                            onPress={() => toggleExpand(category.id)}
                            activeOpacity={0.7}
                            style={styles.expandButton}
                          >
                            <MaterialIcons
                              name={isExpanded ? 'expand-less' : 'expand-more'}
                              size={20}
                              color="#333333"
                            />
                          </TouchableOpacity>
                        )}
                        <ThemedText style={styles.categoryName}>
                          {category.name}
                        </ThemedText>
                      </View>
                      {category.description && (
                        <ThemedText style={styles.categoryDescription} numberOfLines={2}>
                          {category.description}
                        </ThemedText>
                      )}
                      <View style={styles.categoryMeta}>
                        <ThemedText style={styles.categoryMetaText}>
                          ترتیب: {category.sort_order}
                        </ThemedText>
                        <ThemedText
                          style={[
                            styles.categoryMetaText,
                            category.is_active === 1
                              ? styles.activeText
                              : styles.inactiveText,
                          ]}
                        >
                          {category.is_active === 1 ? 'فعال' : 'غیرفعال'}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEdit(category)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="edit" size={20} color="#00964E" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(category)}
                        activeOpacity={0.7}
                      >
                        <MaterialIcons name="delete" size={20} color="#E7002B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </>
      )}

      {/* Modal for Add/Edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>
                  {editingCategory ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={24} color="#333333" />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Name */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>نام دسته‌بندی *</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="نام دسته‌بندی"
                    placeholderTextColor="#9E9E9E"
                    textAlign="right"
                  />
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>توضیحات</ThemedText>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) =>
                      setFormData({ ...formData, description: text })
                    }
                    placeholder="توضیحات دسته‌بندی"
                    placeholderTextColor="#9E9E9E"
                    textAlign="right"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Parent Category */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>دسته والد</ThemedText>
                  <View style={styles.selectContainer}>
                    <TouchableOpacity
                      style={styles.select}
                      onPress={() => setParentPickerVisible(true)}
                      activeOpacity={0.7}
                    >
                      <ThemedText style={styles.selectText}>
                        {formData.parent_id
                          ? flatCategories.find((c) => c.id === formData.parent_id)?.name ||
                            'انتخاب نشده'
                          : 'بدون دسته والد'}
                      </ThemedText>
                      <MaterialIcons name="arrow-drop-down" size={20} color="#333333" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Image */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>تصویر دسته‌بندی</ThemedText>
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={handlePickImage}
                    activeOpacity={0.7}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#00964E" />
                    ) : formData.image_url ? (
                      <>
                        <ExpoImage
                          source={{ uri: formData.image_url }}
                          style={styles.uploadedImage}
                          contentFit="cover"
                        />
                        <View style={styles.imageOverlay}>
                          <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                        </View>
                      </>
                    ) : (
                      <>
                        <MaterialIcons name="camera-alt" size={24} color="#00964E" />
                        <ThemedText style={styles.uploadText}>
                          انتخاب تصویر
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Sort Order */}
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.label}>ترتیب نمایش</ThemedText>
                  <TextInput
                    style={styles.input}
                    value={String(formData.sort_order || 0)}
                    onChangeText={(text) => {
                      const num = parseInt(text, 10);
                      setFormData({
                        ...formData,
                        sort_order: isNaN(num) ? 0 : num,
                      });
                    }}
                    placeholder="0"
                    placeholderTextColor="#9E9E9E"
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>

                {/* Is Active */}
                <View style={styles.inputGroup}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        is_active: !formData.is_active,
                      })
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        formData.is_active && styles.checkboxChecked,
                      ]}
                    >
                      {formData.is_active && (
                        <MaterialIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </View>
                    <ThemedText style={styles.checkboxLabel}>فعال</ThemedText>
                  </TouchableOpacity>
                </View>

                {/* Save Button */}
                <View style={styles.modalActions}>
                  <Button
                    title={editingCategory ? 'ذخیره تغییرات' : 'افزودن'}
                    onPress={handleSave}
                    variant="primary"
                    size="large"
                    loading={saving}
                    disabled={saving}
                  />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Parent Category Picker Modal */}
      <Modal
        visible={parentPickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setParentPickerVisible(false)}
      >
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <ThemedText style={styles.pickerModalTitle}>انتخاب دسته والد</ThemedText>
              <TouchableOpacity
                onPress={() => setParentPickerVisible(false)}
                activeOpacity={0.7}
              >
                <MaterialIcons name="close" size={24} color="#333333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerModalList}>
              <TouchableOpacity
                style={styles.pickerItem}
                onPress={() => {
                  setFormData({ ...formData, parent_id: null });
                  setParentPickerVisible(false);
                }}
                activeOpacity={0.7}
              >
                <ThemedText style={styles.pickerItemText}>بدون دسته والد</ThemedText>
                {formData.parent_id === null && (
                  <MaterialIcons name="check" size={20} color="#00964E" />
                )}
              </TouchableOpacity>
              {flattenCategories(categories, 0, editingCategory?.id, undefined).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.pickerItem,
                    { paddingLeft: 16 + cat.level * 20 },
                  ]}
                  onPress={() => {
                    // چک می‌کنیم که آیا سطح بیش از 3 نمی‌شود
                    if (cat.level >= 2) {
                      Alert.alert('خطا', 'حداکثر 3 سطح دسته‌بندی مجاز است');
                      return;
                    }
                    setFormData({ ...formData, parent_id: cat.id });
                    setParentPickerVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.pickerItemText}>
                    {cat.level > 0 && '└ '}
                    {cat.name}
                  </ThemedText>
                  {formData.parent_id === cat.id && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'web' ? 16 : 16,
    paddingBottom: 8,
    backgroundColor: '#F1F8F4',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#757575',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#757575',
  },
  categoryCard: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    alignItems: 'center',
  },
  categoryImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeaderRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  expandButton: {
    padding: 4,
  },
  categoryName: {
    fontFamily: 'Vazir-Bold',
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  categoryDescription: {
    fontFamily: 'Vazir-Light',
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  categoryMeta: {
    flexDirection: 'row-reverse',
    gap: 16,
  },
  categoryMetaText: {
    fontFamily: 'Vazir-Light',
    fontSize: 12,
    color: '#757575',
  },
  activeText: {
    color: '#00964E',
  },
  inactiveText: {
    color: '#E7002B',
  },
  categoryActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 18,
    color: '#333333',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectContainer: {
    marginTop: 0,
  },
  select: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  selectText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#333333',
  },
  imageUploadButton: {
    width: '100%',
    height: 150,
    backgroundColor: '#FAFAFA',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#00964E',
  },
  checkboxContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#8C8C8C',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#00964E',
    borderColor: '#00964E',
  },
  checkboxLabel: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#333333',
  },
  modalActions: {
    marginTop: 24,
  },
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  pickerModalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerModalTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 18,
    color: '#333333',
  },
  pickerModalList: {
    maxHeight: 400,
  },
  pickerItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerItemText: {
    fontFamily: 'Vazir-Medium',
    fontSize: 14,
    color: '#333333',
  },
});

