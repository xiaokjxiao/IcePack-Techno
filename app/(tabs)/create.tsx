import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";

import { CargoCategoryPicker } from "@/components/create/CargoCategoryPicker";
import { ContainerSelector } from "@/components/create/ContainerSelector";
import { CalculationResult } from "@/components/create/CalculationResult";
import { TempRangeCard } from "@/components/create/TempRangeCard";

import {
  PRODUCT_CATEGORIES,
  CONTAINER_TYPES,
  calculateIce,
  getProduct,
  getProfileFor,
} from "@/lib/icepack/data";
import { supabase } from "@/lib/supabase";
import { createShipment, createTrip } from "@/lib/icepack/services";

import {
  useResponsiveFontSize,
  useResponsiveSpacing,
} from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";

export default function CreateScreen() {
  const insets = useSafeAreaInsets();
  const { isTablet } = useScreenDimensions();
  const titleSize = useResponsiveFontSize("2xl");
  const labelSize = useResponsiveFontSize("sm");
  const inputSize = useResponsiveFontSize("base");
  const padding = useResponsiveSpacing("lg");

  const [productId, setProductId] = useState(PRODUCT_CATEGORIES[0].id);
  const [shipmentName, setShipmentName] = useState("");
  const [cargoKg, setCargoKg] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [container, setContainer] = useState(CONTAINER_TYPES[0]);
  const [originLocation, setOriginLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [notes, setNotes] = useState("");

  const profile = getProfileFor(productId);
  const defaultName = `${getProduct(productId).label} Shipment`;
  const displayName = shipmentName || defaultName;

  const calc = useMemo(
    () => calculateIce(Number(cargoKg) || 0, Number(durationHours) || 0, profile),
    [cargoKg, durationHours, profile],
  );

  const canSubmit = Number(cargoKg) > 0 && Number(durationHours) > 0;

  const handleCreate = async (startNow: boolean) => {
    console.debug("handleCreate: called", { startNow });
    if (!canSubmit) return;
    console.debug("handleCreate: form values", { productId, displayName, cargoKg, durationHours, container, originLocation, destinationLocation, notes, calc });
    console.debug("handleCreate: checking auth session...");
    const { data: sessionData } = await supabase.auth.getSession();
    console.debug("handleCreate: auth session", sessionData);
    try {
      const shipmentInput = {
        shipment_name: displayName,
        cargo_category: productId,
        cargo_kg: Number(cargoKg),
        container_type: container,
        duration_hours: Number(durationHours),
        target_temp_min_c: profile.tempMinC,
        target_temp_max_c: profile.tempMaxC,
        origin_location: originLocation || null,
        destination_location: destinationLocation || null,
        notes: notes || null,
      };
      console.debug("handleCreate: calling createShipment with", shipmentInput);
      const shipment = await createShipment(shipmentInput);
      console.debug("handleCreate: createShipment succeeded", shipment);

      const tripInput: Record<string, unknown> = {
        shipment_id: shipment.id,
        recommended_ice_kg: calc.recommendedIceKg,
        ice_remaining_kg: calc.recommendedIceKg,
        melt_rate_kg_per_hr: calc.meltRateKgPerHr,
        safe_duration_hours: calc.safeDurationHours,
        status: startNow ? "active" : "planned",
      };
      if (startNow) {
        tripInput.started_at = new Date().toISOString();
      }
      console.debug("handleCreate: calling createTrip with", tripInput);
      await createTrip(tripInput as any);
      console.debug("handleCreate: createTrip succeeded, navigating back");
      router.back();
    } catch (e) {
      console.error("handleCreate: Failed to create shipment", e);
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
        {/* Header */}
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

        <View style={{ paddingHorizontal: padding, paddingTop: padding, gap: 24 }}>
          {/* 1. Shipment Name */}
          <View>
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
              Shipment Name
            </Text>
            <TextInput
              value={shipmentName}
              onChangeText={setShipmentName}
              placeholder={defaultName}
              placeholderTextColor="#9bb4c7"
              style={inputStyle}
            />
          </View>

          {/* 2. Cargo Category */}
          <View>
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
              Cargo Type
            </Text>
            <CargoCategoryPicker
              categories={PRODUCT_CATEGORIES}
              selectedId={productId}
              onSelect={(id) => {
                setProductId(id);
                setShipmentName("");
              }}
            />
          </View>

          {/* 3. Storage Profile */}
          <View>
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
              Storage Profile
            </Text>
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
              Cargo Details
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text
                  style={{
                    fontSize: labelSize,
                    color: "#587a94",
                    marginBottom: 6,
                    fontWeight: "500",
                  }}
                >
                  Weight (kg)
                </Text>
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
                <Text
                  style={{
                    fontSize: labelSize,
                    color: "#587a94",
                    marginBottom: 6,
                    fontWeight: "500",
                  }}
                >
                  Duration (hrs)
                </Text>
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

          {/* 5. Container */}
          <View>
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
              Container
            </Text>
            <ContainerSelector
              containers={CONTAINER_TYPES}
              selected={container}
              onSelect={setContainer}
            />
          </View>

          {/* 6. Route */}
          <View>
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
              Route
            </Text>
            <View style={{ gap: 12 }}>
              <View>
                <Text
                  style={{
                    fontSize: labelSize,
                    color: "#587a94",
                    marginBottom: 6,
                    fontWeight: "500",
                  }}
                >
                  Origin
                </Text>
                <TextInput
                  value={originLocation}
                  onChangeText={setOriginLocation}
                  placeholder="City or location"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle}
                />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: labelSize,
                    color: "#587a94",
                    marginBottom: 6,
                    fontWeight: "500",
                  }}
                >
                  Destination
                </Text>
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
              Notes
            </Text>
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
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => handleCreate(true)}
              activeOpacity={0.85}
              disabled={!canSubmit}
              style={{
                backgroundColor: canSubmit ? "#0b2540" : "#cbd5e1",
                borderRadius: 12,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "600",
                  color: "#fff",
                }}
              >
                Create & Start Trip
              </Text>
              <ArrowRight size={16} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleCreate(false)}
              activeOpacity={0.85}
              disabled={!canSubmit}
              style={{
                backgroundColor: canSubmit ? "#fff" : "#f4f8fa",
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
              <Text
                style={{
                  fontSize: labelSize,
                  fontWeight: "600",
                  color: canSubmit ? "#0b2540" : "#9bb4c7",
                }}
              >
                Save as Planned
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
