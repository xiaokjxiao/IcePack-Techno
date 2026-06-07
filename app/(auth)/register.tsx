import { KeyboardAvoidingView, Platform, ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { AuthForm } from "@/components/auth";
import { signUpWithEmail } from "@/lib/auth";
import { Colors } from "@/constants/theme";
import { useState } from "react";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = Colors.light;
  const [loading, setLoading] = useState(false);

  const handleRegister = async (email: string, password: string, role: "operator" | "tracker", fullName?: string) => {
    setLoading(true);
    const { error } = await signUpWithEmail(email, password, role, fullName);
    setLoading(false);

    if (error) {
      Alert.alert("Sign Up Failed", error.message);
      return;
    }

    Alert.alert(
      "Check your email",
      "We've sent you a verification link. Please verify your email before signing in.",
      [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Sign up as an Operator or Tracker
          </Text>
        </View>

        <AuthForm mode="register" onSubmit={handleRegister} loading={loading} />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.icon }]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={[styles.footerLink, { color: colors.tint }]}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
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
