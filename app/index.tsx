import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getSession } from '@/lib/auth';
import { SplashScreen } from '@/components/splash-screen';
import { Colors } from '@/constants/theme';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSession().then(({ session }) => {
      setChecking(false);
      if (session) {
        router.replace('/(tabs)');
      }
    });
  }, [router]);

  if (checking) {
    return (
      <View style={[styles.loading, { backgroundColor: Colors.light.background }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  return <SplashScreen onComplete={() => router.replace('/(auth)/login')} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
