import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { MayanColors, Colors } from '@/src/constants/theme';
import { useColorScheme } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button = ({ title, variant = 'primary', style, textStyle, ...props }: ButtonProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const backgroundColor = variant === 'primary' ? MayanColors.jade : 'transparent';
  const textColor = variant === 'primary' 
    ? '#ffffff' 
    : Colors[isDark ? 'dark' : 'light'].text;

  const borderColor = variant === 'secondary' ? MayanColors.jade : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor, borderColor, borderWidth: variant === 'secondary' ? 2 : 0 },
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30, // Rounded button for modern look
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Shadow for Android
    width: '100%',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
