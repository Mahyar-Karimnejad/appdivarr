import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';

const ROOM_OPTIONS = ['بدون اتاق', 'یک', 'دو', 'سه', 'چهار', 'پنج یا بیشتر'];

export default function PostAdRoomCountScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" backgroundColor="rgba(0,0,0,0.4)" />

      {/* بک‌گراند تیره پشت پاپ‌آپ */}
      <View style={styles.backdrop}>
        {/* خود پاپ‌آپ که از پایین باز می‌شود */}
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerArrow}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
            </TouchableOpacity>

            <ThemedText style={styles.headerTitle}>تعداد اتاق</ThemedText>

            <View style={styles.headerArrowPlaceholder} />
          </View>

          <View style={styles.headerDivider} />

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {ROOM_OPTIONS.map((label) => (
              <TouchableOpacity
                key={label}
                style={styles.optionRow}
                activeOpacity={0.7}
                onPress={() => {
                  // TODO: ذخیره انتخاب تعداد اتاق در state/global
                  router.back();
                }}
              >
                <ThemedText style={styles.optionText}>{label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  headerArrow: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerArrowPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'Vazir-Bold',
    textAlign: 'center',
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  optionRow: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
});


