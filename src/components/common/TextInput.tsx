// کامپوننت اینپوت متن

import React, { useState } from 'react';
import { TextInput as RNTextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { COLORS, SIZES } from '../../constants';

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function TextInput({
  label,
  error,
  leftIcon,
  rightIcon,
  style,
  value,
  ...props
}: CustomTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.trim().length > 0;
  const shouldHighlight = isFocused || hasValue;

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={styles.label}>{label}</ThemedText>
      )}
      <View style={[
        styles.inputContainer, 
        error && styles.inputError,
        shouldHighlight && styles.inputFocused
      ]}>
        {leftIcon && (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}
        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.md,
  },
  label: {
    marginBottom: SIZES.sm,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5, // مطابق Figma
    borderColor: 'rgba(231, 0, 43, 0.5)', // مطابق Figma
    borderRadius: 12, // مطابق Figma
    backgroundColor: '#FFFFFF',
    height: 48, // مطابق Figma
    width: '100%', // responsive width
    maxWidth: 398, // حداکثر عرض مطابق Figma
  },
  inputFocused: {
    borderColor: '#E7002B', // رنگ قرمز هنگام focus یا پر بودن
    borderWidth: 1,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16, // مطابق Figma
    fontSize: 12, // مطابق Figma
    fontFamily: 'Vazir-FD', // استفاده از فونت Vazir
    color: '#757575', // مطابق Figma
    textAlign: 'left',
    fontWeight: '400', // مطابق Figma
    lineHeight: 15, // محاسبه شده از Figma
  },
  leftIcon: {
    paddingLeft: SIZES.md,
  },
  rightIcon: {
    paddingRight: SIZES.md,
  },
  errorText: {
    marginTop: SIZES.xs,
    fontSize: 12,
    color: COLORS.error,
  },
});
