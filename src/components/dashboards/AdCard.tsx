// کامپوننت کارت آگهی

import { ThemedText } from '@/components/themed-text';
import { type Ad } from '@/src/services/ads';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface AdCardProps {
  ad: Ad;
  onPress?: () => void;
}

export function AdCard({ ad, onPress }: AdCardProps) {
  // فرمت کردن قیمت
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  // فرمت کردن تاریخ - جدا کردن تاریخ و ساعت
  const formatDateParts = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const persianDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(date);
      const persianTime = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
      return {
        date: persianDate,
        time: persianTime + ' ساعت',
      };
    } catch {
      return {
        date: dateString,
        time: '',
      };
    }
  };

  // گرفتن اولین عکس
  const firstImage = ad.images && ad.images.length > 0 ? ad.images[0].image_url : null;
  const dateParts = formatDateParts(ad.created_at);

  // تعیین رنگ badge بر اساس status
  const getStatusBadgeStyle = () => {
    switch (ad.status) {
      case 'pending':
        return { backgroundColor: 'rgba(255, 215, 0, 0.4)' };
      case 'approved':
        return { backgroundColor: 'rgba(0, 150, 78, 0.2)' };
      case 'rejected':
        return { backgroundColor: 'rgba(231, 0, 43, 0.2)' };
      default:
        return { backgroundColor: 'rgba(255, 215, 0, 0.4)' };
    }
  };

  const getStatusText = () => {
    switch (ad.status) {
      case 'pending':
        return 'در انتظار تأیید';
      case 'approved':
        return 'تأیید شده';
      case 'rejected':
        return 'رد شده';
      default:
        return 'در انتظار تأیید';
    }
  };


  return (
    <TouchableOpacity style={styles.adCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        {/* سمت چپ: محتوای متنی */}
        <View style={styles.textContent}>
          {/* عنوان */}
          <ThemedText style={styles.adTitle} numberOfLines={1}>
            {ad.title}
          </ThemedText>

          {/* ردیف دسته‌بندی و Badge وضعیت */}
          <View style={styles.categoryRow}>
            <ThemedText style={styles.adCategory} numberOfLines={1}>
              {ad.category_name || 'بدون دسته‌بندی'}
            </ThemedText>
            <View style={[styles.statusBadge, getStatusBadgeStyle()]}>
              <ThemedText style={styles.statusText}>{getStatusText()}</ThemedText>
            </View>
          </View>

          {/* قیمت */}
          <ThemedText style={styles.adPrice}>{formatPrice(ad.price)}</ThemedText>

          {/* ردیف تاریخ/ساعت و Badge کاربر */}
          <View style={styles.bottomRow}>
            {/* تاریخ و ساعت */}
            <View style={styles.dateContainer}>
              <ThemedText style={styles.adDate}>{dateParts.date}</ThemedText>
              <ThemedText style={styles.adTime}>{dateParts.time}</ThemedText>
            </View>

            {/* Badge کاربر */}
            <View style={styles.userBadge}>
              <ThemedText style={styles.userName}>{ad.user_name || `کاربر ${ad.user_id}`}</ThemedText>
              <ThemedText style={styles.userId}>ID:{ad.user_id}</ThemedText>
            </View>
          </View>
        </View>

        {/* سمت راست: عکس */}
        <View style={styles.imageContainer}>
          {firstImage ? (
            <ExpoImage
              source={{ uri: firstImage }}
              style={styles.adImage}
              contentFit="cover"
              placeholder={require('@/app/Ellipse 1.png')}
            />
          ) : (
            <View style={[styles.adImage, styles.placeholderImage]}>
              <ThemedText style={styles.placeholderText}>بدون عکس</ThemedText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  adCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    paddingRight: 8,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '300',
    color: '#000000',
    fontFamily: 'Vazir-Light',
    marginBottom: 4,
    lineHeight: 20,
    textAlign: 'right',
  },
  categoryRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  adCategory: {
    fontSize: 12,
    fontWeight: '300',
    color: 'rgba(77, 77, 77, 0.8)',
    fontFamily: 'Vazir-Light',
    lineHeight: 18,
    textAlign: 'right',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 5,
    minWidth: 60,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 8,
    fontWeight: '400',
    color: '#757575',
    fontFamily: 'Vazir',
    textAlign: 'center',
    lineHeight: 12,
  },
  adPrice: {
    fontSize: 14,
    fontWeight: '300',
    color: 'rgba(77, 77, 77, 0.8)',
    fontFamily: 'Vazir-Light',
    marginBottom: 4,
    lineHeight: 24,
    textAlign: 'right',
  },
  bottomRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    alignItems: 'flex-end',
  },
  adDate: {
    fontSize: 12,
    fontWeight: '300',
    color: '#928383',
    fontFamily: 'Vazir-Light',
    lineHeight: 14,
    textAlign: 'right',
    marginBottom: 2,
  },
  adTime: {
    fontSize: 12,
    fontWeight: '300',
    color: '#928383',
    fontFamily: 'Vazir-Light',
    lineHeight: 14,
    textAlign: 'right',
  },
  userBadge: {
    backgroundColor: '#D3D3D3',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 6,
    minWidth: 110,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 10,
    fontWeight: '300',
    color: '#4D4D4D',
    fontFamily: 'Vazir-Light',
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 12,
  },
  userId: {
    fontSize: 8,
    fontWeight: '300',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Light',
    textAlign: 'center',
    lineHeight: 12,
  },
  imageContainer: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  adImage: {
    width: 88,
    height: 88,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#757575',
    fontFamily: 'Vazir-Light',
  },
});

