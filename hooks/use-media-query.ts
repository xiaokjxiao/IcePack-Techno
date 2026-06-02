import { useMemo } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { Breakpoints } from '@/constants/responsive';

interface MediaQueryOptions {
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  orientation?: 'portrait' | 'landscape';
  platform?: 'ios' | 'android' | 'web';
}

export function useMediaQuery(query: MediaQueryOptions): boolean {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    if (query.minWidth !== undefined && width < query.minWidth) return false;
    if (query.maxWidth !== undefined && width > query.maxWidth) return false;
    if (query.minHeight !== undefined && height < query.minHeight) return false;
    if (query.maxHeight !== undefined && height > query.maxHeight) return false;

    if (query.orientation) {
      const isLandscape = width > height;
      if (query.orientation === 'landscape' && !isLandscape) return false;
      if (query.orientation === 'portrait' && isLandscape) return false;
    }

    if (query.platform && Platform.OS !== query.platform) return false;

    return true;
  }, [width, height, query.minWidth, query.maxWidth, query.minHeight, query.maxHeight, query.orientation, query.platform]);
}

interface ResponsiveStyle {
  base?: Record<string, any>;
  sm?: Record<string, any>;
  md?: Record<string, any>;
  lg?: Record<string, any>;
  xl?: Record<string, any>;
  '2xl'?: Record<string, any>;
}

export function useResponsiveStyle<T extends Record<string, any>>(styles: ResponsiveStyle): T | undefined {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    let matched: Record<string, any> | undefined;

    if (width >= Breakpoints['2xl'] && styles['2xl']) matched = styles['2xl'];
    else if (width >= Breakpoints.xl && styles.xl) matched = styles.xl;
    else if (width >= Breakpoints.lg && styles.lg) matched = styles.lg;
    else if (width >= Breakpoints.md && styles.md) matched = styles.md;
    else if (width >= Breakpoints.sm && styles.sm) matched = styles.sm;
    else if (styles.base) matched = styles.base;

    return matched as T | undefined;
  }, [width, styles]);
}
