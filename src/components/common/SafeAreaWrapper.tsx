// Wrapper component for SafeAreaView with consistent edges

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';

interface SafeAreaWrapperProps extends Omit<SafeAreaViewProps, 'edges'> {
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: ViewStyle | ViewStyle[];
}

export function SafeAreaWrapper({ 
  edges = ['top', 'bottom'], 
  style, 
  children,
  ...props 
}: SafeAreaWrapperProps) {
  return (
    <SafeAreaView 
      style={[styles.container, style]} 
      edges={edges}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

