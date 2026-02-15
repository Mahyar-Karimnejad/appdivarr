// کامپوننت آیکون اطلاعات

import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function InfoIcon({ size = 16, color = '#757575' }: { size?: number; color?: string }) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('@/assets/images/circle-info 1.svg')}
        style={[styles.icon, { width: size, height: size }]}
        contentFit="contain"
        tintColor={color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: '100%',
    height: '100%',
  },
});

