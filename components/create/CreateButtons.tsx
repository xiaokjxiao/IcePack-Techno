import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { ArrowRight } from "lucide-react-native";
import { useResponsiveFontSize } from "@/hooks/use-responsive-size";

interface CreateButtonsProps {
  canSubmit: boolean;
  loading: boolean;
  onCreate: (startNow: boolean) => void;
}

export function CreateButtons({ canSubmit, loading, onCreate }: CreateButtonsProps) {
  const labelSize = useResponsiveFontSize("sm");

  return (
    <View style={{ gap: 12 }}>
      <TouchableOpacity
        onPress={() => onCreate(true)}
        activeOpacity={0.85}
        disabled={!canSubmit || loading}
        style={{
          backgroundColor: canSubmit && !loading ? "#0b2540" : "#cbd5e1",
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <ArrowRight size={16} color="#fff" strokeWidth={2} />
        )}
        <Text
          style={{
            fontSize: labelSize,
            fontWeight: "600",
            color: "#fff",
          }}
        >
          Create & Start Trip
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onCreate(false)}
        activeOpacity={0.85}
        disabled={!canSubmit || loading}
        style={{
          backgroundColor: canSubmit && !loading ? "#fff" : "#f4f8fa",
          borderRadius: 12,
          paddingVertical: 14,
          paddingHorizontal: 16,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          borderWidth: 1,
          borderColor: "#e8eef3",
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#0b2540" style={{ marginRight: 8 }} />
        ) : null}
        <Text
          style={{
            fontSize: labelSize,
            fontWeight: "600",
            color: canSubmit && !loading ? "#0b2540" : "#9bb4c7",
          }}
        >
          Save as Planned
        </Text>
      </TouchableOpacity>
    </View>
  );
}
