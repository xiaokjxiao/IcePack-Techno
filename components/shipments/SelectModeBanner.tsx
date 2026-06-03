import { Text, View } from "react-native";

export function SelectModeBanner({
  selectedCount,
  totalPlanned,
  labelSize,
}: {
  selectedCount: number;
  totalPlanned: number;
  labelSize: number;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#e0f2fe",
          borderRadius: 10,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderWidth: 1,
          borderColor: "#bae6fd",
        }}
      >
        <Text
          style={{
            fontSize: labelSize,
            fontWeight: "600",
            color: "#0369a1",
          }}
        >
          Select planned shipments to group into a trip
        </Text>
      </View>
      <Text
        style={{
          fontSize: labelSize,
          fontWeight: "700",
          color: selectedCount > 0 ? "#0b2540" : "#9bb4c7",
        }}
      >
        {selectedCount} / {totalPlanned}
      </Text>
    </View>
  );
}
