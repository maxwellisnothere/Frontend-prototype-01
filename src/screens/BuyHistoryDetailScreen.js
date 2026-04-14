import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

// แปลง wear string → color
const WEAR_COLOR_MAP = {
  "Factory New": "#4ade80",
  "Minimal Wear": "#a3e635",
  "Field-Tested": "#facc15",
  "Well-Worn": "#fb923c",
  "Battle-Scarred": "#f87171",
};

export default function BuyHistoryDetailScreen({ route, navigation }) {
  const { item } = route.params || {};

  if (!item) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={{ color: "#fff", padding: 20 }}>ไม่พบข้อมูล</Text>
      </SafeAreaView>
    );
  }

  const price =
    typeof item.price === "number"
      ? item.price
      : parseInt(item.price) || 0;

  const serviceFee =
    typeof item.serviceFee === "number"
      ? item.serviceFee
      : parseInt(item.serviceFee) || 0;

  const wearColor =
    item.wearColor || WEAR_COLOR_MAP[item.wear] || "#888";

  const total =
    typeof item.total === "number"
      ? item.total
      : price + serviceFee;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Order Detail</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>

        {/* Image */}
        <View style={s.imageCard}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={s.itemImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ fontSize: 48 }}>🔫</Text>
          )}

          {item.rarityColor && (
            <View
              style={[s.rarityBar, { backgroundColor: item.rarityColor }]}
            />
          )}
        </View>

        {/* Name */}
        <View style={s.nameBlock}>
          {item.weapon ? (
            <>
              <Text style={s.weaponLabel}>{item.weapon}</Text>
              <Text style={s.skinLabel}>{item.skin}</Text>
            </>
          ) : (
            <Text style={s.skinLabel}>
              {item.name || "Unknown Item"}
            </Text>
          )}

          {/* Rarity */}
          {item.rarity && (
            <View
              style={[
                s.rarityBadge,
                { borderColor: item.rarityColor || "#888" },
              ]}
            >
              <View
                style={[
                  s.rarityDot,
                  { backgroundColor: item.rarityColor || "#888" },
                ]}
              />
              <Text
                style={[
                  s.rarityText,
                  { color: item.rarityColor || "#888" },
                ]}
              >
                {item.rarity}
              </Text>
            </View>
          )}

          {/* StatTrak */}
          {item.stattrak && (
            <View style={s.stattrakBadge}>
              <Text style={s.stattrakText}>★ StatTrak™</Text>
            </View>
          )}

          {/* Wear */}
          {item.wear && (
            <View
              style={[
                s.wearBadge,
                { borderColor: wearColor },
              ]}
            >
              <View
                style={[
                  s.wearDot,
                  { backgroundColor: wearColor },
                ]}
              />
              <Text style={[s.wearText, { color: wearColor }]}>
                {item.wear}
              </Text>
            </View>
          )}
        </View>

        {/* ✅ FLOAT BAR (FIXED) */}
        <View style={s.floatSection}>
          <FloatBar float={item.float} />
        </View>

        <View style={s.divider} />

        {/* ORDER */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ORDER DETAILS</Text>
          <Row label="Date" value={item.date || "-"} />
          <Row label="Payment Method" value={item.paymentMethod || "-"} />
          <Row
            label="StatTrak™"
            value={item.stattrak ? "Yes" : "No"}
            valueStyle={item.stattrak ? s.stattrakRowValue : undefined}
          />
        </View>

        <View style={s.divider} />

        {/* PRICE */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>PRICE DETAILS</Text>
          <Row label="Item Price" value={`฿${price.toLocaleString()}`} />
          <Row label="Service Fee" value={`฿${serviceFee.toLocaleString()}`} />

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Paid</Text>
            <Text style={s.totalValue}>
              ฿{total.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* STATUS */}
        <View style={s.statusWrap}>
          <View style={s.statusBadge}>
            <Text style={s.statusText}>✅ ชำระเงินสำเร็จ</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

//
// 🔥 FLOAT BAR (ตัวจริง)
//
const FloatBar = ({ float }) => {
  if (float === undefined || float === null) return null;

  const f = Math.max(0, Math.min(parseFloat(float) || 0, 1));
  const pct = f * 100;

  const getColor = (p) => {
    if (p <= 7) return "#4CAF50";
    if (p <= 15) return "#8BC34A";
    if (p <= 38) return "#FFC107";
    if (p <= 45) return "#FF9800";
    return "#F44336";
  };

  return (
    <View>
      <View style={fb.bar}>
        <View style={[fb.zone, { width: "7%", backgroundColor: "#4CAF50" }]} />
        <View style={[fb.zone, { width: "8%", backgroundColor: "#8BC34A" }]} />
        <View style={[fb.zone, { width: "23%", backgroundColor: "#FFC107" }]} />
        <View style={[fb.zone, { width: "7%", backgroundColor: "#FF9800" }]} />
        <View style={[fb.zone, { width: "55%", backgroundColor: "#F44336" }]} />

        <View
          style={[
            fb.indicator,
            {
              left: `${pct}%`,
              transform: [{ translateX: -8 }],
              borderColor: getColor(pct),
            },
          ]}
        />
      </View>

      <View style={fb.labels}>
        <Text style={{ color: "#4CAF50", fontSize: 9 }}>FN</Text>
        <Text style={{ color: "#8BC34A", fontSize: 9 }}>MW</Text>
        <Text style={{ color: "#FFC107", fontSize: 9 }}>FT</Text>
        <Text style={{ color: "#FF9800", fontSize: 9 }}>WW</Text>
        <Text style={{ color: "#F44336", fontSize: 9 }}>BS</Text>
      </View>

      <Text style={{ color: "#aaa", fontSize: 10 }}>
        Float: {f.toFixed(4)}
      </Text>
    </View>
  );
};

const fb = StyleSheet.create({
  bar: {
    height: 8,
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
    marginBottom: 4,
  },
  zone: { height: 8 },
  indicator: {
    position: "absolute",
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#000",
    borderWidth: 2,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

//
// Helper
//
function Row({ label, value, valueStyle }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

//
// Styles
//
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 32 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.surface,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  back: { color: colors.textPrimary, fontSize: 28 },

  imageCard: {
    backgroundColor: "#111",
    margin: 16,
    borderRadius: 16,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
  },

  itemImage: { width: "80%", height: 120 },

  rarityBar: {
    position: "absolute",
    bottom: 0,
    height: 4,
    left: 0,
    right: 0,
  },

  nameBlock: { alignItems: "center" },
  weaponLabel: { color: "#888" },
  skinLabel: { color: "#fff", fontSize: 20, fontWeight: "800" },

  floatSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 12,
  },

  divider: {
    borderTopWidth: 1,
    borderColor: "#222",
    margin: 16,
  },

  section: { paddingHorizontal: 16 },
  sectionTitle: { color: "#666", marginBottom: 10 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  rowLabel: { color: "#aaa" },
  rowValue: { color: "#fff" },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  totalLabel: { color: "#fff", fontWeight: "800" },
  totalValue: { color: colors.primary, fontWeight: "900" },

  statusWrap: { alignItems: "center", marginTop: 20 },
  statusBadge: {
    padding: 10,
    borderRadius: 20,
    borderColor: "#2ecc71",
    borderWidth: 1,
  },
  statusText: { color: "#2ecc71" },
});