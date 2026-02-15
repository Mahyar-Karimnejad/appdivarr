// صفحه درباره پاتوق

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/src/components/common/Icon';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
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
            <Icon name="arrow-left" size={24} color="#333333" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>درباره پاتوق</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <ThemedText style={styles.title}>درباره پاتوق</ThemedText>
          <ThemedText style={styles.description}>
            توضیحات درباره پاتوق در این قسمت نوشته میشود
          </ThemedText>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
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

        {/* پروفایل */}
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/user-profile' as any)}
        >
          <ExpoImage
            source={require('@/assets/images/Vector (3).svg')}
            style={styles.navIcon}
            contentFit="contain"
            tintColor="#333333"
          />
          <ThemedText style={styles.navItemText}>پروفایل</ThemedText>
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
    flexGrow: 1,
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Vazir-Bold',
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Vazir-Bold',
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Vazir-Medium',
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    textAlign: 'right',
    lineHeight: 24,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
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
  },
  navDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
});

