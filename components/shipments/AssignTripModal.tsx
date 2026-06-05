import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Check } from "lucide-react-native";

interface AssignTripModalProps {
  visible: boolean;
  onClose: () => void;
  plannedTrips: { id: number; trip_name: string }[];
  selectedTripId: number | null;
  onSelectTrip: (id: number) => void;
  onAssign: () => void;
  assignLoading: boolean;
  labelSize: number;
}

export function AssignTripModal({
  visible,
  onClose,
  plannedTrips,
  selectedTripId,
  onSelectTrip,
  onAssign,
  assignLoading,
  labelSize,
}: AssignTripModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: "center" }} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            width: 300,
            paddingVertical: 16,
            shadowColor: "#0b2540",
            shadowOpacity: 0.15,
            shadowRadius: 20,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Text style={{ fontSize: labelSize, fontWeight: "700", color: "#0b2540", textAlign: "center", marginBottom: 4, paddingHorizontal: 16 }}>
            Assign to Trip
          </Text>
          <Text style={{ fontSize: labelSize * 0.85, color: "#94a3b8", textAlign: "center", marginBottom: 12, paddingHorizontal: 16 }}>
            Choose a planned trip
          </Text>

          {plannedTrips.length === 0 ? (
            <Text style={{ fontSize: labelSize, color: "#94a3b8", textAlign: "center", paddingVertical: 20, paddingHorizontal: 16 }}>
              No planned trips available
            </Text>
          ) : (
            <View style={{ maxHeight: 240 }}>
              <ScrollView>
                {plannedTrips.map((trip) => {
                  const isSelected = selectedTripId === trip.id;
                  return (
                    <TouchableOpacity
                      key={trip.id}
                      onPress={() => onSelectTrip(trip.id)}
                      activeOpacity={0.6}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "#f4f8fa",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: labelSize,
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected ? "#1a8ad4" : "#0b2540",
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {trip.trip_name}
                      </Text>
                      {isSelected && (
                        <Check size={16} color="#1a8ad4" strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: "#f4f8fa",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#587a94" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onAssign}
              disabled={!selectedTripId || assignLoading}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: !selectedTripId || assignLoading ? "#94c5e8" : "#1a8ad4",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: labelSize, fontWeight: "700", color: "white" }}>
                {assignLoading ? "Assigning..." : "Assign"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
