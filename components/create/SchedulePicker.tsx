import { useMemo, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

interface SchedulePickerProps {
  visible: boolean;
  selected: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function todayAtMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function SchedulePicker({
  visible,
  selected,
  onSelect,
  onClose,
}: SchedulePickerProps) {
  const labelSize = useResponsiveFontSize("sm");
  const baseSize = useResponsiveFontSize("base");
  const { isTablet } = useScreenDimensions();

  const today = useMemo(() => todayAtMidnight(), []);
  const [viewMonth, setViewMonth] = useState(() => selected ?? today);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const weeks = useMemo(() => {
    const cells: (number | null)[][] = [];
    let week: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) week.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      week.push(d);
      if (week.length === 7) {
        cells.push(week);
        week = [];
      }
    }
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      cells.push(week);
    }
    return cells;
  }, [year, month, daysInMonth, startDay]);

  const isPast = (day: number) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSelected = (day: number) => {
    if (!selected) return false;
    return (
      selected.getFullYear() === year &&
      selected.getMonth() === month &&
      selected.getDate() === day
    );
  };

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    if (d >= new Date(today.getFullYear(), today.getMonth(), 1)) {
      setViewMonth(d);
    }
  };

  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const canGoPrev = new Date(year, month - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: isTablet ? 24 : 20,
          }}
        >
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <TouchableOpacity
              onPress={prevMonth}
              disabled={!canGoPrev}
              activeOpacity={0.7}
              style={{ padding: 4, opacity: canGoPrev ? 1 : 0.3 }}
            >
              <ChevronLeft size={20} color="#0b2540" strokeWidth={2} />
            </TouchableOpacity>
            <Text style={{ fontSize: baseSize, fontWeight: "700", color: "#0b2540" }}>
              {MONTHS[month]} {year}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <ChevronRight size={20} color="#0b2540" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Weekday labels */}
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {WEEKDAYS.map((d) => (
              <View key={d} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#587a94", fontWeight: "600", textTransform: "uppercase" }}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: "row", marginBottom: 4 }}>
              {week.map((day, di) => {
                if (day === null) return <View key={di} style={{ flex: 1 }} />;

                const past = isPast(day);
                const sel = isSelected(day);

                return (
                  <TouchableOpacity
                    key={di}
                    onPress={() => {
                      if (!past) {
                        onSelect(new Date(year, month, day));
                        onClose();
                      }
                    }}
                    disabled={past}
                    activeOpacity={0.7}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: sel ? "#1a8ad4" : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: labelSize,
                        fontWeight: sel ? "700" : "500",
                        color: past ? "#d1d9e0" : sel ? "#fff" : "#0b2540",
                      }}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Footer */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.75}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#f4f8fa",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#587a94" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            {selected && (
              <TouchableOpacity
                onPress={() => {
                  onSelect(selected);
                  onClose();
                }}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#1a8ad4",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#fff" }}>
                  Done
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
