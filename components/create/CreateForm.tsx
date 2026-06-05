import { useMemo, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

import { router } from "expo-router";
import { CargoCategoryPicker } from "@/components/create/CargoCategoryPicker";
import { CalculationResult } from "@/components/create/CalculationResult";
import { SchedulePicker } from "@/components/create/SchedulePicker";
import { TempRangeCard } from "@/components/create/TempRangeCard";
import { CreateButtons } from "@/components/create/CreateButtons";
import {
  PRODUCT_CATEGORIES,
  calculateIce,
  getProfileFor,
} from "@/lib/icepack/data";
import { createShipment, createTrip } from "@/lib/icepack/services";
import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

const STEPS = [
  { num: 1, label: "Product Details" },
  { num: 2, label: "Route & Schedule" },
  { num: 3, label: "Quantity & Temp" },
];

export function CreateForm() {
  const { isTablet } = useScreenDimensions();
  const labelSize = useResponsiveFontSize("sm");
  const inputSize = useResponsiveFontSize("base");

  const [step, setStep] = useState(1);

  const [productId, setProductId] = useState(PRODUCT_CATEGORIES[0].id);
  const [shipmentName, setShipmentName] = useState("");
  const [cargoKg, setCargoKg] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [originLocation, setOriginLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [notes, setNotes] = useState("");

  const [hsCode, setHsCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [unitsPallets, setUnitsPallets] = useState("");

  const profile = getProfileFor(productId);
  const displayName = shipmentName || "None";

  const calc = useMemo(
    () => calculateIce(Number(cargoKg) || 0, Number(durationHours) || 0, profile),
    [cargoKg, durationHours, profile],
  );

  const canSubmit = Number(cargoKg) > 0 && Number(durationHours) > 0;
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (startNow: boolean) => {
    if (!canSubmit || isCreating) return;
    setIsCreating(true);
    try {
      let tripId: number | null = null;

      if (startNow) {
        const newTrip = await createTrip({
          trip_name: displayName,
          status: "active",
          started_at: new Date().toISOString(),
        });
        tripId = newTrip.id;
      }

      const shipmentInput: Record<string, unknown> = {
        shipment_name: displayName,
        cargo_category: productId,
        cargo_kg: Number(cargoKg),
        duration_hours: Number(durationHours),
        target_temp_min_c: profile.tempMinC,
        target_temp_max_c: profile.tempMaxC,
        origin_location: originLocation || null,
        destination_location: destinationLocation || null,
        notes: notes || null,
        is_planned: !startNow,
        status: startNow ? "active" : "planned",
        recommended_ice_kg: calc.recommendedIceKg,
        ice_remaining_kg: calc.recommendedIceKg,
        melt_rate_kg_per_hr: calc.meltRateKgPerHr,
        safe_duration_hours: calc.safeDurationHours,
        hs_code: hsCode || null,
        supplier_name: supplierName || null,
        schedule: scheduleDate?.toISOString() || null,
        units_pallets: unitsPallets ? Number(unitsPallets) : null,
      };
      if (tripId !== null) {
        shipmentInput.trip_id = tripId;
      }
      await createShipment(shipmentInput as any);

      setStep(1);
      setProductId(PRODUCT_CATEGORIES[0].id);
      setShipmentName("");
      setCargoKg("");
      setDurationHours("");
      setOriginLocation("");
      setDestinationLocation("");
      setNotes("");
      setHsCode("");
      setSupplierName("");
      setScheduleDate(null);
      setUnitsPallets("");
      setIsCreating(false);

      router.replace("/(tabs)/shipments");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create shipment";
      console.error("handleCreate:", msg, e);
      Alert.alert("Error", msg);
      setIsCreating(false);
    }
  };

  const inputStyle = {
    fontSize: inputSize,
    backgroundColor: "#f4f8fa",
    borderWidth: 1,
    borderColor: "#e8eef3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: isTablet ? 14 : 12,
    color: "#0b2540",
  };

  const sectionLabel = (title: string) => (
    <Text
      style={{
        fontSize: labelSize,
        fontWeight: "600",
        color: "#0b2540",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {title}
    </Text>
  );

  const fieldLabel = (title: string) => (
    <Text
      style={{
        fontSize: labelSize,
        color: "#587a94",
        marginBottom: 6,
        fontWeight: "500",
      }}
    >
      {title}
    </Text>
  );

  const renderStepIndicator = () => (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4 }}>
      {STEPS.map((s, i) => (
        <View key={s.num} style={{ flexDirection: "row", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: step >= s.num ? "#1a8ad4" : "#e8eef3",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: step >= s.num ? "#fff" : "#9bb4c7",
                  fontWeight: "700",
                  fontSize: 14,
                }}
              >
                {s.num}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 10,
                color: step >= s.num ? "#1a8ad4" : "#9bb4c7",
                marginTop: 4,
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              {s.label}
            </Text>
          </View>
          {i < STEPS.length - 1 && (
            <View
              style={{
                flex: 1,
                height: 2,
                backgroundColor: step > s.num ? "#1a8ad4" : "#e8eef3",
                marginHorizontal: 8,
                marginBottom: 18,
              }}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ gap: 24 }}>
      {renderStepIndicator()}

      {/* Step 1: Product Details */}
      {step === 1 && (
        <View style={{ gap: 20 }}>
          <View>
            {sectionLabel("Shipment Name")}
            <TextInput
              value={shipmentName}
              onChangeText={setShipmentName}
              placeholder="Enter shipment name"
              placeholderTextColor="#9bb4c7"
              style={inputStyle}
            />
          </View>

          <View>
            {sectionLabel("Cargo Type")}
            <CargoCategoryPicker
              categories={PRODUCT_CATEGORIES}
              selectedId={productId}
              onSelect={(id) => setProductId(id)}
            />
          </View>
        </View>
      )}

      {/* Step 2: Route & Schedule */}
      {step === 2 && (
        <View style={{ gap: 20 }}>
          <View>
            {sectionLabel("Route")}
            <View style={{ gap: 12 }}>
              <View>
                {fieldLabel("Origin")}
                <LocationAutocomplete
                  value={originLocation}
                  onValueChange={setOriginLocation}
                  onLocationSelect={() => {}}
                  placeholder="City or location"
                />
              </View>
              <View>
                {fieldLabel("Destination")}
                <LocationAutocomplete
                  value={destinationLocation}
                  onValueChange={setDestinationLocation}
                  onLocationSelect={() => {}}
                  placeholder="City or location"
                />
              </View>
            </View>
          </View>

          <View>
            {sectionLabel("Schedule")}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.75}
                style={[inputStyle, { flex: 1, justifyContent: "center" }]}
              >
                <Text
                  style={{
                    fontSize: inputSize,
                    color: scheduleDate ? "#0b2540" : "#9bb4c7",
                  }}
                >
                  {scheduleDate
                    ? scheduleDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Select date..."}
                </Text>
              </TouchableOpacity>
              {scheduleDate && (
                <TouchableOpacity
                  onPress={() => setScheduleDate(null)}
                  activeOpacity={0.75}
                  style={{
                    width: 48,
                    borderRadius: 12,
                    backgroundColor: "#fee2e2",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 16, color: "#ef4444", fontWeight: "600" }}>
                    ✕
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <SchedulePicker
              visible={showDatePicker}
              selected={scheduleDate}
              onSelect={setScheduleDate}
              onClose={() => setShowDatePicker(false)}
            />
          </View>

          <View>
            {sectionLabel("Customs & Supplier")}
            <View style={{ gap: 12 }}>
              <View>
                {fieldLabel("HS Code / Classification")}
                <TextInput
                  value={hsCode}
                  onChangeText={setHsCode}
                  placeholder="e.g. 0201.10"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle}
                />
              </View>
              <View>
                {fieldLabel("Supplier / Producer Name")}
                <TextInput
                  value={supplierName}
                  onChangeText={setSupplierName}
                  placeholder="Supplier name"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle}
                />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Step 3: Quantity & Temperature */}
      {step === 3 && (
        <View style={{ gap: 20 }}>
          <View>
            {sectionLabel("Cargo Details")}
            <View className="flex-row gap-3">
              <View className="flex-1">
                {fieldLabel("Weight (kg)")}
                <TextInput
                  value={cargoKg}
                  onChangeText={setCargoKg}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle}
                />
              </View>
              <View className="flex-1">
                {fieldLabel("Duration (hrs)")}
                <TextInput
                  value={durationHours}
                  onChangeText={setDurationHours}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle}
                />
              </View>
            </View>
          </View>

          <View>
            {fieldLabel("Units / Pallets")}
            <TextInput
              value={unitsPallets}
              onChangeText={setUnitsPallets}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#9bb4c7"
              style={inputStyle}
            />
          </View>

          <View>
            {sectionLabel("Storage Profile")}
            <TempRangeCard
              profile={{
                label: profile.label,
                minTemp: profile.tempMinC,
                maxTemp: profile.tempMaxC,
                meltFactor: profile.iceFactor,
                description: profile.note,
              }}
            />
          </View>

          <CalculationResult
            recommendedIceKg={calc.recommendedIceKg}
            meltRateKgPerHr={calc.meltRateKgPerHr}
            safeDurationHours={calc.safeDurationHours}
          />

          <View>
            {sectionLabel("Notes")}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor="#9bb4c7"
              multiline
              numberOfLines={3}
              style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
            />
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {step > 1 && (
          <TouchableOpacity
            onPress={() => setStep((s) => s - 1)}
            activeOpacity={0.85}
            style={{
              flex: step < 3 ? 1 : 0,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: "#fff",
              borderWidth: 1,
              borderColor: "#e8eef3",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingHorizontal: step < 3 ? 0 : 20,
            }}
          >
            <ChevronLeft size={16} color="#0b2540" strokeWidth={2} />
            <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#0b2540" }}>
              Back
            </Text>
          </TouchableOpacity>
        )}
        {step < 3 ? (
          <TouchableOpacity
            onPress={() => setStep((s) => s + 1)}
            activeOpacity={0.85}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: "#0b2540",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: labelSize, fontWeight: "600", color: "#fff" }}>
              Next
            </Text>
            <ChevronRight size={16} color="#fff" strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }}>
            <CreateButtons canSubmit={canSubmit} loading={isCreating} onCreate={handleCreate} />
          </View>
        )}
      </View>
    </View>
  );
}
