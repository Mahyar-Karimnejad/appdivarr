// کامپوننت Icon برای استفاده از SVG ها

import { Image } from 'expo-image';
import { ImageStyle, StyleSheet, View } from 'react-native';

interface IconProps {
  name: 'clipboard-list' | 'check-double' | 'xmark-to-slot' | 'user' | 'magnifying-glass' | 'chevron-right' | 'home' | 'plus' | 'box' | 'arrow-left' | 'xmark';
  size?: number;
  color?: string;
  style?: ImageStyle;
}

const iconMap = {
  'clipboard-list': require('@/assets/images/clipboard-list 1.svg'),
  'check-double': require('@/assets/images/check-double 2.svg'),
  'xmark-to-slot': require('@/assets/images/xmark-to-slot 1.svg'),
  'user': require('@/assets/images/Vector.svg'),
  'magnifying-glass': require('@/assets/images/magnifying-glass.svg'),
  'chevron-right': require('@/assets/images/chevron-right-custom.svg'),
  'home': require('@/assets/images/Vector.svg'), // TODO: Replace with actual home icon
  'plus': require('@/assets/images/Vector.svg'), // TODO: Replace with actual plus icon
  'box': require('@/assets/images/Vector.svg'), // TODO: Replace with actual box icon
  'arrow-left': require('@/assets/images/arrow-left.svg'),
  'xmark': require('@/assets/images/xmark-to-slot 1.svg'), // Using xmark-to-slot as fallback
};

export function Icon({ name, size = 24, color, style }: IconProps) {
  const iconSource = iconMap[name];

  if (!iconSource) {
    return null;
  }

  // اگر color مشخص شده باشد از tintColor استفاده می‌کنیم
  const shouldUseTint = color;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={iconSource}
        style={[styles.icon, { width: size, height: size }]}
        contentFit="contain"
        tintColor={shouldUseTint ? color : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
});
