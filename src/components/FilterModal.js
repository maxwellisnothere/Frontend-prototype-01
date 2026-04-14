import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { colors } from "../theme/colors";

// ─── Filter Options ────────────────────────────────────────────
export const RARITY_OPTIONS = [
  { label: "Consumer",     value: "Consumer Grade",    color: "#B0C3D9" },
  { label: "Industrial",   value: "Industrial Grade",  color: "#5E98D9" },
  { label: "Mil-Spec",     value: "Mil-Spec Grade",    color: "#4B69FF" },
  { label: "Restricted",   value: "Restricted",        color: "#8847FF" },
  { label: "Classified",   value: "Classified",        color: "#D32CE6" },
  { label: "Covert",       value: "Covert",            color: "#EB4B4B" },
  { label: "Extraordinary",value: "Extraordinary",     color: "#E4AE33" },
  { label: "Base Grade",   value: "Base Grade",        color: "#B0C3D9" },
];

export const WEAR_OPTIONS = [
  { label: "Factory New",    value: "Factory New",    color: "#4ade80" },
  { label: "Minimal Wear",   value: "Minimal Wear",   color: "#a3e635" },
  { label: "Field-Tested",   value: "Field-Tested",   color: "#facc15" },
  { label: "Well-Worn",      value: "Well-Worn",      color: "#fb923c" },
  { label: "Battle-Scarred", value: "Battle-Scarred", color: "#f87171" },
];

export const WEAPON_TYPE_OPTIONS = [
  { label: "All",           value: "" },
  { label: "Rifles",        value: "Rifles" },
  { label: "Pistols",       value: "Pistols" },
  { label: "Knives",        value: "Knives" },
  { label: "Gloves",        value: "Gloves" },
  { label: "SMGs",          value: "SMGs" },
  { label: "Heavy",         value: "Heavy" },
  { label: "Equipment",     value: "Equipment" },
];

export const SORT_OPTIONS = [
  { label: "ราคา: ต่ำ → สูง",  value: "price_asc"  },
  { label: "ราคา: สูง → ต่ำ",  value: "price_desc" },
  { label: "Float: ต่ำ → สูง", value: "float_asc"  },
  { label: "Float: สูง → ต่ำ", value: "float_desc" },
];

// default filter state — export ให้ StoreScreen ใช้ reset
export const DEFAULT_FILTERS = {
  rarities:    [],   // string[]
  wears:       [],   // string[]
  weaponType:  "",   // string
  priceMin:    "",   // string (input)
  priceMax:    "",   // string (input)
  sort:        "",   // string
};

// ─── Chip component ────────────────────────────────────────────
function Chip({ label, color, active, onPress }) {
  return (
    <TouchableOpacity
      style={[
        chip.base,
        active && { borderColor: color || colors.primary, backgroundColor: (color || colors.primary) + "22" },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {color && <View style={[chip.dot, { backgroundColor: color }]} />}
      <Text style={[chip.label, active && { color: color || colors.primary, fontWeight: "700" }]}>
        {label}
      </Text>
      {active && <Text style={[chip.check, { color: color || colors.primary }]}>✓</Text>}
    </TouchableOpacity>
  );
}

const chip = StyleSheet.create({
  base:  {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#111",
    marginRight: 8,
    marginBottom: 8,
  },
  dot:   { width: 8, height: 8, borderRadius: 4 },
  label: { color: "#aaa", fontSize: 12 },
  check: { fontSize: 10, fontWeight: "900" },
});

// ─── FilterModal ───────────────────────────────────────────────
export default function FilterModal({ visible, onClose, filters, onApply }) {
  // local draft — ไม่ apply จนกว่ากด "Apply"
  const [draft, setDraft] = useState(filters || DEFAULT_FILTERS);

  // sync draft เมื่อ modal เปิดใหม่
  React.useEffect(() => {
    if (visible) setDraft(filters || DEFAULT_FILTERS);
  }, [visible]);

  const toggleSet = (key, value) => {
    setDraft((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  };

  const activeCount =
    draft.rarities.length +
    draft.wears.length +
    (draft.weaponType ? 1 : 0) +
    (draft.priceMin ? 1 : 0) +
    (draft.priceMax ? 1 : 0) +
    (draft.sort ? 1 : 0);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>ตัวกรอง</Text>
            <TouchableOpacity
              onPress={() => setDraft(DEFAULT_FILTERS)}
              style={s.resetBtn}
            >
              <Text style={s.resetText}>รีเซ็ต{activeCount > 0 ? ` (${activeCount})` : ""}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

            {/* ── Sort ────────────────────────────── */}
            <Text style={s.sectionLabel}>เรียงลำดับ</Text>
            <View style={s.chipRow}>
              {SORT_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={draft.sort === o.value}
                  onPress={() => setDraft((p) => ({ ...p, sort: p.sort === o.value ? "" : o.value }))}
                />
              ))}
            </View>

            {/* ── Weapon Type ──────────────────────── */}
            <Text style={s.sectionLabel}>ประเภทอาวุธ</Text>
            <View style={s.chipRow}>
              {WEAPON_TYPE_OPTIONS.filter((o) => o.value !== "").map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  active={draft.weaponType === o.value}
                  onPress={() =>
                    setDraft((p) => ({ ...p, weaponType: p.weaponType === o.value ? "" : o.value }))
                  }
                />
              ))}
            </View>

            {/* ── Rarity ───────────────────────────── */}
            <Text style={s.sectionLabel}>Rarity</Text>
            <View style={s.chipRow}>
              {RARITY_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  color={o.color}
                  active={draft.rarities.includes(o.value)}
                  onPress={() => toggleSet("rarities", o.value)}
                />
              ))}
            </View>

            {/* ── Wear ─────────────────────────────── */}
            <Text style={s.sectionLabel}>Wear</Text>
            <View style={s.chipRow}>
              {WEAR_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  color={o.color}
                  active={draft.wears.includes(o.value)}
                  onPress={() => toggleSet("wears", o.value)}
                />
              ))}
            </View>

            {/* ── Price Range ───────────────────────── */}
            <Text style={s.sectionLabel}>ช่วงราคา (฿)</Text>
            <View style={s.priceRow}>
              <TextInput
                style={s.priceInput}
                placeholder="ต่ำสุด"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={draft.priceMin}
                onChangeText={(v) => setDraft((p) => ({ ...p, priceMin: v }))}
              />
              <Text style={s.priceSep}>—</Text>
              <TextInput
                style={s.priceInput}
                placeholder="สูงสุด"
                placeholderTextColor="#555"
                keyboardType="numeric"
                value={draft.priceMax}
                onChangeText={(v) => setDraft((p) => ({ ...p, priceMax: v }))}
              />
            </View>

            <View style={{ height: 24 }} />
          </ScrollView>

          {/* Footer buttons */}
          <View style={s.footer}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelText}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.applyBtn}
              onPress={() => { onApply(draft); onClose(); }}
            >
              <Text style={s.applyText}>แสดงผล</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0d0d0d",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#1a1a1a",
  },
  title:     { color: "#fff", fontSize: 17, fontWeight: "800" },
  resetBtn:  { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#333" },
  resetText: { color: "#888", fontSize: 12 },

  scroll: { paddingHorizontal: 16 },

  sectionLabel: {
    color: "#666",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 10,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap" },

  priceRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  priceInput: {
    flex: 1,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },
  priceSep: { color: "#555", fontSize: 16 },

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: "#1a1a1a",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
  },
  cancelText: { color: "#888", fontWeight: "700" },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  applyText: { color: "#000", fontWeight: "900", fontSize: 15 },
});