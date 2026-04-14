import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, Animated, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://defuse-th-backend-main.onrender.com';

// ✅ ฟังก์ชัน format ราคาใหม่ รองรับทศนิยม 2 ตำแหน่ง
const formatPriceDetailed = (price) => {
  if (price == null) return "฿0.00";
  return `฿${price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Float bar แสดง wear condition
const FloatBar = ({ float }) => {
  if (!float) return null;
  const pct = float * 100;
  const ZONES = [
    { label: 'FN', end: 7, color: '#4CAF50' },
    { label: 'MW', end: 15, color: '#8BC34A' },
    { label: 'FT', end: 38, color: '#FFC107' },
    { label: 'WW', end: 45, color: '#FF9800' },
    { label: 'BS', end: 100, color: '#F44336' },
  ];
  const getColor = (f) => {
    const p = f * 100;
    if (p < 7) return '#4CAF50';
    if (p < 15) return '#8BC34A';
    if (p < 38) return '#FFC107';
    if (p < 45) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={fbStyles.container}>
      <View style={fbStyles.barBg}>
        <View style={[fbStyles.zone, { width: '7%', backgroundColor: '#4CAF50' }]} />
        <View style={[fbStyles.zone, { width: '8%', backgroundColor: '#8BC34A' }]} />
        <View style={[fbStyles.zone, { width: '23%', backgroundColor: '#FFC107' }]} />
        <View style={[fbStyles.zone, { width: '7%', backgroundColor: '#FF9800' }]} />
        <View style={[fbStyles.zone, { width: '55%', backgroundColor: '#F44336' }]} />
        <View style={[fbStyles.indicator, { left: `${pct}%`, borderColor: getColor(float) }]} />
      </View>
      <View style={fbStyles.labels}>
        {ZONES.map(z => (
          <Text key={z.label} style={[fbStyles.zoneLabel, { color: z.color }]}>{z.label}</Text>
        ))}
      </View>
    </View>
  );
};

const fbStyles = StyleSheet.create({
  container: { marginBottom: 12 },
  barBg: {
    height: 8, borderRadius: 4,
    flexDirection: 'row', overflow: 'visible',
    position: 'relative', marginBottom: 4,
  },
  zone: { height: 8 },
  indicator: {
    position: 'absolute', top: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 2,
    marginLeft: -8,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  zoneLabel: { fontSize: 9, fontWeight: '700' },
});

// Price history mini chart
const MiniChart = ({ data }) => {
  const H = 80;
  const W = width - 64;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * H,
  }));

  return (
    <View style={{ height: H + 20, position: 'relative', marginBottom: 8 }}>
      {[0, 0.5, 1].map(r => (
        <View key={r} style={{
          position: 'absolute', left: 0, right: 0,
          top: r * H, height: 1,
          backgroundColor: colors.border,
        }} />
      ))}
      {points.map((p, i) => (
        <View key={i} style={{
          position: 'absolute',
          left: p.x - 3, top: p.y - 3,
          width: 6, height: 6, borderRadius: 3,
          backgroundColor: colors.accent,
        }} />
      ))}
      {points.slice(0, -1).map((p, i) => {
        const next = points[i + 1];
        const dx = next.x - p.x;
        const dy = next.y - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        return (
          <View key={`l${i}`} style={{
            position: 'absolute',
            left: p.x, top: p.y,
            width: len, height: 1.5,
            backgroundColor: colors.accent + 'AA',
            transformOrigin: 'left',
            transform: [{ rotate: `${angle}deg` }],
          }} />
        );
      })}
      <Text style={{ position: 'absolute', left: 0, top: H + 4, color: colors.textMuted, fontSize: 9 }}>
        {formatPriceDetailed(min)}
      </Text>
      <Text style={{ position: 'absolute', right: 0, top: H + 4, color: colors.textMuted, fontSize: 9 }}>
        {formatPriceDetailed(max)}
      </Text>
    </View>
  );
};

// Buy Order row
const BuyOrderRow = ({ price, qty, isHighest }) => (
  <View style={[boStyles.row, isHighest && boStyles.rowHighlight]}>
    <Text style={[boStyles.price, isHighest && { color: colors.accentGreen }]}>{formatPriceDetailed(price)}</Text>
    <View style={boStyles.qtyBox}>
      <Text style={boStyles.qty}>{qty}</Text>
    </View>
  </View>
);

const boStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  rowHighlight: { backgroundColor: colors.accentGreen + '0A' },
  price: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  qtyBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3,
  },
  qty: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
});

// Sticker chip
const StickerChip = ({ name, wear }) => (
  <View style={stickerStyles.chip}>
    <Text style={stickerStyles.icon}>🔰</Text>
    <Text style={stickerStyles.name} numberOfLines={1}>{name}</Text>
    {wear && <Text style={stickerStyles.wear}>{(wear * 100).toFixed(0)}%</Text>}
  </View>
);

const stickerStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
    marginRight: 8, marginBottom: 8, gap: 6,
  },
  icon: { fontSize: 14 },
  name: { color: colors.textSecondary, fontSize: 11, fontWeight: '600', maxWidth: 80 },
  wear: { color: colors.textMuted, fontSize: 10 },
});

// Tab selector
const TabBar = ({ tabs, active, onSelect }) => (
  <View style={tbStyles.row}>
    {tabs.map(t => (
      <TouchableOpacity
        key={t} style={[tbStyles.tab, active === t && tbStyles.tabActive]}
        onPress={() => onSelect(t)}
      >
        <Text style={[tbStyles.label, active === t && tbStyles.labelActive]}>{t}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const tbStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.surfaceElevated },
  label: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  labelActive: { color: colors.textPrimary, fontWeight: '800' },
});

// ── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params || {};

  const [chartTab, setChartTab] = useState('1M');
  const [infoTab, setInfoTab] = useState('Buy Orders');

  // ✅ State สำหรับโหลดราคา Live
  const [livePrice, setLivePrice] = useState(null);
  const [liveUsd, setLiveUsd] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  // ดึงชื่อไอเทมให้ตรงกับของ Steam
  const itemName = item?.wear
    ? `${item?.weapon} | ${item?.skin} (${item?.wear})`
    : item?.name || '';

  // โหลดราคาทันทีที่เปิดหน้า Detail
  useEffect(() => {
    if (!itemName) return;
    const loadPrice = async () => {
      setLoadingPrice(true);
      try {
        const res = await fetch(`${BASE_URL}/inventory/price/${encodeURIComponent(itemName)}`);
        const json = await res.json();
        if (json.success && json.thb > 0) {
          setLivePrice(json.thb);
          setLiveUsd(json.usd);
        }
      } catch (err) {
        console.log("❌ Detail price error:", err);
      } finally {
        setLoadingPrice(false);
      }
    };
    loadPrice();
  }, [itemName]);

  if (!item) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <Text style={{ color: '#fff', margin: 20 }}>Item not found</Text>
      </SafeAreaView>
    );
  }

  // ✅ ใช้ราคา Live (ถ้าโหลดมาแล้ว) ถ้ายังให้ใช้ราคาตั้งต้นไปก่อน
  const displayPrice = livePrice !== null ? livePrice : (item.price || 0);
  const displayUsd = liveUsd !== null ? liveUsd : ((item.price || 0) / 35);

  // อัปเดตกราฟและข้อมูลจำลองให้ใช้ displayPrice
  const priceHistory = {
    '1M': [displayPrice * 1.3, displayPrice * 1.25, displayPrice * 1.18, displayPrice * 1.1, displayPrice * 1.05, displayPrice],
    '3M': [displayPrice * 1.5, displayPrice * 1.4, displayPrice * 1.3, displayPrice * 1.2, displayPrice * 1.1, displayPrice],
    '1Y': [displayPrice * 2, displayPrice * 1.8, displayPrice * 1.6, displayPrice * 1.3, displayPrice * 1.1, displayPrice],
    'ALL': [displayPrice * 3, displayPrice * 2.5, displayPrice * 2, displayPrice * 1.5, displayPrice * 1.2, displayPrice],
  };

  const buyOrders = [
    { price: displayPrice * 0.97, qty: 1 },
    { price: displayPrice * 0.93, qty: 1 },
    { price: displayPrice * 0.88, qty: 1 },
    { price: displayPrice * 0.82, qty: 2 },
    { price: displayPrice * 0.75, qty: 1 },
    { price: displayPrice * 0.65, qty: 3 },
    { price: displayPrice * 0.50, qty: 6 },
  ];

  const latestSales = [
    { price: displayPrice, float: item.float, date: '2 Mar', wear: item.wear },
    { price: displayPrice * 1.05, float: item.float ? item.float - 0.01 : null, date: '28 Feb', wear: item.wear },
    { price: displayPrice * 0.98, float: item.float ? item.float + 0.005 : null, date: '25 Feb', wear: item.wear },
    { price: displayPrice * 1.12, float: item.float ? item.float - 0.02 : null, date: '20 Feb', wear: item.wear },
  ];

  const stickers = item.stattrak ? [
    { name: 'Natus Vincere', wear: 0.05 },
    { name: 'BLAST 2024', wear: 0.12 },
    { name: 'PGL Major', wear: null },
    { name: 'FaZe Clan', wear: 0.08 },
  ] : [];

  const priceDrop = -12.1;
  const isPriceUp = priceDrop > 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{item.weapon} | {item.skin}</Text>
          <Text style={s.headerSub}>{item.wear}</Text>
        </View>
        <TouchableOpacity style={s.shareBtn}>
          <Text style={s.shareIcon}>⭐</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── ITEM IMAGE ── */}
        <View style={s.imageSection}>
          <View style={[s.imageRarityTop, { backgroundColor: item.rarityColor }]} />
          <View style={s.imageBox}>
            <Image
              source={{ uri: item.image }}
              style={s.mainImage}
              resizeMode="contain"
              defaultSource={{ uri: 'https://via.placeholder.com/300x200/1A1A26/444?text=...' }}
            />
            {item.stattrak && (
              <View style={s.stBanner}>
                <Text style={s.stBannerText}>StatTrak™</Text>
              </View>
            )}
            {item.souvenir && (
              <View style={[s.stBanner, { backgroundColor: '#E4AE33' }]}>
                <Text style={[s.stBannerText, { color: '#000' }]}>Souvenir</Text>
              </View>
            )}
          </View>
          <View style={[s.rarityLabel, { borderColor: item.rarityColor }]}>
            <View style={[s.rarityDot, { backgroundColor: item.rarityColor }]} />
            <Text style={[s.rarityText, { color: item.rarityColor }]}>{item.rarity}</Text>
          </View>
        </View>

        {/* ── PRICE ── */}
        <View style={s.priceSection}>
          <View style={s.priceRow}>
            {/* ✅ แสดง Spinner ระหว่างโหลด ถ้าโหลดเสร็จแสดงราคาทศนิยม 2 ตำแหน่ง */}
            {loadingPrice ? (
               <ActivityIndicator size="small" color={colors.primary} />
            ) : (
               <Text style={s.mainPrice}>{formatPriceDetailed(displayPrice)}</Text>
            )}
            <View style={[s.changeBadge, { backgroundColor: isPriceUp ? colors.accentGreen + '22' : colors.accentRed + '22' }]}>
              <Text style={[s.changeText, { color: isPriceUp ? colors.accentGreen : colors.accentRed }]}>
                {isPriceUp ? '+' : ''}{priceDrop}%
              </Text>
            </View>
          </View>
          <Text style={s.usdPrice}>${displayUsd.toFixed(2)} USD</Text>

          {/* Float */}
          {item.float != null && (
            <View style={s.floatSection}>
              <View style={s.floatRow}>
                <Text style={s.floatLabel}>Float Value</Text>
                <Text style={s.floatValue}>{item.float.toFixed(10)} (#{Math.floor(Math.random() * 500) + 1})</Text>
              </View>
              <FloatBar float={item.float} />
            </View>
          )}

          {/* Status row */}
          <View style={s.statusRow}>
            <View style={s.statusDot} />
            <Text style={s.statusText}>Offline</Text>
            <Text style={s.statusSep}>•</Text>
            <Text style={s.statusText}>Listed 2 hours ago</Text>
            {item.tradeLock && (
              <>
                <Text style={s.statusSep}>•</Text>
                <Text style={[s.statusText, { color: colors.accentRed }]}>🔒 Trade Locked</Text>
              </>
            )}
          </View>
        </View>

        {/* ── ACTION BUTTONS ── */}
        <View style={s.actionSection}>
          <TouchableOpacity
            style={s.buyNowBtn}
            onPress={() => navigation.navigate('Payment', { items: [{ ...item, price: displayPrice }] })}
          >
            <Text style={s.buyNowText}>BUY NOW — {formatPriceDetailed(displayPrice)}</Text>
          </TouchableOpacity>
          <View style={s.secondaryBtns}>
            <TouchableOpacity
              style={s.bidBtn}
              onPress={() => Alert.alert('Place Bid', `Bid ${formatPriceDetailed(displayPrice * 0.95)}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => Alert.alert('Bid Placed!', 'You will be notified if accepted.') },
              ])}
            >
              <Text style={s.bidBtnText}>🏷️ Bid {formatPriceDetailed(displayPrice * 0.95)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.autoBidBtn}>
              <Text style={s.autoBidText}>Auto Bid ⚡</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── STICKERS ── */}
        {stickers.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>STICKERS</Text>
            <View style={s.stickersGrid}>
              {stickers.map((st, i) => <StickerChip key={i} name={st.name} wear={st.wear} />)}
            </View>
          </View>
        )}

        {/* ── DETAILS GRID ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ITEM DETAILS</Text>
          <View style={s.detailsGrid}>
            {[
              { label: 'Weapon', value: item.weapon },
              { label: 'Skin', value: item.skin },
              { label: 'Rarity', value: item.rarity, color: item.rarityColor },
              { label: 'Wear', value: item.wear || '—' },
              { label: 'Float', value: item.float?.toFixed(6) || '—' },
              { label: 'Category', value: item.category },
              { label: 'StatTrak™', value: item.stattrak ? 'Yes' : 'No', color: item.stattrak ? '#CF6A32' : undefined },
              { label: 'Souvenir', value: item.souvenir ? 'Yes' : 'No', color: item.souvenir ? '#E4AE33' : undefined },
            ].map(d => (
              <View key={d.label} style={s.detailCell}>
                <Text style={s.detailLabel}>{d.label}</Text>
                <Text style={[s.detailValue, d.color && { color: d.color }]}>{d.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── PRICE CHART ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>PRICE HISTORY</Text>
            <View style={s.chartTabRow}>
              {['1M', '3M', '1Y', 'ALL'].map(t => (
                <TouchableOpacity
                  key={t}
                  style={[s.chartTab, chartTab === t && s.chartTabActive]}
                  onPress={() => setChartTab(t)}
                >
                  <Text style={[s.chartTabText, chartTab === t && s.chartTabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={s.chartBox}>
            <MiniChart data={priceHistory[chartTab]} />
          </View>
        </View>

        {/* ── BUY ORDERS / LATEST SALES ── */}
        <View style={s.section}>
          <TabBar
            tabs={['Buy Orders', 'Latest Sales', 'Similar']}
            active={infoTab}
            onSelect={setInfoTab}
          />
          <View style={s.tabContent}>
            {infoTab === 'Buy Orders' && (
              <View>
                <View style={s.tableHeader}>
                  <Text style={s.tableHeaderText}>Price</Text>
                  <Text style={s.tableHeaderText}>Quantity</Text>
                </View>
                {buyOrders.map((o, i) => (
                  <BuyOrderRow key={i} price={o.price} qty={o.qty} isHighest={i === 0} />
                ))}
                <TouchableOpacity
                  style={s.createOrderBtn}
                  onPress={() => Alert.alert('Create Buy Order', 'Set your target price to auto-buy when available')}
                >
                  <Text style={s.createOrderText}>+ CREATE BUY ORDER</Text>
                </TouchableOpacity>
              </View>
            )}

            {infoTab === 'Latest Sales' && (
              <View>
                <View style={[s.tableHeader, { justifyContent: 'space-between' }]}>
                  <Text style={s.tableHeaderText}>Price</Text>
                  <Text style={s.tableHeaderText}>Float</Text>
                  <Text style={s.tableHeaderText}>Date</Text>
                </View>
                {latestSales.map((sale, i) => (
                  <View key={i} style={s.saleRow}>
                    <Text style={s.salePrice}>{formatPriceDetailed(sale.price)}</Text>
                    <Text style={s.saleFloat}>{sale.float?.toFixed(6) || '—'}</Text>
                    <Text style={s.saleDate}>{sale.date}</Text>
                  </View>
                ))}
              </View>
            )}

            {infoTab === 'Similar' && (
              <View style={s.similarEmpty}>
                <Text style={s.similarEmptyIcon}>🔫</Text>
                <Text style={s.similarEmptyText}>Similar items coming soon</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── SELLER INFO ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>SELLER</Text>
          <View style={s.sellerCard}>
            <View style={s.sellerAvatar}>
              <Text style={{ fontSize: 24 }}>🎯</Text>
            </View>
            <View style={s.sellerInfo}>
              <Text style={s.sellerName}>CS2 Trader TH</Text>
              <View style={s.sellerStats}>
                <Text style={s.sellerStat}>⭐ 4.9</Text>
                <Text style={s.sellerSep}>•</Text>
                <Text style={s.sellerStat}>128 trades</Text>
                <Text style={s.sellerSep}>•</Text>
                <View style={s.onlineDot} />
                <Text style={[s.sellerStat, { color: colors.accentGreen }]}>Online</Text>
              </View>
            </View>
            <TouchableOpacity style={s.msgBtn}>
              <Text style={s.msgBtnText}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backIcon: { color: colors.textPrimary, fontSize: 22, fontWeight: '600' },
  headerCenter: { flex: 1 },
  headerTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '800' },
  headerSub: { color: colors.textMuted, fontSize: 11, marginTop: 1 },
  shareBtn: { padding: 6 },
  shareIcon: { fontSize: 20 },

  scroll: { flex: 1 },

  // Image
  imageSection: { alignItems: 'center', paddingVertical: 8 },
  imageRarityTop: { height: 3, width: '100%', marginBottom: 0 },
  imageBox: {
    width: '100%', height: 220,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  mainImage: { width: width - 40, height: 200 },
  stBanner: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: '#CF6A32', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  stBannerText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  rarityLabel: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 10,
  },
  rarityDot: { width: 8, height: 8, borderRadius: 4 },
  rarityText: { fontSize: 12, fontWeight: '700' },

  // Price
  priceSection: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  mainPrice: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  changeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  changeText: { fontSize: 13, fontWeight: '800' },
  usdPrice: { color: colors.textMuted, fontSize: 13, marginBottom: 14 },

  floatSection: { marginBottom: 8 },
  floatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  floatLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  floatValue: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textMuted },
  statusText: { color: colors.textMuted, fontSize: 11 },
  statusSep: { color: colors.border, fontSize: 11 },

  // Actions
  actionSection: {
    paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    gap: 10,
  },
  buyNowBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  buyNowText: { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 0.3 },
  secondaryBtns: { flexDirection: 'row', gap: 10 },
  bidBtn: {
    flex: 1, backgroundColor: colors.surfaceElevated,
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  bidBtnText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  autoBidBtn: {
    flex: 1, backgroundColor: colors.accentBlue + '22',
    borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: colors.accentBlue + '44',
  },
  autoBidText: { color: colors.accentBlue, fontSize: 13, fontWeight: '700' },

  // Section
  section: {
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: {
    color: colors.textMuted, fontSize: 10, fontWeight: '800',
    letterSpacing: 2, marginBottom: 14,
  },

  stickersGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },

  // Details grid
  detailsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },
  detailCell: {
    width: '50%', paddingVertical: 12, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    borderRightWidth: 1, borderRightColor: colors.border,
  },
  detailLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 3, letterSpacing: 0.5 },
  detailValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },

  // Chart
  chartTabRow: { flexDirection: 'row', gap: 4 },
  chartTab: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6,
  },
  chartTabActive: { backgroundColor: colors.surfaceElevated },
  chartTabText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chartTabTextActive: { color: colors.primary, fontWeight: '800' },
  chartBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: 12,
  },

  // Table
  tabContent: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    marginTop: 10, marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 14,
    backgroundColor: colors.cardBg,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tableHeaderText: { color: colors.textMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  saleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  salePrice: { color: colors.primary, fontSize: 13, fontWeight: '700', flex: 1 },
  saleFloat: { color: colors.textSecondary, fontSize: 11, flex: 1.5, textAlign: 'center' },
  saleDate: { color: colors.textMuted, fontSize: 11, flex: 0.8, textAlign: 'right' },

  createOrderBtn: {
    paddingVertical: 14, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  createOrderText: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  similarEmpty: { padding: 32, alignItems: 'center' },
  similarEmptyIcon: { fontSize: 32, marginBottom: 8, opacity: 0.4 },
  similarEmptyText: { color: colors.textMuted, fontSize: 13 },

  // Seller
  sellerCard: {
    backgroundColor: colors.surfaceElevated, borderRadius: 14,
    borderWidth: 1, borderColor: colors.border,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 12,
  },
  sellerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.cardBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  sellerInfo: { flex: 1 },
  sellerName: { color: colors.textPrimary, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  sellerStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sellerStat: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  sellerSep: { color: colors.border },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accentGreen },
  msgBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  msgBtnText: { fontSize: 18 },
});