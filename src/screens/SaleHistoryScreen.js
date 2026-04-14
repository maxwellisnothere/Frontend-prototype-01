import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { fetchSellOrders } from "../data/api";

export default function SaleHistoryScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // โหลดใหม่ทุกครั้งที่เข้ามาหน้านี้
    const unsubscribe = navigation.addListener('focus', () => loadOrders());
    return unsubscribe;
  }, [navigation]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchSellOrders();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.log("Error loading sell orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    if (status === 'pending') return { text: '🚨 ต้องจัดส่งไอเทม!', color: '#e74c3c' };
    if (status === 'verifying') return { text: '🔍 รอแอดมินตรวจสอบ', color: '#3498db' };
    if (status === 'completed') return { text: '✅ ขายสำเร็จ (รับเงินแล้ว)', color: '#2ecc71' };
    return { text: status, color: '#888' };
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Sale History</Text>
        <TouchableOpacity onPress={loadOrders}><Text style={{ fontSize: 18 }}>🔄</Text></TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const i = item.item;
            const statusInfo = getStatusText(item.status);

            return (
              <TouchableOpacity
                style={[s.card, item.status === 'pending' && { borderColor: '#e74c3c', borderWidth: 1 }]}
                // ✅ ส่งไปหน้า Detail เดียวกัน แต่บอกว่าเราคือ "ผู้ขาย" (isSeller: true)
                onPress={() => navigation.navigate("BuyHistoryDetail", { order: item, isSeller: true })}
              >
                <View style={s.cardLeft}>
                  {i?.image ? (
                    <View style={s.imgWrap}>
                      <Image source={{ uri: i.image }} style={s.img} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={[s.imgWrap, s.imgPlaceholder]}><Text style={{ fontSize: 22 }}>🔫</Text></View>
                  )}
                  <View style={s.info}>
                    <Text style={s.weapon}>{i.weapon}</Text>
                    <Text style={s.skin} numberOfLines={1}>{i.skin}</Text>
                    <Text style={[s.date, { color: statusInfo.color, fontWeight: 'bold' }]}>
                      {statusInfo.text}
                    </Text>
                  </View>
                </View>
                <View style={s.cardRight}>
                  {/* โชว์ยอดที่คนขายจะได้รับจริงๆ (หัก 5%) */}
                  <Text style={s.price}>+ ฿{(item.sellerReceive || 0).toLocaleString()}</Text>
                  <Text style={s.arrow}>›</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={s.empty}>ยังไม่มีไอเทมที่ขายออก</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 16, backgroundColor: colors.surface },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  back:  { color: colors.textPrimary, fontSize: 28 },
  card: { backgroundColor: colors.cardBg, padding: 12, borderRadius: 12, marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft:  { flexDirection: "row", alignItems: "center", flex: 1 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  imgWrap: { width: 64, height: 40, borderRadius: 8, overflow: "hidden", backgroundColor: "#1a1a1a", marginRight: 12, justifyContent: "center", alignItems: "center" },
  imgPlaceholder: { backgroundColor: "#222" },
  img: { width: 64, height: 36 },
  info:     { flex: 1 },
  weapon:   { color: colors.textMuted, fontSize: 10 },
  skin:     { color: colors.textPrimary, fontSize: 13, fontWeight: "600" },
  date:     { fontSize: 11, marginTop: 4 },
  price:    { color: '#2ecc71', fontWeight: "700" },
  arrow:    { color: colors.textMuted, fontSize: 20 },
  empty: { textAlign: "center", marginTop: 50, color: colors.textMuted },
});