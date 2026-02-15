// کامپوننت دکمه مشترک

import { ThemedText } from '@/components/themed-text';
import { ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[size],
    (disabled || loading) && styles.disabled,
  ];

  const textColor = variant === 'outline' ? COLORS.primary : '#FFFFFF';

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <ThemedText 
          style={[styles.text, { color: textColor }]}
        >
          {title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 34, // مطابق Figma
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 40, // مطابق Figma
    width: '100%', // responsive width
    maxWidth: 398, // حداکثر عرض مطابق Figma
    overflow: 'hidden', // جلوگیری از خارج شدن محتوا
  },
  primary: {
    backgroundColor: '#E7002B', // رنگ قرمز دکمه لاگین
  },
  secondary: {
    backgroundColor: '#D3D3D3', // مطابق Figma - disable state
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  small: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
  },
  medium: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
  },
  large: {
    paddingHorizontal: 24, // مطابق Figma
    paddingVertical: 0, // حذف padding vertical برای جلوگیری از خارج شدن متن
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '500', // مطابق Figma
    fontSize: 16, // مطابق Figma
    fontFamily: 'Vazir-FD', // استفاده از فونت Vazir
    lineHeight: 25, // کاهش lineHeight برای center شدن بهتر در دکمه 40px
    textAlignVertical: 'center', // برای center شدن عمودی
  },
});
