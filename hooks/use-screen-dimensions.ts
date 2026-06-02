import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';
import {
  getActiveBreakpoint,
  getDeviceCategory,
  PlatformDefaults,
  type BreakpointKey,
  type DeviceCategory,
} from '@/constants/responsive';

interface ScreenDimensions {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  isLandscape: boolean;
  isPortrait: boolean;
  breakpoint: BreakpointKey | 'base';
  category: DeviceCategory;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isSmallDevice: boolean;
}

export function useScreenDimensions(): ScreenDimensions {
  const { width, height, scale, fontScale } = useWindowDimensions();

  return useMemo(() => {
    const isLandscape = width > height;
    const breakpoint = getActiveBreakpoint(width);
    const category = getDeviceCategory(width);

    return {
      width,
      height,
      scale,
      fontScale,
      isLandscape,
      isPortrait: !isLandscape,
      breakpoint,
      category,
      isPhone: category === 'phone',
      isTablet: category === 'tablet',
      isDesktop: category === 'desktop',
      isSmallDevice: width < 375,
    };
  }, [width, height, scale, fontScale]);
}

export function useBreakpointValue<T>(values: Partial<Record<BreakpointKey | 'base' | 'default', T>>): T | undefined {
  const { breakpoint } = useScreenDimensions();
  const breakpointIndex = ['base', 'sm', 'md', 'lg', 'xl', '2xl'].indexOf(breakpoint);

  const orderedKeys = ['base', 'sm', 'md', 'lg', 'xl', '2xl'] as const;

  return useMemo(() => {
    if (values[breakpoint] !== undefined) return values[breakpoint];

    if (values.default !== undefined) return values.default;

    for (let i = breakpointIndex; i >= 0; i--) {
      const key = orderedKeys[i];
      if (values[key] !== undefined) return values[key];
    }

    return undefined;
  }, [breakpoint, values]);
}

export function useOrientation(): { isLandscape: boolean; isPortrait: boolean } {
  const { width, height } = useWindowDimensions();
  return useMemo(() => ({
    isLandscape: width > height,
    isPortrait: width <= height,
  }), [width, height]);
}

export function useMaxContentWidth(): number | undefined {
  const { isDesktop } = useScreenDimensions();
  return isDesktop ? PlatformDefaults.maxContentWidth : undefined;
}
