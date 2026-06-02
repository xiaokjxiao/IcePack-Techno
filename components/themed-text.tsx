import { Text, type TextProps, Platform } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useScreenDimensions } from '@/hooks/use-screen-dimensions';
import { useResponsiveFontSize, useResponsiveLineHeight } from '@/hooks/use-responsive-font';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  responsive?: boolean;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  responsive = true,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor(
    { light: lightColor, dark: darkColor },
    type === 'link' ? 'tint' : 'text'
  );

  const { isSmallDevice, isTablet } = useScreenDimensions();

  const typeConfig = TYPE_STYLE_MAP[type];

  const fontSize = useResponsiveFontSize({
    size: responsive ? typeConfig.fontKey : undefined,
    baseSize: responsive ? undefined : typeConfig.baseSize,
    minSize: responsive ? undefined : typeConfig.baseSize,
    maxSize: responsive ? undefined : typeConfig.baseSize,
  });

  const lineHeight = useResponsiveLineHeight(fontSize, typeConfig.lineHeightMultiplier);

  const fontWeight = typeConfig.fontWeight;

  const platformStyle = Platform.select({
    web: type === 'default' ? { WebkitFontSmoothing: 'antialiased' as any } : undefined,
    default: undefined,
  });

  return (
    <Text
      style={[
        { color, fontWeight },
        type === 'link' ? { textDecorationLine: 'underline' as const } : undefined,
        isSmallDevice ? typeConfig.smallStyle : undefined,
        isTablet ? typeConfig.tabletStyle : undefined,
        { fontSize, lineHeight },
        platformStyle,
        style,
      ]}
      {...rest}
    />
  );
}

const TYPE_STYLE_MAP = {
  default: {
    fontKey: 'base' as const,
    baseSize: 16,
    fontWeight: '400' as const,
    lineHeightMultiplier: 1.5,
    smallStyle: { fontSize: 14, lineHeight: 20 },
    tabletStyle: {},
  },
  defaultSemiBold: {
    fontKey: 'base' as const,
    baseSize: 16,
    fontWeight: '600' as const,
    lineHeightMultiplier: 1.5,
    smallStyle: { fontSize: 14, lineHeight: 20 },
    tabletStyle: {},
  },
  title: {
    fontKey: '4xl' as const,
    baseSize: 32,
    fontWeight: 'bold' as const,
    lineHeightMultiplier: 1.1,
    smallStyle: { fontSize: 26, lineHeight: 30 },
    tabletStyle: {},
  },
  subtitle: {
    fontKey: '2xl' as const,
    baseSize: 20,
    fontWeight: 'bold' as const,
    lineHeightMultiplier: 1.3,
    smallStyle: { fontSize: 18, lineHeight: 24 },
    tabletStyle: {},
  },
  link: {
    fontKey: 'base' as const,
    baseSize: 16,
    fontWeight: '400' as const,
    lineHeightMultiplier: 1.6,
    smallStyle: { fontSize: 14, lineHeight: 20 },
    tabletStyle: {},
  },
};
