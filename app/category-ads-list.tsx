import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/src/components/common/Icon';
import { AdCard } from '@/src/components/dashboards/AdCard';
import { getPublicAds, type Ad } from '@/src/services/ads';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoryAdsListScreen() {
  const params = useLocalSearchParams();
  const categoryId = params.categoryId ? parseInt(String(params.categoryId), 10) : undefined;
  const categoryName = params.categoryName as string || 'آگهی‌ها';
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // جستجو
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const loadAds = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await getPublicAds(
        'approved',
        pageNum,
        20,
        categoryId,
        searchQuery || undefined
      );
      
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
    setPage(1);
    setHasMore(true);
    loadAds(1, false);
  }, [categoryId, searchQuery]);

  // Debounce برای جستجو
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    loadAds(1, false);
  }, [categoryId, searchQuery]);

  const handleSearchInputChange = (text: string) => {
    setSearchInput(text);
  };

  const handleSearchClear = () => {
    setSearchInput('');
    setSearchQuery('');
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
    router.push(`/ad-detail?id=${ad.id}` as any);
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
          {searchQuery ? 'نتیجه‌ای یافت نشد' : 'هیچ آگهی‌ای در این دسته وجود ندارد'}
        </ThemedText>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
          <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>
          {categoryName}
        </ThemedText>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="magnifying-glass" size={20} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="...جستجو در آگهی‌ها"
            placeholderTextColor="#9E9E9E"
            value={searchInput}
            onChangeText={handleSearchInputChange}
            returnKeyType="search"
            textAlign="right"
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

      {/* Ads List */}
      {loading && page === 1 ? (
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
          keyExtractor={(item) => `ad-${item.id}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#E7002B']}
              tintColor="#E7002B"
            />
          }
          showsVerticalScrollIndicator={false}
        />
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
    paddingBottom: 12,
    backgroundColor: '#F1F8F4',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'Vazir-Bold',
    textAlign: 'center',
    flex: 1,
  },
  headerPlaceholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    direction: 'rtl',
    textAlign: 'right',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E7002B',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E7002B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

