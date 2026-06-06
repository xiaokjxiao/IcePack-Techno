import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Colors } from "@/constants/theme";
import type { UserRole } from "@/lib/auth";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (email: string, password: string, role: UserRole, fullName?: string) => Promise<void>;
  loading?: boolean;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "operator", label: "Operator" },
  { value: "tracker", label: "Tracker" },
];

export default function AuthForm({ mode, onSubmit, loading }: AuthFormProps) {
  const colors = Colors.light;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("operator");
  const [submitting, setSubmitting] = useState(false);

  const isSubmitting = loading || submitting;

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }
    if (mode === "register" && !fullName.trim()) {
      Alert.alert("Error", "Please enter your full name.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(email.trim(), password, role, mode === "register" ? fullName.trim() : undefined);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Text style={[styles.label, { color: colors.icon }]}>Email</Text>
        <TextInput
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Text style={[styles.label, { color: colors.icon }]}>Password</Text>
        <TextInput
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          editable={!isSubmitting}
        />
      </View>

      {mode === "register" && (
        <View style={styles.verticallySpaced}>
          <Text style={[styles.label, { color: colors.icon }]}>Full Name</Text>
          <TextInput
            onChangeText={setFullName}
            value={fullName}
            placeholder="John Doe"
            autoCapitalize="words"
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            editable={!isSubmitting}
          />
        </View>
      )}

      {mode === "register" && (
        <View style={styles.verticallySpaced}>
          <Text style={[styles.label, { color: colors.icon }]}>Role</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                style={[
                  styles.roleButton,
                  { borderColor: colors.border },
                  role === r.value && { backgroundColor: colors.tint, borderColor: colors.tint },
                ]}
                onPress={() => setRole(r.value)}
                disabled={isSubmitting}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    { color: colors.text },
                    role === r.value && { color: "#fff" },
                  ]}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === "login" ? "Sign In" : "Sign Up"}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: "stretch",
  },
  mt20: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
