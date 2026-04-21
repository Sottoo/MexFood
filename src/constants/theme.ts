/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#159868'; // Jade
const tintColorDark = '#27c98b'; // Bright Jade

export const MayanColors = {
  jade: '#159868',
  jadeLight: '#27c98b',
  jadeDark: '#0e6947',
  obsidian: '#1a1c1a',
  limestone: '#f4f1ea',
  terracotta: '#c85a17',
  gold: '#d4af37',
  mayanBlue: '#44a4ab', // Classic Maya Blue
};

export const Colors = {
  light: {
    text: '#2b2626', // Dark Stone
    background: '#f4f1ea', // Warm Limestone
    tint: tintColorLight,
    icon: '#786b62', // Earthy Tone
    tabIconDefault: '#786b62',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#e5e2db', // Limestone
    background: '#1a1c1a', // Obsidian
    tint: tintColorDark,
    icon: '#8c968f', // Stone
    tabIconDefault: '#8c968f',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
