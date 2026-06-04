import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { CargoCategoryPicker } from "@/components/create/CargoCategoryPicker";
import { CalculationResult } from "@/components/create/CalculationResult";
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

export function CreateForm() {
  const { isTablet } = useScreenDimensions();
  const labelSize = useResponsiveFontSize("sm");
  const inputSize = useResponsiveFontSize("base");

  const [productId, setProductId] = useState(PRODUCT_CATEGORIES[0].id);
  const [shipmentName, setShipmentName] = useState("");
  const [cargoKg, setCargoKg] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [originLocation, setOriginLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [notes, setNotes] = useState("");

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
      };
      if (tripId !== null) {
        shipmentInput.trip_id = tripId;
      }
      await createShipment(shipmentInput as any);

      setProductId(PRODUCT_CATEGORIES[0].id);
      setShipmentName("");
      setCargoKg("");
      setDurationHours("");
      setOriginLocation("");
      setDestinationLocation("");
      setNotes("");
      setIsCreating(false);

      router.replace("/(tabs)/");
    } catch (e) {
      console.error("handleCreate: Failed to create shipment", e);
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

  return (
    <View style={{ gap: 24 }}>
      {/* 1. Shipment Name */}
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

      {/* 2. Cargo Category */}
      <View>
        {sectionLabel("Cargo Type")}
        <CargoCategoryPicker
          categories={PRODUCT_CATEGORIES}
          selectedId={productId}
          onSelect={(id) => setProductId(id)}
        />
      </View>

      {/* 3. Storage Profile */}
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

      {/* 4. Cargo Details */}
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

      {/* 6. Route */}
      <View>
        {sectionLabel("Route")}
        <View style={{ gap: 12 }}>
          <View>
            {fieldLabel("Origin")}
            <TextInput
              value={originLocation}
              onChangeText={setOriginLocation}
              placeholder="City or location"
              placeholderTextColor="#9bb4c7"
              style={inputStyle}
            />
          </View>
          <View>
            {fieldLabel("Destination")}
            <TextInput
              value={destinationLocation}
              onChangeText={setDestinationLocation}
              placeholder="City or location"
              placeholderTextColor="#9bb4c7"
              style={inputStyle}
            />
          </View>
        </View>
      </View>

      {/* 7. Notes */}
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

      {/* 8. Calculation */}
      <CalculationResult
        recommendedIceKg={calc.recommendedIceKg}
        meltRateKgPerHr={calc.meltRateKgPerHr}
        safeDurationHours={calc.safeDurationHours}
      />

      {/* 9. Submit Buttons */}
      <CreateButtons canSubmit={canSubmit} loading={isCreating} onCreate={handleCreate} />
    </View>
  );
}
