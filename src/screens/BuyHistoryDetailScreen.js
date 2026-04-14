import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { confirmTradeOffer } from "../data/api";

const WEAR_COLOR_MAP = {
  "Factory New": "#4ade80", "Minimal Wear": "#a3e635", "Field-Tested": "#facc15",
  "Well-Worn": "#fb923c", "Battle-Scarred": "#f87171",
};

export default function BuyHistoryDetailScreen({ route, navigation }) {
  // ✅ รับ order และ isSeller จากหน้าที่แล้วมา
  const { order, isSeller } = route.params || {};
  const item = order?.item;
  
  const [tradeIdInput, setTradeIdInput] = useState("");
  const [loading, setLoading] = useState(false);

  if (!order || !item) {
    return (
      <SafeAreaView style={s.safe}>
        <Text style={{ color: "#fff", padding: 20 }}>ไม่พบข้อมูลออเดอร์</Text>
      </SafeAreaView>
    );
  }

  const price = order.price || 0;
  const serviceFee = order.fee || 0;
  const wearColor = item.wearColor || WEAR_COLOR_MAP[item.wear] || "#888";
  
  // คนขายจะได้เงินหักค่าธรรมเนียม ส่วนคนซื้อต้องดูยอดรวม
  const displayTotal = isSeller ? order.sellerReceive : (price + serviceFee);

  const handleConfirmShipment = async () => {
    if (!tradeIdInput) return Alert.alert("Error", "กรุณากรอก Trade Offer ID");
    setLoading(true);
    try {
      const res = await confirmTradeOffer(order.orderId, tradeIdInput);
      if (res.success) {
        Alert.alert("สำเร็จ", "ส่งข้อมูลการจัดส่งแล้ว รอแอดมินตรวจสอบครับ", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      Alert.alert("เกิดข้อผิดพลาด", err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = () => {
    if (order.status === 'completed') return <View style={[s.statusBadge, { borderColor: '#2ecc71' }]}><Text style={{ color: '#2ecc71' }}>✅ ทำรายการสำเร็จ (โอนเงินแล้ว)</Text></View>;
    if (order.status === 'verifying') return <View style={[s.statusBadge, { borderColor: '#3498db' }]}><Text style={{ color: '#3498db' }}>🔍 กำลังตรวจสอบ Trade Offer โดยระบบ</Text></View>;
    
    // สถานะ pending
    if (isSeller) {
      return (
        <View style={s.sellerActionBox}>
          <Text style={s.sellerAlert}>⚠️ กรุณาส่งไอเทมให้ผู้ซื้อผ่าน Steam</Text>
          <Text style={{ color: '#ccc', fontSize: 12, marginBottom: 10 }}>เมื่อส่งเสร็จแล้ว ให้นำ Trade Offer ID มากรอกที่นี่</Text>
          <TextInput
            style={s.input}
            placeholder="Trade Offer ID เช่น 391283..."
            placeholderTextColor="#666"
            value={tradeIdInput}
            onChangeText={setTradeIdInput}
            keyboardType="numeric"
          />
          <TouchableOpacity style={s.confirmBtn} onPress={handleConfirmShipment} disabled={loading}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={s.confirmBtnText}>ยืนยันการจัดส่ง</Text>}
          </TouchableOpacity>
        </View>
      );
    } else {
      return <View style={[s.statusBadge, { borderColor: '#f1c40f' }]}><Text style={{ color: '#f1c40f' }}>⏳ รอผู้ขายจัดส่งไอเทมให้คุณ</Text></View>;
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>‹</Text></TouchableOpacity>
        <Text style={s.title}>Order Detail</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.imageCard}>
          {item.image ? <Image source={{ uri: item.image }} style={s.itemImage} resizeMode="contain" /> : <Text style={{ fontSize: 48 }}>🔫</Text>}
          {item.rarityColor && <View style={[s.rarityBar, { backgroundColor: item.rarityColor }]} />}
        </View>

        <View style={s.nameBlock}>
          <Text style={s.weaponLabel}>{item.weapon}</Text>
          <Text style={s.skinLabel}>{item.skin}</Text>
          {item.rarity && (
            <View style={[s.rarityBadge, { borderColor: item.rarityColor || "#888" }]}>
              <View style={[s.rarityDot, { backgroundColor: item.rarityColor || "#888" }]} />
              <Text style={[s.rarityText, { color: item.rarityColor || "#888" }]}>{item.rarity}</Text>
            </View>
          )}
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={s.sectionTitle}>ORDER INFO</Text>
          <Row label="Order ID" value={order.orderId} />
          <Row label="Buyer" value={order.buyerName} />
          <Row label="Seller" value={order.sellerName} />
        </View>

        <View style={s.divider} />

        <View style={s.section}>
          <Text style={s.sectionTitle}>FINANCIALS</Text>
          <Row label="Item Price" value={`฿${price.toLocaleString()}`} />
          {isSeller ? (
             <Row label="Market Fee (5%)" value={`- ฿${serviceFee.toLocaleString()}`} valueStyle={{ color: '#e74c3c' }} />
          ) : (
             <Row label="Service Fee" value={`฿${serviceFee.toLocaleString()}`} />
          )}
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>{isSeller ? "You Will Receive" : "Total Paid"}</Text>
            <Text style={s.totalValue}>฿{displayTotal.toLocaleString()}</Text>
          </View>
        </View>

        <View style={s.statusWrap}>
          {renderStatus()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, valueStyle }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", padding: 16, backgroundColor: colors.surface },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  back: { color: colors.textPrimary, fontSize: 28 },
  imageCard: { backgroundColor: "#111", margin: 16, borderRadius: 16, height: 180, justifyContent: "center", alignItems: "center", position: 'relative', overflow: 'hidden' },
  itemImage: { width: "80%", height: 120 },
  rarityBar: { position: "absolute", bottom: 0, height: 4, left: 0, right: 0 },
  nameBlock: { alignItems: "center" },
  weaponLabel: { color: "#888" },
  skinLabel: { color: "#fff", fontSize: 20, fontWeight: "800" },
  rarityBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginTop: 6, gap: 4 },
  rarityDot: { width: 6, height: 6, borderRadius: 3 },
  rarityText: { fontSize: 10, fontWeight: 'bold' },
  divider: { borderTopWidth: 1, borderColor: "#222", margin: 16 },
  section: { paddingHorizontal: 16 },
  sectionTitle: { color: "#666", marginBottom: 10, fontSize: 12, fontWeight: 'bold' },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  rowLabel: { color: "#aaa", fontSize: 13 },
  rowValue: { color: "#fff", fontSize: 13 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  totalLabel: { color: "#fff", fontWeight: "800", fontSize: 15 },
  totalValue: { color: colors.primary, fontWeight: "900", fontSize: 18 },
  statusWrap: { alignItems: "center", marginTop: 30, paddingHorizontal: 16 },
  statusBadge: { padding: 12, borderRadius: 8, borderWidth: 1, width: '100%', alignItems: 'center', backgroundColor: '#111' },
  sellerActionBox: { backgroundColor: '#1a1a1a', padding: 16, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#333' },
  sellerAlert: { color: '#f1c40f', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  input: { backgroundColor: '#000', color: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#444', marginBottom: 12 },
  confirmBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: 'bold' },
});