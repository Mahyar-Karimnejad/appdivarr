// کامپوننت تب لیست کاربران

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/src/components/common/Icon';
import { getUsersList, type User } from '@/src/services/auth';
import { Image as ExpoImage } from 'expo-image';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

interface UsersListTabProps {
  onUserPress?: (user: User) => void;
  searchQuery?: string; // برای جستجو
  refreshKey?: number; // برای refresh
}

export function UsersListTab({ onUserPress, searchQuery = '', refreshKey = 0 }: UsersListTabProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldRenderContent, setShouldRenderContent] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));
  const [heightAnim] = useState(new Animated.Value(0));
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (isExpanded && !hasLoaded) {
      loadUsers();
    }
  }, [isExpanded]);

  // Reload when search query changes or refresh key changes
  useEffect(() => {
    if (isExpanded && hasLoaded) {
      loadUsers();
    }
  }, [searchQuery, refreshKey]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getUsersList(1, 20, searchQuery || undefined);
      console.log('📋 Users List Response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log('✅ Users loaded:', response.data.length);
        console.log('👥 First user:', response.data[0]);
        setUsers(response.data);
        setHasLoaded(true);
      } else {
        console.error('❌ Failed to load users:', response.message);
        setError(response.message || 'خطا در دریافت لیست کاربران');
      }
    } catch (err: any) {
      console.error('❌ Error loading users:', err);
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;

    if (!isExpanded) {
      setShouldRenderContent(true);
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
        setShouldRenderContent(false);
      });
    }

    setIsExpanded(!isExpanded);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['90deg', '180deg'],
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
        {/* Chevron Icon - سمت چپ */}
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
        <ThemedText style={styles.headerTitle}>لیست کاربران</ThemedText>

        {/* Icon - سمت راست - فقط وقتی بسته است */}
        {!isExpanded && (
          <View style={styles.iconContainer}>
            <Icon name="user" size={18} />
          </View>
        )}
      </TouchableOpacity>

      {/* Content */}
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
            ) : users.length > 0 ? (
              <View style={styles.usersList}>
                {users.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userCard}
                    onPress={() => onUserPress?.(user)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.userInfo}>
                      {user.profile_image ? (
                        <ExpoImage
                          source={{ uri: user.profile_image }}
                          style={styles.userAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
                          <Icon name="user" size={20} color="#757575" />
                        </View>
                      )}
                      <View style={styles.userTextContainer}>
                        <ThemedText style={styles.userName} numberOfLines={1}>
                          {user.display_name || user.email}
                        </ThemedText>
                        {user.phone_number && (
                          <ThemedText style={styles.userPhone} numberOfLines={1}>
                            {user.phone_number}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <Icon name="chevron-right" size={16} color="#757575" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>
                  هیچ کاربری یافت نشد
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
  usersList: {
    gap: 12,
    marginBottom: 36,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.2,
    borderColor: '#8C8C8C',
    borderRadius: 8,
    padding: 12,
  },
  userInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  userAvatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
  },
  userTextContainer: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
  },
  userPhone: {
    fontSize: 12,
    fontWeight: '400',
    color: '#757575',
    fontFamily: 'Vazir',
    textAlign: 'right',
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
});

