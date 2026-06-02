import {
  Apple,
  Beef,
  Fish,
  Milk,
  Monitor,
  Pill,
  SprayCan,
  Sprout,
  UtensilsCrossed,
} from "lucide-react-native";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Beef,
  Fish,
  Milk,
  Apple,
  UtensilsCrossed,
  Pill,
  Monitor,
  SprayCan,
  Sprout,
};

interface ProductIconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function ProductIcon({ name, size = 20, color = "#0b2540", strokeWidth = 2 }: ProductIconProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
