import React, { PropsWithChildren } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MayanColors } from '@/src/constants/theme';
import { useColorScheme } from 'react-native';

interface SectionCardProps {
  title: string;
  style?: ViewStyle;
}

export function SectionCard({ title, children, style }: PropsWithChildren<SectionCardProps>) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.card, 
      { backgroundColor: isDark ? '#2a2c2a' : '#ffffff' },
      style
    ]}>
      <Text style={[styles.title, { color: MayanColors.terracotta }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    // Add border to reflect image styling
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
});
