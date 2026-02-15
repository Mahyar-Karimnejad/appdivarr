// کامپوننت داشبورد کاربر عادی

import { MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Image, Modal, RefreshControl,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/src/components/common/Icon';
import { getPublicAds, type Ad } from '@/src/services/ads';
import type { User } from '@/src/services/auth';
import { getUserApprovedBanners, type Banner } from '@/src/services/banners';
import { getCategories, type Category } from '@/src/services/categories';
import { getCities, type City } from '@/src/services/cities';

interface UserDashboardProps {
  user: User;
  onLogout: () => void;
}

export function UserDashboard({ user, onLogout }: UserDashboardProps) {
  // کاربر مهمان اگر id = 0 یا role = 'guest' باشد
  const isGuest = !user || user.id === 0 || user.role === 'guest';
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredAds, setFeaturedAds] = useState<Ad[]>([]);
  const [regularAds, setRegularAds] = useState<Ad[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingRegularAds, setLoadingRegularAds] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'post' | 'profile'>('home');
  const [refreshing, setRefreshing] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedAdCategoryId, setSelectedAdCategoryId] = useState<number | null>(null);
  const [subCategories, setSubCategories] = useState<Category[]>([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [approvedBanners, setApprovedBanners] = useState<Banner[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const insets = useSafeAreaInsets();

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load featured ads
  useEffect(() => {
    loadFeaturedAds();
  }, []);

  // Load regular ads
  useEffect(() => {
    loadRegularAds();
  }, []);

  // Load cities
  useEffect(() => {
    loadCities();
  }, []);

  // Load approved banners
  useEffect(() => {
    loadApprovedBanners();
  }, []);

  // Load ads when city changes
  // استفاده از useRef برای جلوگیری از reload غیرضروری
  const prevCityRef = useRef<City | null>(null);
  useEffect(() => {
    // فقط وقتی city واقعاً تغییر کرده باشد، آگهی‌ها را reload کن
    if (selectedCity !== prevCityRef.current) {
      prevCityRef.current = selectedCity;
      // فقط اگر city set شده باشد (نه null)، آگهی‌ها را reload کن
      if (selectedCity !== null) {
        loadFeaturedAds();
        loadRegularAds();
      }
    }
    // اگر city null است، آگهی‌ها را از قبل load شده نگه دار (در useEffect اولیه load شده‌اند)
  }, [selectedCity]);

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      // دریافت فقط دسته‌بندی‌های اصلی (parent_id = 0 یا null)
      const response = await getCategories(0, false);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadFeaturedAds = async () => {
    try {
      setLoadingAds(true);
      // دریافت فقط آگهی‌های ویژه از بک‌اند
      const location = selectedCity ? selectedCity.name : undefined;
      const response = await getPublicAds('approved', 1, 50, undefined, undefined, true, location);
      console.log('📦 Featured ads response:', response);
      console.log('📍 Location filter:', location);
      if (response.success) {
        // همیشه state را set کن، حتی اگر data خالی باشد
        // این باعث می‌شود که state به درستی update شود
        if (response.data && Array.isArray(response.data)) {
          console.log('✅ Setting featured ads:', response.data.length);
          setFeaturedAds(response.data);
        } else {
          // اگر location filter وجود دارد و data خالی است، state را reset نکن
          // این باعث می‌شود که آگهی‌های قبلی حفظ شوند
          if (location) {
            console.log('📭 No featured ads found for location, keeping existing state');
            // state را reset نمی‌کنیم تا آگهی‌های قبلی حفظ شوند
          } else {
            console.log('📭 No featured ads in response, setting empty array');
            setFeaturedAds([]);
          }
        }
      } else {
        console.warn('⚠️ Featured ads response failed:', response);
        // اگر response موفق نبود، state را حفظ می‌کنیم (reset نمی‌کنیم)
      }
    } catch (error) {
      console.error('Error loading featured ads:', error);
      // در صورت خطا، state را حفظ می‌کنیم (reset نمی‌کنیم)
    } finally {
      setLoadingAds(false);
    }
  };

  const loadRegularAds = async () => {
    try {
      setLoadingRegularAds(true);
      // دریافت آگهی‌های عادی (غیرویژه) از بک‌اند
      const location = selectedCity ? selectedCity.name : undefined;
      const response = await getPublicAds('approved', 1, 50, undefined, undefined, false, location);
      console.log('📦 Regular ads response:', response);
      console.log('📍 Location filter:', location);
      if (response.success) {
        // همیشه state را set کن، حتی اگر data خالی باشد
        // این باعث می‌شود که state به درستی update شود
        if (response.data && Array.isArray(response.data)) {
          console.log('✅ Setting regular ads:', response.data.length);
          setRegularAds(response.data);
        } else {
          // اگر location filter وجود دارد و data خالی است، state را reset نکن
          // این باعث می‌شود که آگهی‌های قبلی حفظ شوند
          if (location) {
            console.log('📭 No regular ads found for location, keeping existing state');
            // state را reset نمی‌کنیم تا آگهی‌های قبلی حفظ شوند
          } else {
            console.log('📭 No regular ads in response, setting empty array');
            setRegularAds([]);
          }
        }
      } else {
        console.warn('⚠️ Regular ads response failed:', response);
        // اگر response موفق نبود، state را حفظ می‌کنیم (reset نمی‌کنیم)
      }
    } catch (error) {
      console.error('Error loading regular ads:', error);
      // در صورت خطا، state را حفظ می‌کنیم (reset نمی‌کنیم)
    } finally {
      setLoadingRegularAds(false);
    }
  };

  const loadApprovedBanners = async () => {
    try {
      setLoadingBanners(true);
      const response = await getUserApprovedBanners();
      if (response.success && response.data) {
        setApprovedBanners(response.data);
      }
    } catch (error) {
      console.error('Error loading approved banners:', error);
    } finally {
      setLoadingBanners(false);
    }
  };

  const loadCities = async () => {
    try {
      setLoadingCities(true);
      const response = await getCities();
      if (response.success && response.data) {
        setCities(response.data);
        // به صورت پیش‌فرض استانبول را انتخاب کن
        const istanbul = response.data.find(city => city.name === 'استانبول');
        if (istanbul) {
          setSelectedCity(istanbul);
        }
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadApprovedBanners();
      await Promise.all([
        loadCategories(),
        loadFeaturedAds(),
        loadRegularAds()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = async (category: Category) => {
    // نمایش پاپ‌آپ زیرمجموعه‌های دسته‌بندی
    setSelectedAdCategoryId(category.id);
    setCategoryModalVisible(true);
    setCategorySearchQuery('');
    await loadSubCategories(category.id);
  };

  const handleAdPress = (ad: Ad) => {
    // رفتن به صفحه جزئیات آگهی
    router.push(`/ad-detail?id=${ad.id}` as any);
  };

  const loadSubCategories = async (categoryId: number) => {
    try {
      setLoadingSubCategories(true);
      const response = await getCategories(categoryId, false);
      if (response.success && response.data) {
        setSubCategories(response.data);
      } else {
        setSubCategories([]);
      }
    } catch (error) {
      console.error('Error loading sub categories:', error);
      setSubCategories([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  const handleSubCategoryPress = (subCategory: Category) => {
    // ناوبری به صفحه لیست آگهی‌های این دسته‌بندی
    setCategoryModalVisible(false);
    router.push({
      pathname: '/category-ads-list' as any,
      params: { categoryId: String(subCategory.id), categoryName: subCategory.name },
    });
  };

  const handleCloseModal = () => {
    setCategoryModalVisible(false);
    setSelectedAdCategoryId(null);
    setSubCategories([]);
    setCategorySearchQuery('');
  };

  const filteredSubCategories = subCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) {
        return 'کمتر از یک ساعت پیش';
      } else if (diffHours < 24) {
        return `${diffHours} ساعت پیش`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} روز پیش`;
      }
    } catch {
      return dateString;
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryIconContainer}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.categoryIcon}
            resizeMode="contain"
          />
        ) : (
          <Icon name="box" size={24} />
        )}
      </View>
      <ThemedText style={styles.categoryName} numberOfLines={1}>
        {item.name}
      </ThemedText>
    </TouchableOpacity>
  );

  const renderAdItem = ({ item }: { item: Ad }) => {
    const firstImage = item.images && item.images.length > 0 ? item.images[0].image_url : null;
    const timeAgo = formatTimeAgo(item.created_at);

    return (
      <TouchableOpacity
        style={styles.adCardContainer}
        onPress={() => handleAdPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.adCardContent}>
          {/* Image */}
          <View style={styles.adImageContainer}>
            {firstImage ? (
              <Image
                source={{ uri: firstImage }}
                style={styles.adImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.adImage, styles.placeholderImage]} />
            )}
          </View>

          {/* Content */}
          <View style={styles.adTextContent}>
            <ThemedText style={styles.adTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <ThemedText style={styles.adPrice}>{formatPrice(item.price)}</ThemedText>

            {/* Category Badge - بالای تاریخ */}
            {item.category_name && (
              <View style={styles.adBadge}>
                <ThemedText style={styles.adBadgeText}>{item.category_name}</ThemedText>
              </View>
            )}

            <ThemedText style={styles.adTime}>{timeAgo}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#F1F8F4" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E7002B']}
            tintColor="#E7002B"
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
                if (isGuest) {
                  router.push({
                    pathname: '/login',
                    params: { redirect: '/user-profile' },
                  } as any);
                } else {
                  router.push('/user-profile' as any);
                }
              }}
              activeOpacity={0.7}
            >
              {user.profile_image ? (
                <Image
                  source={{ uri: user.profile_image }}
                  style={styles.profileIcon}
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require('@/assets/images/generic user.png')}
                  style={styles.profileIcon}
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>

            {/* Notification Icon */}
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
              </View>
            </TouchableOpacity>
          </View>

          {/* Right Side - Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/Ellipse 1 (1).png')}
              style={styles.logo}
              resizeMode="contain"
            />
            {/* Location - Dropdown */}
            <TouchableOpacity
              style={styles.locationContainer}
              onPress={() => setCityModalVisible(true)}
              activeOpacity={0.7}
            >
              <ThemedText style={styles.locationText}>
                {selectedCity ? selectedCity.name : 'انتخاب شهر'}
              </ThemedText>
              <Icon name="chevron-right" size={10} />
            </TouchableOpacity>
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

        {/* Categories Grid */}
        {!loadingCategories && categories.length > 0 && (
          <View style={styles.categoriesContainer}>
            <View style={styles.categoriesGrid}>
              {categories.map((item, index) => (
                <View
                  key={`category-${item.id}`}
                  style={[
                    styles.categoryCardWrapper,
                    index % 3 === 0 && styles.categoryCardFirst,
                    index % 3 === 2 && styles.categoryCardLast,
                  ]}
                >
                  {renderCategoryItem({ item })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Banner */}
        {approvedBanners.length > 0 ? (
          <View style={styles.bannerContainer}>
            <ExpoImage
              source={{ uri: approvedBanners[0].image_url }}
              style={styles.bannerImage}
              contentFit="cover"
            />
          </View>
        ) : (
          <View style={styles.bannerContainer}>
            <ThemedText style={styles.bannerText}>بنر تبلیغاتی</ThemedText>
          </View>
        )}

        {/* Featured Ads Section - ایونت‌ها */}
        {!loadingAds && featuredAds.length > 0 && (
          <View style={styles.adsSection}>
            <ThemedText style={styles.sectionTitle}>ایونت‌ها</ThemedText>
            <View style={styles.adsList}>
              {featuredAds.map((item) => (
                <View key={`featured-ad-${item.id}`}>
                  {renderAdItem({ item })}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Regular Ads Section - آگهی‌های عادی */}
        {!loadingRegularAds && regularAds.length > 0 && (
          <View style={styles.adsSection}>
            <ThemedText style={styles.sectionTitle}>آگهی‌ها</ThemedText>
            <View style={styles.adsList}>
              {regularAds.map((item) => (
                <View key={`regular-ad-${item.id}`}>
                  {renderAdItem({ item })}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* City Selection Modal */}
      <Modal
        visible={cityModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setCityModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>انتخاب شهر</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />

            {/* Cities List */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loadingCities ? (
                <View style={styles.modalLoadingContainer}>
                  <ThemedText style={styles.modalLoadingText}>در حال بارگذاری...</ThemedText>
                </View>
              ) : cities.length > 0 ? (
                cities.map((city) => (
                  <TouchableOpacity
                    key={`city-${city.id}`}
                    style={styles.modalCategoryRow}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedCity(city);
                      setCityModalVisible(false);
                    }}
                  >
                    <ThemedText style={styles.modalCategoryName} numberOfLines={1}>
                      {city.name}
                    </ThemedText>
                    {selectedCity?.id === city.id && (
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

      {/* Category Subcategories Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={handleCloseModal}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>دسته‌بندی‌ها</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />

            {/* Search Box */}
            <View style={styles.modalSearchContainer}>
              <View style={styles.modalSearchBox}>
                <View style={styles.modalSearchIconContainer}>
                  <Icon name="magnifying-glass" size={20} />
                </View>
                <RNTextInput
                  style={styles.modalSearchInput}
                  placeholder="جستجو در دسته ها..."
                  placeholderTextColor="rgba(51, 51, 51, 0.6)"
                  value={categorySearchQuery}
                  onChangeText={setCategorySearchQuery}
                  textAlign="right"
                />
              </View>
            </View>

            {/* Sub Categories List */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loadingSubCategories ? (
                <View style={styles.modalLoadingContainer}>
                  <ThemedText style={styles.modalLoadingText}>در حال بارگذاری...</ThemedText>
                </View>
              ) : filteredSubCategories.length > 0 ? (
                filteredSubCategories.map((subCategory) => (
                  <TouchableOpacity
                    key={`sub-category-${subCategory.id}`}
                    style={styles.modalCategoryRow}
                    activeOpacity={0.7}
                    onPress={() => handleSubCategoryPress(subCategory)}
                  >
                    {/* Category Icon */}
                    <View style={styles.modalCategoryIconContainer}>
                      {subCategory.image_url ? (
                        <Image
                          source={{ uri: subCategory.image_url }}
                          style={styles.modalCategoryIcon}
                          resizeMode="contain"
                        />
                      ) : (
                        <Icon name="box" size={24} />
                      )}
                    </View>
                    {/* Category Name */}
                    <ThemedText style={styles.modalCategoryName} numberOfLines={1}>
                      {subCategory.name}
                    </ThemedText>
                    {/* Arrow Icon */}
                    <MaterialIcons name="chevron-left" size={20} color="#333333" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.modalEmptyContainer}>
                  <ThemedText style={styles.modalEmptyText}>
                    {categorySearchQuery ? 'نتیجه‌ای یافت نشد' : 'زیرمجموعه‌ای وجود ندارد'}
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation - با SafeArea برای اندروید */}
      <View style={[styles.bottomNavContainer, { paddingBottom: insets.bottom }]}>
        <View style={styles.bottomNav}>
          {/* پروفایل */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab('profile');
              if (isGuest) {
                router.push({
                  pathname: '/login',
                  params: { redirect: '/user-profile' },
                } as any);
              } else {
                router.push('/user-profile' as any);
              }
            }}
          >
            <ExpoImage
              source={require('@/assets/images/Vector (3).svg')}
              style={styles.navIcon}
              contentFit="contain"
              tintColor={activeTab === 'profile' ? '#E7002B' : '#333333'}
            />
            <ThemedText
              style={activeTab === 'profile' ? styles.navItemTextActive : styles.navItemText}
            >
              پروفایل
            </ThemedText>
          </TouchableOpacity>

          {/* Divider 1 */}
          <View style={styles.navDivider} />

          {/* ثبت آگهی - وسط */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab('post');
              if (isGuest) {
                router.push({
                  pathname: '/login',
                  params: { redirect: '/post-ad' },
                } as any);
              } else {
                router.push('/post-ad' as any);
              }
            }}
          >
            <ExpoImage
              source={require('@/assets/images/Vector (1).svg')}
              style={styles.navIcon}
              contentFit="contain"
              tintColor={activeTab === 'post' ? '#E7002B' : '#333333'}
            />
            <ThemedText style={activeTab === 'post' ? styles.navItemTextActive : styles.navItemText}>
              ثبت آگهی
            </ThemedText>
          </TouchableOpacity>

          {/* Divider 2 */}
          <View style={styles.navDivider} />

          {/* خانه */}
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => {
              setActiveTab('home');
              // TODO: در آینده اگر صفحه دیگری داشتیم، اینجا ناوبری انجام شود
            }}
          >
            <ExpoImage
              source={require('@/assets/images/Vector (2).svg')}
              style={styles.navIcon}
              contentFit="contain"
              tintColor={activeTab === 'home' ? '#E7002B' : '#333333'}
            />
            <ThemedText style={activeTab === 'home' ? styles.navItemTextActive : styles.navItemText}>
              خانه
            </ThemedText>
          </TouchableOpacity>
        </View>
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
    gap: 0,
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
    backgroundColor: 'rgba(0, 150, 78, 0.26)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 4,
    marginTop: -8,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Vazir-Medium',
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
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryCardWrapper: {
    width: '30%',
    marginBottom: 12,
  },
  categoryCardFirst: {
    marginRight: 0,
  },
  categoryCardLast: {
    marginLeft: 0,
  },
  categoryCard: {
    width: '100%',
    backgroundColor: '#FAFAFA',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 12,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconContainer: {
    marginBottom: 8,
  },
  categoryIcon: {
    width: 24,
    height: 24,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#333333',
    fontFamily: 'Vazir',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Vazir-Medium',
    marginBottom: 12,
    textAlign: 'right',
  },
  adCardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 12,
    marginBottom: 16,
  },
  adCardContent: {
    flexDirection: 'row-reverse',
    padding: 16,
  },
  adImageContainer: {
    marginLeft: 16,
  },
  adImage: {
    width: 108,
    height: 108,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  placeholderImage: {
    backgroundColor: '#E0E0E0',
  },
  adTextContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    fontFamily: 'Vazir-Medium',
    marginBottom: 8,
    textAlign: 'right',
  },
  adPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(77, 77, 77, 0.8)',
    fontFamily: 'Vazir-Medium',
    marginBottom: 8,
    textAlign: 'right',
  },
  adTime: {
    fontSize: 10,
    fontWeight: '500',
    color: '#928383',
    fontFamily: 'Vazir-Medium',
    marginTop: 8,
    textAlign: 'right',
  },
  adBadge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  adBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4D4D4D',
    fontFamily: 'Vazir-Medium',
  },
  bannerContainer: {
    height: 100,
    backgroundColor: '#D2EBD8',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  bannerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Bold',
  },
  adsSection: {
    paddingHorizontal: 16,
  },
  adsList: {
    gap: 16,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#F1F8F4',
    borderTopWidth: 0.5,
    borderTopColor: '#D3D3D3',
    paddingBottom: 0, // SafeAreaView خودش padding اضافه می‌کند
  },
  bottomNav: {
    width: '100%',
    height: 80,
    flexDirection: 'row', // RTL - manual control
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
  // Modal Styles
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
    paddingBottom: 16,
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
    flex: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#D3D3D3',
    marginHorizontal: 24,
  },
  modalSearchContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  modalSearchBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'space-between',
    height: 44,
    backgroundColor: '#FAFAFA',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    paddingVertical: 0,
  },
  modalSearchIconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalScrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  modalCategoryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
  },
  modalCategoryIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalCategoryIcon: {
    width: 24,
    height: 24,
  },
  modalCategoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    marginRight: 12,
  },
  modalLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
});
