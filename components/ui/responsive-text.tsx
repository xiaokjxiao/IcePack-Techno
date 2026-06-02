import { ResponsiveFontSizes } from "@/constants/responsive";
import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { Text, TextProps } from "react-native";

type FontSizeKey = keyof typeof ResponsiveFontSizes;

interface ResponsiveTextProps extends TextProps {
  sizeKey: FontSizeKey;
}

/**
 * A Text component that automatically applies responsive font sizing
 * Usage: <ResponsiveText sizeKey="base">Hello</ResponsiveText>
 */
export function ResponsiveText({
  sizeKey,
  style,
  ...props
}: ResponsiveTextProps) {
  const fontSize = useResponsiveFontSize(sizeKey);

  return <Text {...props} style={[style, { fontSize }]} />;
}
