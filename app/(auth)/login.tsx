import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AuthForm } from "@/components/auth";
import { signInWithEmail } from "@/lib/auth";
import { Colors } from "@/constants/theme";
import { useState } from "react";

export default function LoginScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      Alert.alert("Sign In Failed", error.message);
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          Sign in to continue managing your shipments
        </Text>
      </View>

      <AuthForm mode="login" onSubmit={handleLogin} loading={loading} />

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.icon }]}>
          Don&apos;t have an account?
        </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={[styles.footerLink, { color: colors.tint }]}> Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
