import { Platform, Dimensions } from 'react-native';

export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof Breakpoints;

export const BreakpointOrder: BreakpointKey[] = ['sm', 'md', 'lg', 'xl', '2xl'];

export function getActiveBreakpoint(width: number): BreakpointKey | 'base' {
  if (width >= Breakpoints['2xl']) return '2xl';
  if (width >= Breakpoints.xl) return 'xl';
  if (width >= Breakpoints.lg) return 'lg';
  if (width >= Breakpoints.md) return 'md';
  if (width >= Breakpoints.sm) return 'sm';
  return 'base';
}

export type DeviceCategory = 'phone' | 'tablet' | 'desktop';

export function getDeviceCategory(width: number): DeviceCategory {
  if (width >= Breakpoints.lg) return 'desktop';
  if (width >= Breakpoints.md) return 'tablet';
  return 'phone';
}

export const Orientation = {
  get portrait() {
    const { width, height } = Dimensions.get('window');
    return height > width;
  },
  get landscape() {
    const { width, height } = Dimensions.get('window');
    return width > height;
  },
};

export const FontScale = {
  baseWidth: 390,
  minScale: 0.85,
  maxScale: 1.15,
  scalingFactor: Platform.select({
    ios: 0.5,
    android: 0.4,
    web: 0.6,
    default: 0.5,
  }),
  cutoffSmall: 320,
  cutoffLarge: 1200,
};

export const ResponsiveFontSizes = {
  xs: { base: 10, min: 9, max: 12 },
  sm: { base: 12, min: 11, max: 14 },
  base: { base: 16, min: 14, max: 18 },
  lg: { base: 18, min: 16, max: 20 },
  xl: { base: 20, min: 18, max: 24 },
  '2xl': { base: 24, min: 22, max: 30 },
  '3xl': { base: 30, min: 26, max: 36 },
  '4xl': { base: 36, min: 30, max: 48 },
};

export const ResponsiveSpacing = {
  sm: { base: 8, min: 6, max: 12 },
  md: { base: 16, min: 12, max: 24 },
  lg: { base: 24, min: 20, max: 32 },
  xl: { base: 32, min: 24, max: 48 },
  '2xl': { base: 48, min: 36, max: 64 },
};

export const PlatformDefaults = {
  hitSlop: Platform.select({
    ios: { top: 10, bottom: 10, left: 10, right: 10 },
    android: { top: 8, bottom: 8, left: 8, right: 8 },
    default: { top: 4, bottom: 4, left: 4, right: 4 },
  }),
  minTouchTarget: Platform.select({
    ios: 44,
    android: 48,
    default: 32,
  }),
  maxContentWidth: Platform.select({
    web: 1200,
    default: 640,
  }),
};
