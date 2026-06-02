import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { CreateForm } from "@/components/create/CreateForm";
import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const padding = useResponsiveSpacing("lg");

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={["#173E61", "#246EA2"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            paddingLeft: padding,
            paddingRight: padding,
            paddingTop: insets.top + 16,
            paddingBottom: padding,
          }}
        >
          <Text
            style={{ fontSize: titleSize, fontWeight: "700", color: "white" }}
          >
            New Shipment
          </Text>
          <Text
            style={{ fontSize: labelSize, color: "rgba(255,255,255,0.6)", marginTop: 4 }}
          >
            Configure your cold-chain trip
          </Text>
        </LinearGradient>

        <View style={{ paddingHorizontal: padding, paddingTop: padding }}>
          <CreateForm />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
