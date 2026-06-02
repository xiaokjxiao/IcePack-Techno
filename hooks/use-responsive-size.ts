import {
    FontScale,
    ResponsiveFontSizes,
    ResponsiveSpacing,
} from "@/constants/responsive";
import { useMemo } from "react";
import { useScreenDimensions } from "./use-screen-dimensions";

type FontSizeKey = keyof typeof ResponsiveFontSizes;
type SpacingKey = keyof typeof ResponsiveSpacing;

/**
 * Calculates responsive font size based on screen width
 * Uses interpolation between min/max values
 */
export function useResponsiveFontSize(sizeKey: FontSizeKey): number {
  const { width } = useScreenDimensions();

  return useMemo(() => {
    const config = ResponsiveFontSizes[sizeKey];
    const { baseWidth, minScale, maxScale } = FontScale;

    // Calculate scale factor based on screen width
    const deviation = (width - baseWidth) / baseWidth;
    const scaledFactor = Math.max(
      minScale,
      Math.min(maxScale, 1 + deviation * FontScale.scalingFactor),
    );

    // Interpolate between min and max based on scale
    const minSize = config.min;
    const maxSize = config.max;
    const baseSize = config.base;

    // Clamp the result between min and max
    const calculated = baseSize * scaledFactor;
    return Math.max(minSize, Math.min(maxSize, calculated));
  }, [width, sizeKey]);
}

/**
 * Calculates responsive spacing based on screen width
 */
export function useResponsiveSpacing(spacingKey: SpacingKey): number {
  const { width } = useScreenDimensions();

  return useMemo(() => {
    const config = ResponsiveSpacing[spacingKey];
    const { baseWidth, minScale, maxScale } = FontScale;

    const deviation = (width - baseWidth) / baseWidth;
    const scaledFactor = Math.max(
      minScale,
      Math.min(maxScale, 1 + deviation * FontScale.scalingFactor),
    );

    const minSpacing = config.min;
    const maxSpacing = config.max;
    const baseSpacing = config.base;

    const calculated = baseSpacing * scaledFactor;
    return Math.max(minSpacing, Math.min(maxSpacing, calculated));
  }, [width, spacingKey]);
}

/**
 * Get font size by breakpoint (for fallback)
 */
export function getFontSizeByBreakpoint(
  sizeKey: FontSizeKey,
  width: number,
): number {
  const config = ResponsiveFontSizes[sizeKey];

  // Simple linear interpolation for non-exact widths
  const minWidth = 320;
  const maxWidth = 1200;

  if (width <= minWidth) return config.min;
  if (width >= maxWidth) return config.max;

  const ratio = (width - minWidth) / (maxWidth - minWidth);
  return config.min + (config.max - config.min) * ratio;
}
