/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#1a8ad4';
const tintColorDark = '#4dcfdb';

export const Brand = {
  primary: '#1a8ad4',
  primaryDark: '#1a3d5c',
  splash: {
    light: '#1a8ad4',
    dark: '#1a3d5c',
  },
};

export const Colors = {
  light: {
    text: '#12283b',
    background: '#f4f8fa',
    tint: tintColorLight,
    icon: '#587a94',
    tabIconDefault: '#6b8a9e',
    tabIconSelected: tintColorLight,
    border: '#e8eef3',
  },
  dark: {
    text: '#f0f5f9',
    background: '#12283b',
    tint: tintColorDark,
    icon: '#8ba4b8',
    tabIconDefault: '#9bb4c7',
    tabIconSelected: tintColorDark,
    border: '#1a3148',
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
