import { useRef, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { searchPhoton, formatPhotonName, type PhotonFeature } from "@/lib/photon";
import { useResponsiveFontSize } from "@/hooks/use-responsive-size";
import { MapPin } from "lucide-react-native";

interface LocationAutocompleteProps {
  value: string;
  onValueChange: (text: string) => void;
  onLocationSelect: (feature: PhotonFeature) => void;
  placeholder?: string;
  inputStyle?: Record<string, unknown>;
}

export function LocationAutocomplete({
  value,
  onValueChange,
  onLocationSelect,
  placeholder,
  inputStyle,
}: LocationAutocompleteProps) {
  const labelSize = useResponsiveFontSize("sm");
  const inputSize = useResponsiveFontSize("base");
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (text: string) => {
    onValueChange(text);

    if (timer.current) clearTimeout(timer.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    timer.current = setTimeout(async () => {
      try {
        const results = await searchPhoton(text);
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);
  };

  const handleSelect = (feature: PhotonFeature) => {
    const displayName = formatPhotonName(feature);
    onValueChange(displayName);
    onLocationSelect(feature);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <View style={{ position: "relative", zIndex: showDropdown ? 1000 : 0 }}>
      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder ?? "City or location"}
        placeholderTextColor="#9bb4c7"
        style={[
          {
            fontSize: inputSize,
            backgroundColor: "#f4f8fa",
            borderWidth: 1,
            borderColor: "#e8eef3",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 12,
            color: "#0b2540",
          },
          inputStyle,
        ]}
      />
      {showDropdown && suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: "white",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#e8eef3",
            shadowColor: "#0b2540",
            shadowOpacity: 0.1,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
            maxHeight: 240,
            zIndex: 100,
          }}
        >
          <View>
            {suggestions.map((item, i) => {
              const p = item.properties;
              const subtitle = [p.city, p.state, p.country]
                .filter(Boolean)
                .join(", ");
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.65}
                  onPress={() => handleSelect(item)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: i < suggestions.length - 1 ? 1 : 0,
                    borderBottomColor: "#f4f8fa",
                  }}
                >
                  <MapPin size={16} color="#587a94" strokeWidth={1.5} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: labelSize,
                        fontWeight: "600",
                        color: "#0b2540",
                      }}
                      numberOfLines={1}
                    >
                      {p.name ?? p.street ?? ""}
                    </Text>
                    {subtitle ? (
                      <Text
                        style={{
                          fontSize: labelSize * 0.85,
                          color: "#94a3b8",
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {subtitle}
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
