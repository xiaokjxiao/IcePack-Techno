import { useState } from "react";
import { Text, TextInput, TextStyle, TouchableOpacity, View } from "react-native";
import { Check, Pencil, X } from "lucide-react-native";
import { useResponsiveFontSize } from "@/hooks/use-responsive-size";

type FontWeight = TextStyle["fontWeight"];

interface EditableFieldProps {
  value: string;
  onSave: (newValue: string) => Promise<void>;
  fontSize?: number;
  fontWeight?: FontWeight;
  color?: string;
}

export function EditableField({
  value,
  onSave,
  fontSize,
  fontWeight = "700",
  color = "white",
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const baseSize = useResponsiveFontSize("base");

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setEditing(false);
      setDraft(value);
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch {
      setDraft(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const fs = fontSize ?? baseSize;

  if (editing) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoFocus
          selectTextOnFocus
          editable={!saving}
          style={{
            flex: 1,
            fontSize: fs,
            fontWeight,
            color,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.4)",
            paddingVertical: 2,
          }}
        />
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.7}>
          <Check size={18} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCancel} disabled={saving} activeOpacity={0.7}>
          <X size={18} color="rgba(255,255,255,0.6)" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={() => {
        setDraft(value);
        setEditing(true);
      }}
      activeOpacity={0.7}
      style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
    >
      <Text
        style={{ fontSize: fs, fontWeight, color }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Pencil size={14} color="rgba(255,255,255,0.5)" strokeWidth={2} />
    </TouchableOpacity>
  );
}
