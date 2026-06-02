import { useMemo } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import { FontScale, ResponsiveFontSizes } from '@/constants/responsive';

type ResponsiveFontKey = keyof typeof ResponsiveFontSizes;

interface ResponsiveFontOptions {
  size?: ResponsiveFontKey;
  baseSize?: number;
  minSize?: number;
  maxSize?: number;
  scaleFactor?: number;
}

function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function lerp(start: number, end: number, t: number): number {
  'worklet';
  return start + (end - start) * t;
}

export function useResponsiveFontSize(options: ResponsiveFontOptions): number {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const config = options.size ? ResponsiveFontSizes[options.size] : null;
    const baseSize = options.baseSize ?? config?.base ?? 16;
    const minSize = options.minSize ?? config?.min ?? baseSize * FontScale.minScale;
    const maxSize = options.maxSize ?? config?.max ?? baseSize * FontScale.maxScale;
    const userScaleFactor = options.scaleFactor ?? FontScale.scalingFactor;
    const effectiveBaseWidth = width < FontScale.cutoffSmall
      ? FontScale.cutoffSmall
      : width > FontScale.cutoffLarge
        ? FontScale.cutoffLarge
        : width;

    const widthRatio = effectiveBaseWidth / FontScale.baseWidth;

    const scale = 1 + (widthRatio - 1) * userScaleFactor;

    const fontSize = baseSize * scale;

    return clamp(fontSize, minSize, maxSize);
  }, [width, options.size, options.baseSize, options.minSize, options.maxSize, options.scaleFactor]);
}

export function useResponsiveLineHeight(fontSize: number, multiplier?: number): number {
  return useMemo(() => {
    const base = multiplier ?? 1.5;
    const adjusted = Platform.select({
      ios: base,
      android: base * 0.95,
      web: base * 1.1,
      default: base,
    });
    return Math.round(fontSize * adjusted);
  }, [fontSize, multiplier]);
}

export function responsiveFontSize(options: {
  size?: ResponsiveFontKey;
  baseSize?: number;
  minSize?: number;
  maxSize?: number;
  screenWidth: number;
  scaleFactor?: number;
}): number {
  const config = options.size ? ResponsiveFontSizes[options.size] : null;
  const baseSize = options.baseSize ?? config?.base ?? 16;
  const minSize = options.minSize ?? config?.min ?? baseSize * FontScale.minScale;
  const maxSize = options.maxSize ?? config?.max ?? baseSize * FontScale.maxScale;
  const userScaleFactor = options.scaleFactor ?? FontScale.scalingFactor;

  const effectiveWidth = options.screenWidth < FontScale.cutoffSmall
    ? FontScale.cutoffSmall
    : options.screenWidth > FontScale.cutoffLarge
      ? FontScale.cutoffLarge
      : options.screenWidth;

  const widthRatio = effectiveWidth / FontScale.baseWidth;
  const scale = 1 + (widthRatio - 1) * userScaleFactor;
  const fontSize = baseSize * scale;

  return clamp(fontSize, minSize, maxSize);
}
