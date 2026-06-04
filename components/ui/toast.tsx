import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

export interface ToastConfig {
  message: string;
  variant?: "success" | "error";
}

export function useToast() {
  const [toast, setToast] = useState<ToastConfig | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback((config: ToastConfig) => {
    setToast(config);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { toast, show };
}

export function ToastBanner({ toast: config }: { toast: ToastConfig | null }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: config ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [config, opacity]);

  if (!config) return null;

  const bgColor = config.variant === "error" ? "#dc2626" : "#16a34a";

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 60,
        left: 16,
        right: 16,
        opacity,
        zIndex: 999,
      }}
    >
      <View
        style={{
          backgroundColor: bgColor,
          borderRadius: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
          shadowColor: "#0b2540",
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "white",
            textAlign: "center",
          }}
        >
          {config.message}
        </Text>
      </View>
    </Animated.View>
  );
}
