import { useRouter } from 'expo-router';
import { SplashScreen } from '@/components/splash-screen';

export default function SplashIndex() {
  const router = useRouter();

  return <SplashScreen onComplete={() => router.replace('/(tabs)')} />;
}
