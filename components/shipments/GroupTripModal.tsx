import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export function GroupTripModal({
  visible,
  selectedCount,
  groupName,
  onGroupNameChange,
  groupLoading,
  onCreateStart,
  onSavePlanned,
  onCancel,
  titleSize,
  labelSize,
}: {
  visible: boolean;
  selectedCount: number;
  groupName: string;
  onGroupNameChange: (name: string) => void;
  groupLoading: boolean;
  onCreateStart: () => void;
  onSavePlanned: () => void;
  onCancel: () => void;
  titleSize: number;
  labelSize: number;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            padding: 24,
            width: "100%",
            maxWidth: 400,
          }}
        >
          <Text
            style={{
              fontSize: titleSize * 0.6,
              fontWeight: "700",
              color: "#0b2540",
              marginBottom: 4,
            }}
          >
            New Trip from Shipments
          </Text>
          <Text
            style={{
              fontSize: labelSize,
              color: "#587a94",
              marginBottom: 16,
            }}
          >
            {selectedCount} planned shipments will be grouped into one trip
          </Text>

          <Text
            style={{
              fontSize: labelSize,
              fontWeight: "600",
              color: "#0b2540",
              marginBottom: 8,
            }}
          >
            Trip Name
          </Text>
          <TextInput
            value={groupName}
            onChangeText={onGroupNameChange}
            placeholder="e.g. Monday Delivery Run"
            placeholderTextColor="#9bb4c7"
            autoFocus
            style={{
              fontSize: labelSize,
              backgroundColor: "#f4f8fa",
              borderWidth: 1,
              borderColor: "#e8eef3",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: "#0b2540",
              marginBottom: 24,
            }}
          />

          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={onCreateStart}
              activeOpacity={0.85}
              disabled={groupLoading}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: groupLoading ? "#cbd5e1" : "#0b2540",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {groupLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : null}
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "700",
                  color: "white",
                }}
              >
                {groupLoading ? "Creating..." : "Create & Start Trip"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onSavePlanned}
              activeOpacity={0.85}
              disabled={groupLoading}
              style={{
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: groupLoading ? "#f4f8fa" : "#fff",
                alignItems: "center",
                borderWidth: 1,
                borderColor: groupLoading ? "#e8eef3" : "#e8eef3",
              }}
            >
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "600",
                  color: groupLoading ? "#9bb4c7" : "#0b2540",
                }}
              >
                Save as Planned
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.7}
              style={{
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "500",
                  color: "#587a94",
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
