import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { formatPrice } from '../data/items';
import { storeItems } from '../data/items';
import { useBalance } from "../context/BalanceContext";
import { useHistory } from "../context/HistoryContext";

const PAYMENT_METHODS = [
  { id: 'balance',   label: 'Account Balance', icon: '💼', sub: 'Pay with your wallet' },
  { id: 'promptpay', label: 'PromptPay',        icon: '📱', sub: 'QR Code payment' },
  { id: 'truemoney', label: 'TrueMoney',         icon: '💰', sub: 'TrueMoney Wallet' },
  { id: 'bank',      label: 'Bank Transfer',     icon: '🏦', sub: 'Direct bank transfer' },
  { id: 'card',      label: 'Credit/Debit',      icon: '💳', sub: 'Visa, Mastercard' },
];

export default function PaymentScreen({ route, navigation }) {
  const passedItems = route?.params?.items || [storeItems[0], storeItems[2]];
  const [selectedMethod, setSelectedMethod] = useState('balance');
  const [items] = useState(passedItems);

  const { balance, withdraw } = useBalance();
  const { addHistory } = useHistory();

  const subtotal    = items.reduce((sum, i) => sum + i.price, 0);
  const serviceFee  = Math.round(subtotal * 0.02);
  const total       = subtotal + serviceFee;

  // ✅ ส่งข้อมูลครบสำหรับหน้า Detail
  const createHistoryItems = () =>
    items.map(i => ({
      weapon:        i?.weapon || "",
      skin:          i?.skin   || "",
      name:          i?.weapon && i?.skin ? `${i.weapon} | ${i.skin}` : i?.name || "Unknown Item",
      price:         typeof i?.price === "number" ? i.price : parseInt(i?.price) || 0,
      serviceFee:    Math.round((typeof i?.price === "number" ? i.price : parseInt(i?.price) || 0) * 0.02),
      total:         (typeof i?.price === "number" ? i.price : parseInt(i?.price) || 0) +
                     Math.round((typeof i?.price === "number" ? i.price : parseInt(i?.price) || 0) * 0.02),
      image:         i?.image       || null,
      rarityColor:   i?.rarityColor || "#888",
      rarity:        i?.rarity      || "",
      float:         i?.float       ?? null,
      wear:          i?.wear        || "",
      wearColor:     i?.wearColor   || "#888",
      stattrak:      i?.stattrak    === true,
      paymentMethod: PAYMENT_METHODS.find(m => m.id === selectedMethod)?.label || selectedMethod,
    }));

  const handlePay = async () => {
    // 💼 Balance
    if (selectedMethod === 'balance') {
      if (balance < total) {
        return Alert.alert(
          'ยอดเงินไม่พอ',
          `คุณมี ฿${balance.toLocaleString()} แต่ต้องใช้ ฿${total.toLocaleString()}`
        );
      }
      await withdraw(total);
      addHistory(createHistoryItems());
      Alert.alert('✅ ชำระเงินสำเร็จ', 'หักเงินจาก Balance เรียบร้อย', [
        { text: 'OK', onPress: () => navigation.navigate('BuyHistory') },
      ]);
      return;
    }

    // 📱 PromptPay / TrueMoney
    if (selectedMethod === 'promptpay' || selectedMethod === 'truemoney') {
      addHistory(createHistoryItems());
      navigation.navigate('QRPayment', { amount: total });
      return;
    }

    // 🏦 Bank / 💳 Card
    addHistory(createHistoryItems());
    Alert.alert('Processing', 'Redirecting...', [
      { text: 'OK', onPress: () => navigation.navigate('BuyHistory') },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ORDER SUMMARY</Text>
          <View style={styles.itemsList}>
            {items.map((item, idx) => (
              <View key={item.id + idx} style={styles.orderItem}>
                <View style={styles.orderItemImage}>
                  <Image source={{ uri: item.image }} style={styles.orderImg} resizeMode="contain" />
                  <View style={[styles.orderRarityDot, { backgroundColor: item.rarityColor }]} />
                </View>
                <View style={styles.orderItemInfo}>
                  <Text style={styles.orderItemWeapon}>{item.weapon}</Text>
                  <Text style={styles.orderItemSkin} numberOfLines={1}>{item.skin}</Text>
                </View>
                <Text style={styles.orderItemPrice}>{formatPrice(item.price)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYMENT METHOD</Text>
          <Text style={{ color: '#888', marginBottom: 10 }}>
            💼 Balance: ฿{balance.toLocaleString()}
          </Text>
          <View style={styles.methodList}>
            {PAYMENT_METHODS.map(method => (
              <TouchableOpacity
                key={method.id}
                style={[styles.methodCard, selectedMethod === method.id && styles.methodCardActive]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <View style={styles.methodLeft}>
                  <Text style={{ fontSize: 20 }}>{method.icon}</Text>
                  <View>
                    <Text style={[styles.methodLabel, selectedMethod === method.id && { color: colors.primary }]}>
                      {method.label}
                    </Text>
                    <Text style={styles.methodSub}>{method.sub}</Text>
                  </View>
                </View>
                <View style={[styles.radioOuter, selectedMethod === method.id && styles.radioOuterActive]}>
                  {selectedMethod === method.id && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRICE DETAILS</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Service Fee</Text>
              <Text style={styles.priceValue}>{formatPrice(serviceFee)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total</Text>
              <Text style={styles.priceTotalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.payFooter}>
        <View style={{ flex: 1 }}>
          <Text style={styles.payTotalLabel}>Total</Text>
          <Text style={styles.payTotalAmount}>{formatPrice(total)}</Text>
        </View>
        <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
          <Text style={styles.payBtnText}>PAY NOW →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  backIcon: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },

  section: { padding: 16 },
  sectionTitle: { color: '#888', fontSize: 12, marginBottom: 10 },

  itemsList: { backgroundColor: '#111', borderRadius: 10 },
  orderItem: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  orderImg: { width: 50, height: 30 },
  orderItemImage: { position: 'relative' },
  orderRarityDot: { width: 6, height: 6, borderRadius: 3, position: 'absolute', bottom: 0, right: 0 },
  orderItemInfo: { flex: 1, marginLeft: 10 },
  orderItemWeapon: { color: '#aaa', fontSize: 10 },
  orderItemSkin: { color: '#fff', fontSize: 12 },
  orderItemPrice: { color: colors.primary },

  methodCard: { padding: 12, backgroundColor: '#111', borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  methodCardActive: { borderColor: colors.primary, borderWidth: 1 },
  methodLeft: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  methodLabel: { color: '#fff', fontWeight: '700' },
  methodSub: { color: '#888', fontSize: 11 },

  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#555' },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: { width: 10, height: 10, backgroundColor: colors.primary, borderRadius: 5, margin: 3 },

  priceCard: { backgroundColor: '#111', padding: 12, borderRadius: 10 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceLabel: { color: '#aaa' },
  priceValue: { color: '#fff' },
  priceDivider: { borderTopWidth: 1, borderColor: '#333', marginVertical: 8 },
  priceTotalLabel: { color: '#fff', fontWeight: '800' },
  priceTotalValue: { color: colors.primary, fontWeight: '900' },

  payFooter: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderColor: '#222' },
  payTotalLabel: { color: '#aaa' },
  payTotalAmount: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  payBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 10 },
  payBtnText: { color: '#000', fontWeight: '900' },
});