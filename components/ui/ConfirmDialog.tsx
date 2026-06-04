import { ActivityIndicator, Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import { useResponsiveFontSize } from "@/hooks/use-responsive-size";

interface ConfirmDialogAction {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "default" | "destructive" | "cancel";
}

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  actions: ConfirmDialogAction[];
  onClose: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  actions,
  onClose,
}: ConfirmDialogProps) {
  const baseSize = useResponsiveFontSize("base");
  const smSize = useResponsiveFontSize("sm");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: "white",
            borderRadius: 20,
            width: "100%",
            maxWidth: 320,
            padding: 24,
            shadowColor: "#0b2540",
            shadowOpacity: 0.15,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          }}
          onPress={() => {}}
        >
          <Text
            style={{
              fontSize: baseSize,
              fontWeight: "700",
              color: "#0f1419",
              marginBottom: 8,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontSize: smSize,
              color: "#64748b",
              lineHeight: smSize * 1.5,
              marginBottom: 20,
            }}
          >
            {message}
          </Text>

          <View style={{ gap: 8 }}>
            {actions.map((action, idx) => {
              if (action.variant === "cancel") {
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      onClose();
                      action.onPress();
                    }}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: "#f4f8fa",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: smSize,
                        fontWeight: "600",
                        color: "#587a94",
                      }}
                    >
                      {action.label}
                    </Text>
                  </TouchableOpacity>
                );
              }

              const isDestructive = action.variant === "destructive";
              return (
                <ConfirmActionButton
                  key={idx}
                  label={action.label}
                  onPress={action.onPress}
                  isDestructive={isDestructive}
                  labelSize={smSize}
                />
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ConfirmActionButton({
  label,
  onPress,
  isDestructive,
  labelSize,
}: {
  label: string;
  onPress: () => void | Promise<void>;
  isDestructive: boolean;
  labelSize: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: isDestructive ? "#fee2e2" : "#e3f2fd",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: labelSize,
          fontWeight: "700",
          color: isDestructive ? "#dc2626" : "#1a8ad4",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
