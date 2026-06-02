import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_SIZE = Math.min(SCREEN_WIDTH * 0.48, 192);
const MIN_DISPLAY_MS = 2500;
const FALLBACK_MS = 4000;

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [showFallback, setShowFallback] = useState(false);
  const dismissed = useRef(false);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    requestAnimationFrame(() => {
      ExpoSplashScreen.hideAsync();
    });
    console.log('[SplashScreen] mounted, starting fade-in');
    opacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    scale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.2)) });
  }, [opacity, scale]);

  useEffect(() => {
    console.log('[SplashScreen] scheduling dismiss in', MIN_DISPLAY_MS, 'ms');
    const timer = setTimeout(() => {
      if (!dismissed.current) {
        console.log('[SplashScreen] dismissing, starting fade-out');
        dismissed.current = true;
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            console.log('[SplashScreen] fade-out complete, calling onComplete');
            runOnJS(onComplete)();
          }
        });
      }
    }, MIN_DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [onComplete, opacity]);

  useEffect(() => {
    const timer = setTimeout(() => setShowFallback(true), FALLBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const bgColor = '#ffffff';


  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <AnimatedImage
        source={require('@/assets/images/icepack logo-01 (1).png')}
        style={[{ width: LOGO_SIZE, height: LOGO_SIZE }, animatedStyle]}
        contentFit="contain"
      />
      {showFallback && (
        <View style={styles.fallback}>
          <ActivityIndicator size="large" color="#1a8ad4" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  fallback: {
    position: 'absolute',
    bottom: 80,
  },
});
