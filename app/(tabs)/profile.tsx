import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { LogOut } from "lucide-react-native";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { getCurrentUser, getCurrentUserRole, signOut } from "@/lib/auth";
import type { UserRole } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const baseSize = useResponsiveFontSize("base");
  const padding = useResponsiveSpacing("lg");

  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { user } = await getCurrentUser();
      setUser(user);
      const r = await getCurrentUserRole();
      setRole(r);
      setLoading(false);
    })();
  }, []);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#1a8ad4" />
      </View>
    );
  }

  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <LinearGradient
        colors={["#173E61", "#246EA2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingLeft: padding,
          paddingRight: padding,
          paddingBottom: padding,
          paddingTop: insets.top + 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "rgba(255,255,255,0.2)",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
            marginTop: 20,
          }}
        >
          <Text style={{ fontSize: 32, fontWeight: "700", color: "white" }}>
            {initials}
          </Text>
        </View>
        <Text style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}>
          {user?.email ?? "User"}
        </Text>
      </LinearGradient>

      <View style={{ paddingHorizontal: padding, paddingTop: padding, gap: 16 }}>
        <View
          style={{
            backgroundColor: "#f4f8fa",
            borderRadius: 12,
            padding: 16,
            gap: 16,
            borderWidth: 1,
            borderColor: "#e8eef3",
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: baseSize, color: "#587a94", fontWeight: "500" }}>Email</Text>
            <Text style={{ fontSize: baseSize, color: "#12283b", fontWeight: "600" }}>{user?.email}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: "#e8eef3" }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: baseSize, color: "#587a94", fontWeight: "500" }}>Role</Text>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 12,
                backgroundColor: role === "operator" ? "#e8f5e9" : "#e3f2fd",
              }}
            >
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "600",
                  color: role === "operator" ? "#2e7d32" : "#1565c0",
                }}
              >
                {role === "operator" ? "Operator" : "Tracker"}
              </Text>
            </View>
          </View>

          <View style={{ height: 1, backgroundColor: "#e8eef3" }} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: baseSize, color: "#587a94", fontWeight: "500" }}>User ID</Text>
            <Text
              style={{ fontSize: labelSize, color: "#12283b", fontWeight: "600", maxWidth: "60%" }}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {user?.id}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e8eef3",
          }}
        >
          <LogOut size={18} color="#ef4444" strokeWidth={2} />
          <Text style={{ fontSize: baseSize, fontWeight: "600", color: "#ef4444" }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
