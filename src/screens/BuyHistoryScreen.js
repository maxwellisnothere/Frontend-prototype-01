import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { useHistory } from "../context/HistoryContext";

export default function BuyHistoryScreen({ navigation }) {
  const { history } = useHistory();

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>‹</Text>
        </TouchableOpacity>
        <Text style={s.title}>Buy History</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* List */}
      <FlatList
        data={history || []}
        keyExtractor={(item, index) =>
          item?.id ? item.id.toString() : index.toString()
        }
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => {
          const name  = item?.name  || "Unknown Item";
          const price = typeof item?.price === "number" ? item.price : parseInt(item?.price) || 0;
          const date  = item?.date  || "-";

          return (
            // ✅ กดแล้วไปหน้า Detail พร้อมส่ง item ทั้งหมด
            <TouchableOpacity
              style={s.card}
              onPress={() => navigation.navigate("BuyHistoryDetail", { item })}
              activeOpacity={0.75}
            >
              <View style={s.cardLeft}>
                {/* รูป item (ถ้ามี) */}
                {item?.image ? (
                  <View style={s.imgWrap}>
                    <Image
                      source={{ uri: item.image }}
                      style={s.img}
                      resizeMode="contain"
                    />
                    {item?.rarityColor && (
                      <View style={[s.rarityBar, { backgroundColor: item.rarityColor }]} />
                    )}
                  </View>
                ) : (
                  <View style={[s.imgWrap, s.imgPlaceholder]}>
                    <Text style={{ fontSize: 22 }}>🔫</Text>
                  </View>
                )}

                {/* ชื่อ + วันที่ */}
                <View style={s.info}>
                  {item?.weapon ? (
                    <>
                      <Text style={s.weapon}>{item.weapon}</Text>
                      <Text style={s.skin} numberOfLines={1}>{item.skin}</Text>
                    </>
                  ) : (
                    <Text style={s.itemName}>{name}</Text>
                  )}
                  <Text style={s.date}>{date}</Text>
                </View>
              </View>

              {/* ราคา + ลูกศร */}
              <View style={s.cardRight}>
                <Text style={s.price}>฿{price.toLocaleString()}</Text>
                <Text style={s.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={s.empty}>ยังไม่มีประวัติการซื้อ</Text>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.surface,
  },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  back:  { color: colors.textPrimary, fontSize: 28 },

  // Card
  card: {
    backgroundColor: colors.cardBg,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLeft:  { flexDirection: "row", alignItems: "center", flex: 1 },
  cardRight: { alignItems: "flex-end", gap: 4 },

  // Image
  imgWrap: {
    width: 64,
    height: 40,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  imgPlaceholder: { backgroundColor: "#222" },
  img: { width: 64, height: 36 },
  rarityBar: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },

  // Text
  info:     { flex: 1 },
  weapon:   { color: colors.textMuted, fontSize: 10 },
  skin:     { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  itemName: { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  date:     { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  price:    { color: colors.primary, fontWeight: "700" },
  arrow:    { color: colors.textMuted, fontSize: 20 },

  empty: {
    textAlign: "center",
    marginTop: 50,
    color: colors.textMuted,
  },
});