import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/src/components/common/Icon';
import { AdCard } from '@/src/components/dashboards/AdCard';
import { getAdsByStatus, getPublicAds, type Ad } from '@/src/services/ads';
import { getCategories, type Category } from '@/src/services/categories';
import { TouchableOpacity } from 'react-native';
import type { User } from '@/src/services/auth';
import { getUser } from '@/src/utils/storage';

export default function AdsListScreen() {
  const params = useLocalSearchParams();
  const status = (params.status as 'pending' | 'approved' | 'rejected') || 'pending';
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // جستجو و فیلتر
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // برای input field
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // عنوان صفحه بر اساس status
  const getTitle = () => {
    // برای کاربران عادی (بدون لاگین یا غیر ادمین) همیشه عنوان عمومی نمایش بده
    if (!user || !user.is_admin) {
      return 'آگهی‌ها';
    }
    switch (status) {
      case 'pending':
        return 'در انتظار تأیید';
      case 'approved':
        return 'تأیید شده';
      case 'rejected':
        return 'رد شده';
      default:
        return 'آگهی‌ها';
    }
  };

  // آیکون بر اساس status
  const getIcon = () => {
    // برای کاربران عادی از آیکن جستجو/لیست استفاده نمی‌کنیم (فعلاً بدون آیکن خاص)
    if (!user || !user.is_admin) {
      return 'clipboard-list';
    }
    switch (status) {
      case 'pending':
        return 'clipboard-list';
      case 'approved':
        return 'check-double';
      case 'rejected':
        return 'xmark-to-slot';
      default:
        return 'clipboard-list';
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await getCategories(null, false);
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await getUser();
      setUser(userData);
    } catch (error) {
      console.error('Error loading user in ads list:', error);
    }
  };

  const loadAds = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      let response;

      // اگر کاربر لاگین نشده یا ادمین نیست، از endpoint عمومی استفاده کن
      if (!user || !user.is_admin) {
        response = await getPublicAds(
          'approved',
          pageNum,
          20,
          selectedCategoryId,
          searchQuery || undefined
        );
      } else {
        // برای ادمین، همان endpoint ادمین با فیلتر status استفاده می‌شود
        response = await getAdsByStatus(
          status,
          pageNum,
          20,
          selectedCategoryId,
          searchQuery || undefined
        );
      }
      
      if (response.success && response.data) {
        if (append) {
          setAds((prev) => [...prev, ...response.data!]);
        } else {
          setAds(response.data);
        }
        
        // بررسی اینکه آیا صفحه بعدی وجود دارد
        if (response.pagination) {
          setHasMore(pageNum < response.pagination.total_pages);
        } else {
          setHasMore(response.data.length === 20);
        }
      } else {
        setError(response.message || 'خطا در دریافت آگهی‌ها');
      }
    } catch (err: any) {
      console.error('Error loading ads:', err);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUser();
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadAds(1, false);
  }, [status, selectedCategoryId, searchQuery, user?.is_admin]);

  // Debounce برای جستجو
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadAds(1, false);
  }, [status, selectedCategoryId, searchQuery]);

  const handleSearchInputChange = (text: string) => {
    setSearchInput(text);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  const handleCategorySelect = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadAds(nextPage, true);
    }
  };

  const handleAdPress = (ad: Ad) => {
    router.push({
      pathname: '/ad-detail',
      params: { id: ad.id.toString() },
    });
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E7002B" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          هیچ آگهی‌ای در این دسته وجود ندارد
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>{getTitle()}</ThemedText>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnifying-glass" size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="جستجو در آگهی‌ها..."
            placeholderTextColor="#9E9E9E"
            value={searchInput}
            onChangeText={handleSearchInputChange}
            returnKeyType="search"
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={handleSearchClear}
              style={styles.clearButton}
            >
              <Icon name="xmark" size={16} color="#757575" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories Filter */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategoryId === undefined && styles.categoryChipActive,
              ]}
              onPress={() => handleCategorySelect(undefined)}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === undefined && styles.categoryChipTextActive,
                ]}
              >
                همه
              </ThemedText>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryChip,
                  selectedCategoryId === category.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategorySelect(category.id)}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.categoryChipText,
                    selectedCategoryId === category.id && styles.categoryChipTextActive,
                  ]}
                >
                  {category.name}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {loading && ads.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E7002B" />
          <ThemedText style={styles.loadingText}>در حال بارگذاری...</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadAds(1, false)}
            activeOpacity={0.7}
          >
            <ThemedText style={styles.retryButtonText}>تلاش مجدد</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={ads}
          renderItem={({ item }) => (
            <AdCard ad={item} onPress={() => handleAdPress(item)} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#E7002B']}
              tintColor="#E7002B"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Vazir-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#E7002B',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E7002B',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Medium',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#757575',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  searchInputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Vazir',
    color: '#333333',
    textAlign: 'right',
  },
  clearButton: {
    padding: 4,
  },
  categoriesContainer: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#E7002B',
    borderColor: '#E7002B',
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: 'Vazir-Medium',
    color: '#757575',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
});

