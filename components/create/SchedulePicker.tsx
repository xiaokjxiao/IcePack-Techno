import { useMemo, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react-native";
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
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function todayAtMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatHour(h: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr} ${ampm}`;
}

function formatMinute(m: number): string {
  return String(m).padStart(2, "0");
}

function buildDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(year, month, day, hour, minute, 0, 0);
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

  const [pickedDate, setPickedDate] = useState<Date | null>(null);
  const [pickedHour, setPickedHour] = useState(() => selected?.getHours() ?? 8);
  const [pickedMinute, setPickedMinute] = useState(() => selected?.getMinutes() ?? 0);
  const [viewMonth, setViewMonth] = useState(() => selected ?? today);

  const resetState = () => {
    setPickedDate(null);
    setPickedHour(selected?.getHours() ?? 8);
    setPickedMinute(selected?.getMinutes() ?? 0);
    setViewMonth(selected ?? today);
  };

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

  const isSelectedDay = (day: number) => {
    const ref = pickedDate ?? selected;
    if (!ref) return false;
    return (
      ref.getFullYear() === year &&
      ref.getMonth() === month &&
      ref.getDate() === day
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

  const effectiveDate = pickedDate ?? selected;
  const hasSelection = effectiveDate != null;

  const doneLabel = hasSelection
    ? `${effectiveDate!.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${formatHour(pickedHour)}:${formatMinute(pickedMinute)}`
    : "Done";

  const hourScrollRef = (el: ScrollView | null) => {
    if (el && hasSelection) {
      el.scrollTo({ y: pickedHour * 40, animated: false });
    }
  };

  const minuteScrollRef = (el: ScrollView | null) => {
    if (el && hasSelection) {
      el.scrollTo({ y: pickedMinute * 40, animated: false });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onShow={() => {
        setPickedDate(null);
        setPickedHour(selected?.getHours() ?? 8);
        setPickedMinute(selected?.getMinutes() ?? 0);
        setViewMonth(selected ?? today);
      }}
    >
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

          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            {WEEKDAYS.map((d) => (
              <View key={d} style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ fontSize: 11, color: "#587a94", fontWeight: "600", textTransform: "uppercase" }}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={{ flexDirection: "row", marginBottom: 4 }}>
              {week.map((day, di) => {
                if (day === null) return <View key={di} style={{ flex: 1 }} />;

                const past = isPast(day);
                const sel = isSelectedDay(day);

                return (
                  <TouchableOpacity
                    key={di}
                    onPress={() => {
                      if (!past) {
                        setPickedDate(buildDate(year, month, day, pickedHour, pickedMinute));
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

          <View className="h-px bg-black/[0.07] my-3" />

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 6 }}>
            <Clock size={14} color="#587a94" />
            <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#587a94" }}>
              Time
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 10, color: "#9bb4c7", fontWeight: "600", marginBottom: 4 }}>
                HOUR
              </Text>
              <View style={{ height: 120 }}>
                <ScrollView
                  ref={hourScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                  style={{ flex: 1 }}
                >
                  <View style={{ paddingVertical: 40 }}>
                    {HOURS.map((h) => {
                      const active = h === pickedHour;
                      return (
                        <TouchableOpacity
                          key={h}
                          onPress={() => setPickedHour(h)}
                          style={{
                            height: 40,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: active ? baseSize : labelSize,
                              fontWeight: active ? "700" : "400",
                              color: active ? "#1a8ad4" : "#9bb4c7",
                            }}
                          >
                            {formatHour(h)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>

            <Text style={{ fontSize: baseSize, fontWeight: "700", color: "#0b2540", paddingTop: 12 }}>
              :
            </Text>

            <View style={{ alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 10, color: "#9bb4c7", fontWeight: "600", marginBottom: 4 }}>
                MIN
              </Text>
              <View style={{ height: 120 }}>
                <ScrollView
                  ref={minuteScrollRef}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={40}
                  decelerationRate="fast"
                  style={{ flex: 1 }}
                >
                  <View style={{ paddingVertical: 40 }}>
                    {MINUTES.map((m) => {
                      const active = m === pickedMinute;
                      return (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setPickedMinute(m)}
                          style={{
                            height: 40,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: active ? baseSize : labelSize,
                              fontWeight: active ? "700" : "400",
                              color: active ? "#1a8ad4" : "#9bb4c7",
                            }}
                          >
                            {formatMinute(m)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>

          <View className="h-px bg-black/[0.07] my-3" />

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => { resetState(); onClose(); }}
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
            {hasSelection && (
              <TouchableOpacity
                onPress={() => {
                  const d = effectiveDate!;
                  const final = buildDate(d.getFullYear(), d.getMonth(), d.getDate(), pickedHour, pickedMinute);
                  onSelect(final);
                  resetState();
                  onClose();
                }}
                activeOpacity={0.75}
                style={{
                  flex: 2,
                  paddingVertical: 12,
                  borderRadius: 12,
                  backgroundColor: "#1a8ad4",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#fff" }}>
                  {doneLabel}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
