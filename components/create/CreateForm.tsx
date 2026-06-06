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
  ICE_TYPES,
  calculateIce,
  calculateIceDistribution,
  calculateIceForType,
  getProfileFor,
  type IceTypeKey,
} from "@/lib/icepack/data";
import { createShipment, createTrip } from "@/lib/icepack/services";

import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { useScreenDimensions } from "@/hooks/use-screen-dimensions";
import { LocationAutocomplete } from "@/components/ui/LocationAutocomplete";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react-native";

const STEPS = [
  { num: 1, label: "Product Details" },
  { num: 2, label: "Route & Schedule" },
  { num: 3, label: "Quantity & Temp" },
];

type StepErrors = Record<string, boolean>;

const STEP1_REQUIRED = ["shipmentName"];
const STEP2_REQUIRED = ["originLocation", "destinationLocation"];
const STEP3_REQUIRED = ["cargoKg", "durationHours"];

export function CreateForm() {
  const { isTablet } = useScreenDimensions();
  const labelSize = useResponsiveFontSize("sm");
  const inputSize = useResponsiveFontSize("base");

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<StepErrors>({});

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
  const [selectedIceTypeKey, setSelectedIceTypeKey] = useState<IceTypeKey | null>(null);

  const profile = getProfileFor(productId);
  const displayName = shipmentName || "None";

  const calc = useMemo(
    () => calculateIce(Number(cargoKg) || 0, Number(durationHours) || 0, profile),
    [cargoKg, durationHours, profile],
  );

  const finalIceCalc = useMemo(() => {
    if (selectedIceTypeKey) {
      const iceType = ICE_TYPES[selectedIceTypeKey];
      const { amountKg, meltRateKgPerHr, safeDurationHours } = calculateIceForType(
        Number(cargoKg) || 0, Number(durationHours) || 0, Number(unitsPallets) || 0, iceType, profile,
      );
      return { recommendedIceKg: amountKg, meltRateKgPerHr, safeDurationHours };
    }
    return calc;
  }, [selectedIceTypeKey, cargoKg, durationHours, unitsPallets, profile, calc]);

  const iceDistribution = useMemo(
    () => calculateIceDistribution(Number(cargoKg) || 0, Number(durationHours) || 0, Number(unitsPallets) || 0, productId, profile),
    [cargoKg, durationHours, unitsPallets, productId, profile],
  );

  const canSubmit = Number(cargoKg) > 0 && Number(durationHours) > 0;
  const [isCreating, setIsCreating] = useState(false);

  const fieldValues: Record<string, string> = {
    shipmentName,
    originLocation,
    destinationLocation,
    cargoKg,
    durationHours,
  };

  const validateStep = (stepNum: number): boolean => {
    const required =
      stepNum === 1 ? STEP1_REQUIRED :
      stepNum === 2 ? STEP2_REQUIRED :
      STEP3_REQUIRED;

    const newErrors: StepErrors = {};
    let valid = true;
    for (const key of required) {
      if (!fieldValues[key].trim()) {
        newErrors[key] = true;
        valid = false;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const clearFieldError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

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
        recommended_ice_kg: finalIceCalc.recommendedIceKg,
        ice_remaining_kg: finalIceCalc.recommendedIceKg,
        melt_rate_kg_per_hr: finalIceCalc.meltRateKgPerHr,
        safe_duration_hours: finalIceCalc.safeDurationHours,
        ice_type: selectedIceTypeKey || null,
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
      setErrors({});
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
      setSelectedIceTypeKey(null);
      setIsCreating(false);

      router.replace("/(tabs)/shipments");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to create shipment";
      console.error("handleCreate:", msg, e);
      Alert.alert("Error", msg);
      setIsCreating(false);
    }
  };

  const inputStyle = (fieldKey?: string) => ({
    fontSize: inputSize,
    backgroundColor: "#f4f8fa",
    borderWidth: fieldKey && errors[fieldKey] ? 2 : 1,
    borderColor: fieldKey && errors[fieldKey] ? "#ef4444" : "#e8eef3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: isTablet ? 14 : 12,
    color: "#0b2540",
  });

  const requiredLabel = (title: string) => (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
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
      <Text style={{ color: "#ef4444", marginLeft: 2, marginBottom: 10, fontWeight: "700" }}> *</Text>
    </View>
  );

  const optionalLabel = (title: string) => (
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

  const errorText = (fieldKey: string) =>
    errors[fieldKey] ? (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
        <AlertCircle size={12} color="#ef4444" strokeWidth={2} />
        <Text style={{ fontSize: 11, color: "#ef4444", fontWeight: "500" }}>
          Required
        </Text>
      </View>
    ) : null;

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
            {requiredLabel("Shipment Name")}
            <TextInput
              value={shipmentName}
              onChangeText={(v) => { setShipmentName(v); clearFieldError("shipmentName"); }}
              placeholder="Enter shipment name"
              placeholderTextColor={errors.shipmentName ? "#fca5a5" : "#9bb4c7"}
              style={inputStyle("shipmentName")}
            />
            {errorText("shipmentName")}
          </View>

          <View>
            {optionalLabel("Cargo Type")}
            <CargoCategoryPicker
              categories={PRODUCT_CATEGORIES}
              selectedId={productId}
              onSelect={(id) => setProductId(id)}
            />
          </View>

          <View>
            {optionalLabel("Storage Profile")}
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
        </View>
      )}

      {/* Step 2: Route & Schedule */}
      {step === 2 && (
        <View style={{ gap: 20 }}>
          <View>
            {requiredLabel("Route")}
            <View style={{ gap: 12 }}>
              <View>
                {fieldLabel("Origin")}
                <LocationAutocomplete
                  value={originLocation}
                  onValueChange={(v) => { setOriginLocation(v); clearFieldError("originLocation"); }}
                  onLocationSelect={() => {}}
                  placeholder={errors.originLocation ? "Required — city or location" : "City or location"}
                />
                {errorText("originLocation")}
              </View>
              <View>
                {fieldLabel("Destination")}
                <LocationAutocomplete
                  value={destinationLocation}
                  onValueChange={(v) => { setDestinationLocation(v); clearFieldError("destinationLocation"); }}
                  onLocationSelect={() => {}}
                  placeholder={errors.destinationLocation ? "Required — city or location" : "City or location"}
                />
                {errorText("destinationLocation")}
              </View>
            </View>
          </View>

          <View>
            {optionalLabel("Schedule")}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.75}
                style={[inputStyle(), { flex: 1, justifyContent: "center" }]}
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
            {optionalLabel("Customs & Supplier")}
            <View style={{ gap: 12 }}>
              <View>
                {fieldLabel("HS Code / Classification")}
                <TextInput
                  value={hsCode}
                  onChangeText={setHsCode}
                  placeholder="e.g. 0201.10"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle()}
                />
              </View>
              <View>
                {fieldLabel("Supplier / Producer Name")}
                <TextInput
                  value={supplierName}
                  onChangeText={setSupplierName}
                  placeholder="Supplier name"
                  placeholderTextColor="#9bb4c7"
                  style={inputStyle()}
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
            {requiredLabel("Cargo Details")}
            <View className="flex-row gap-3">
              <View className="flex-1">
                {fieldLabel("Weight (kg)")}
                <TextInput
                  value={cargoKg}
                  onChangeText={(v) => { setCargoKg(v); clearFieldError("cargoKg"); }}
                  keyboardType="decimal-pad"
                  placeholder={errors.cargoKg ? "Required" : "0"}
                  placeholderTextColor={errors.cargoKg ? "#fca5a5" : "#9bb4c7"}
                  style={inputStyle("cargoKg")}
                />
                {errorText("cargoKg")}
              </View>
              <View className="flex-1">
                {fieldLabel("Duration (hrs)")}
                <TextInput
                  value={durationHours}
                  onChangeText={(v) => { setDurationHours(v); clearFieldError("durationHours"); }}
                  keyboardType="decimal-pad"
                  placeholder={errors.durationHours ? "Required" : "0"}
                  placeholderTextColor={errors.durationHours ? "#fca5a5" : "#9bb4c7"}
                  style={inputStyle("durationHours")}
                />
                {errorText("durationHours")}
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
              style={inputStyle()}
            />
          </View>

          <View>
            {optionalLabel("Storage Profile")}
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

          {selectedIceTypeKey == null && Number(cargoKg) > 0 && Number(durationHours) > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#fef3c7",
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: "#fcd34d",
              }}
            >
              <AlertCircle size={16} color="#d97706" strokeWidth={2} />
              <Text style={{ fontSize: labelSize, color: "#92400e", fontWeight: "500", flex: 1 }}>
                Select an ice type below to calculate the exact amount needed for your shipment.
              </Text>
            </View>
          )}

          <CalculationResult
            recommendedIceKg={calc.recommendedIceKg}
            meltRateKgPerHr={calc.meltRateKgPerHr}
            safeDurationHours={calc.safeDurationHours}
            iceDistribution={iceDistribution}
            selectedIceTypeKey={selectedIceTypeKey}
            onSelectIceType={setSelectedIceTypeKey}
          />

          <View>
            {optionalLabel("Notes")}
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              placeholderTextColor="#9bb4c7"
              multiline
              numberOfLines={3}
              style={[inputStyle(), { minHeight: 80, textAlignVertical: "top" }]}
            />
          </View>
        </View>
      )}

      {/* Navigation */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        {step > 1 && (
          <TouchableOpacity
            onPress={handleBack}
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
            onPress={handleNext}
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
