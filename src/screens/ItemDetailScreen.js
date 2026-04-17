import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts'; // เพิ่ม Import ตรงนี้
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://defuse-th-backend-main.onrender.com';

const formatPriceDetailed = (price) => {
  if (price == null) return "฿0.00";
  return `฿${price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ==========================================
// 1. HELPER COMPONENTS
// ==========================================

const FloatBar = ({ float }) => {
  if (!float) return null;
  const pct = float * 100;
  const ZONES = [
    { label: 'FN', end: 7, color: '#4ade80' },
    { label: 'MW', end: 15, color: '#a3e635' },
    { label: 'FT', end: 38, color: '#facc15' },
    { label: 'WW', end: 45, color: '#fb923c' },
    { label: 'BS', end: 100, color: '#f87171' },
  ];
  const getColor = (f) => {
    const p = f * 100;
    if (p < 7) return '#4ade80';
    if (p < 15) return '#a3e635';
    if (p < 38) return '#facc15';
    if (p < 45) return '#fb923c';
    return '#f87171';
  };

  return (
    <View style={fbStyles.container}>
      <View style={fbStyles.barBg}>
        <View style={[fbStyles.zone, { width: '7%', backgroundColor: '#4ade80' }]} />
        <View style={[fbStyles.zone, { width: '8%', backgroundColor: '#a3e635' }]} />
        <View style={[fbStyles.zone, { width: '23%', backgroundColor: '#facc15' }]} />
        <View style={[fbStyles.zone, { width: '7%', backgroundColor: '#fb923c' }]} />
        <View style={[fbStyles.zone, { width: '55%', backgroundColor: '#f87171' }]} />
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
  barBg: { height: 6, borderRadius: 3, flexDirection: 'row', position: 'relative', marginBottom: 6, overflow: 'hidden' },
  zone: { height: 6 },
  indicator: { position: 'absolute', top: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.background, borderWidth: 2, marginLeft: -6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  zoneLabel: { fontFamily: 'Rajdhani_700Bold', fontSize: 10 },
});

// กราฟใหม่ที่รองรับการเลื่อนและมี Tooltip
const InteractiveChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <View style={{ marginTop: 10, marginLeft: -10 }}>
      <LineChart
        areaChart
        data={data}
        width={width - 80}
        height={180}
        thickness={2}
        color={colors.primary}
        startFillColor={colors.primary}
        endFillColor={colors.primary}
        startOpacity={0.4}
        endOpacity={0.02}
        initialSpacing={10}
        noOfSections={4}
        maxValue={maxValue * 1.2} 
        yAxisColor="transparent"
        yAxisThickness={0}
        rulesType="dashed"
        rulesColor="rgba(255,255,255,0.1)"
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 10, fontFamily: 'Rajdhani_600SemiBold' }}
        xAxisColor="transparent"
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 10, fontFamily: 'Rajdhani_600SemiBold', rotation: 45 }}
        hideDataPoints={true} 
        pointerConfig={{
          pointerStripHeight: 180,
          pointerStripColor: 'rgba(255,255,255,0.5)',
          pointerStripWidth: 1,
          pointerStripUptoDataPoint: true,
          strokeDashArray: [4, 4],
          pointerColor: '#fff',
          radius: 4,
          pointerLabelWidth: 100,
          pointerLabelHeight: 50,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items) => {
            if (!items || !items[0]) return null;
            return (
              <View style={{
                backgroundColor: '#FFF',
                paddingVertical: 6,
                paddingHorizontal: 10,
                borderRadius: 16, // ขอบมนๆ แบบในรูป
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}>
                <Text style={{ color: '#666', fontSize: 10, fontFamily: 'Rajdhani_600SemiBold', marginBottom: 2 }}>
                  {items[0].dateLabel}
                </Text>
                <Text style={{ color: '#000', fontSize: 12, fontFamily: 'Rajdhani_700Bold' }}>
                  {formatPriceDetailed(items[0].value)}
                </Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
};

const BuyOrderRow = ({ price, qty, isHighest }) => (
  <View style={[boStyles.row, isHighest && boStyles.rowHighlight]}>
    <Text style={[boStyles.price, isHighest && { color: colors.primary }]}>{formatPriceDetailed(price)}</Text>
    <View style={boStyles.qtyBox}>
      <Text style={boStyles.qty}>{qty}</Text>
    </View>
  </View>
);

const boStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowHighlight: { backgroundColor: 'rgba(236, 100, 108, 0.1)' },
  price: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 14 },
  qtyBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  qty: { color: colors.textSecondary, fontFamily: 'Rajdhani_700Bold', fontSize: 12 },
});

const TabBar = ({ tabs, active, onSelect }) => (
  <View style={tbStyles.row}>
    {tabs.map(t => (
      <TouchableOpacity key={t} style={[tbStyles.tab, active === t && tbStyles.tabActive]} onPress={() => onSelect(t)}>
        <Text style={[tbStyles.label, active === t && tbStyles.labelActive]}>{t.toUpperCase()}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const tbStyles = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: 'rgba(7,11,20,0.4)', borderRadius: 12, padding: 4, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  label: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, letterSpacing: 1 },
  labelActive: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold' },
});

// ==========================================
// 2. MAIN SCREEN
// ==========================================

export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params || {};

  const [chartTab, setChartTab] = useState('1M');
  const [infoTab, setInfoTab] = useState('Buy Orders');
  const [livePrice, setLivePrice] = useState(null);
  const [liveUsd, setLiveUsd] = useState(null);
  const [marketVolume, setMarketVolume] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  const itemName = item?.wear ? `${item?.weapon} | ${item?.skin} (${item?.wear})` : item?.name || '';
  const rarityColor = item?.rarityColor || colors.rarityMilSpec;

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
          setMarketVolume(Math.floor(Math.random() * 500) + 50);
        }
      } catch (err) {
        console.log("❌ Detail price error:", err);
      } finally {
        setLoadingPrice(false);
      }
    };
    loadPrice();
  }, [itemName]);

  if (!item) return <SafeAreaView style={s.safe}><Text style={{ color: '#fff', margin: 20 }}>Item not found</Text></SafeAreaView>;

  const displayPrice = livePrice !== null ? livePrice : (item.price || 0);
  const displayUsd = liveUsd !== null ? liveUsd : ((item.price || 0) / 35);
  const displayVolume = marketVolume || 124;

  // จำลองข้อมูลแกนเวลาสำหรับกราฟ
  const generateChartData = (prices, interval) => {
    const dataPoints = [];
    // กระจายจุดข้อมูลให้เป็นเส้นกราฟที่ดูมีมิติขึ้น (แทรกค่ากลาง)
    const expandedPrices = [];
    for (let i = 0; i < prices.length - 1; i++) {
      expandedPrices.push(prices[i]);
      expandedPrices.push((prices[i] + prices[i+1]) / 2 + (Math.random() * 100 - 50)); // สุ่มแกว่งนิดหน่อย
    }
    expandedPrices.push(prices[prices.length - 1]);

    return expandedPrices.map((price, index) => {
      const date = new Date();
      // ย้อนเวลาตาม index
      const dayOffset = interval === '1M' ? 1 : interval === '3M' ? 3 : interval === '1Y' ? 15 : 30;
      date.setDate(date.getDate() - (expandedPrices.length - 1 - index) * dayOffset);
      
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();

      return {
        value: Math.max(0, price), // ป้องกันค่าติดลบ
        label: index % 4 === 0 ? `${day} ${month}` : '', // แสดง label แกน X ห่างๆ กันจะได้ไม่ชน
        dateLabel: `${day} ${month} ${year}` // แสดงใน Tooltip
      };
    });
  };

  const priceHistory = {
    '1M': generateChartData([displayPrice * 0.8, displayPrice * 0.9, displayPrice * 1.1, displayPrice * 1.05, displayPrice * 1.12, displayPrice], '1M'),
    '3M': generateChartData([displayPrice * 0.6, displayPrice * 0.7, displayPrice * 0.9, displayPrice * 1.2, displayPrice * 1.1, displayPrice], '3M'),
    '1Y': generateChartData([displayPrice * 0.4, displayPrice * 0.5, displayPrice * 0.8, displayPrice * 1.3, displayPrice * 1.1, displayPrice], '1Y'),
    'ALL': generateChartData([displayPrice * 0.2, displayPrice * 0.4, displayPrice * 0.9, displayPrice * 1.5, displayPrice * 1.2, displayPrice], 'ALL'),
  };

  const buyOrders = [
    { price: displayPrice * 0.97, qty: 1 }, { price: displayPrice * 0.93, qty: 1 },
    { price: displayPrice * 0.88, qty: 2 }, { price: displayPrice * 0.82, qty: 5 },
  ];

  const latestSales = [
    { price: displayPrice, float: item.float, date: '2 hrs ago' },
    { price: displayPrice * 1.05, float: item.float ? item.float - 0.01 : null, date: 'Yesterday' },
  ];

  const patternSeed = item.float ? Math.floor(item.float * 1000000) % 1000 : 420;
  const collectionName = `${item.weapon} Collection`;
  const isPriceUp = -12.1 > 0;

  return (
    <View style={s.container}>
      <LinearGradient colors={[colors.background, '#000000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={s.safe} edges={['top']}>
        
        {/* --- Header --- */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Feather name="chevron-left" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{item.weapon} | {item.skin}</Text>
            <Text style={s.headerSub}>{item.wear || 'Vanilla'}</Text>
          </View>
          <TouchableOpacity style={s.shareBtn}>
            <Feather name="star" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

          {/* --- Item Image --- */}
          <View style={s.imageSection}>
            <LinearGradient colors={['transparent', rarityColor, 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={s.imageRarityTop} />
            <View style={s.imageBox}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={{ position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <LinearGradient colors={[`${rarityColor}30`, 'transparent']} style={{ width: 200, height: 200, borderRadius: 100 }} />
                <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
              </View>
              <Image source={{ uri: item.image }} style={s.mainImage} resizeMode="contain" />
              {item.stattrak && (
                <View style={s.stBanner}>
                  <Text style={s.stBannerText}>STATTRAK™</Text>
                </View>
              )}
            </View>
          </View>

          {/* --- Price & Market Data --- */}
          <View style={s.priceSection}>
            <View style={s.priceRow}>
              {loadingPrice ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={s.mainPrice}>{formatPriceDetailed(displayPrice)}</Text>
              )}
              <View style={[s.changeBadge, { backgroundColor: isPriceUp ? 'rgba(74, 222, 128, 0.15)' : 'rgba(236, 100, 108, 0.15)' }]}>
                <Text style={[s.changeText, { color: isPriceUp ? '#4ade80' : colors.primary }]}>
                  {isPriceUp ? '+' : ''}-12.1%
                </Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
               <Text style={s.usdPrice}>~${displayUsd.toFixed(2)} USD</Text>
               <Text style={s.volumeText}>24H VOL: {displayVolume}</Text>
            </View>

            {item.float != null && (
              <View style={s.floatSection}>
                <View style={s.floatRow}>
                  <Text style={s.floatLabel}>FLOAT VALUE</Text>
                  <Text style={s.floatValue}>{item.float.toFixed(10)} <Text style={{ color: colors.primary }}> (Seed: {patternSeed})</Text></Text>
                </View>
                <FloatBar float={item.float} />
              </View>
            )}
          </View>

          {/* --- Action Buttons --- */}
          <View style={s.actionSection}>
            <TouchableOpacity style={s.buyNowBtn} onPress={() => navigation.navigate('Payment', { items: [{ ...item, price: displayPrice }] })}>
              <Text style={s.buyNowText}>PURCHASE ITEM — {formatPriceDetailed(displayPrice)}</Text>
            </TouchableOpacity>
            <View style={s.secondaryBtns}>
              <TouchableOpacity style={s.bidBtn}>
                <Text style={s.bidBtnText}>PLACE BID ({formatPriceDetailed(displayPrice * 0.95)})</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- Item Details Grid --- */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>INSPECTION DETAILS</Text>
            <View style={s.detailsGrid}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              {[
                { label: 'WEAPON', value: item.weapon },
                { label: 'SKIN', value: item.skin },
                { label: 'RARITY', value: item.rarity, color: rarityColor },
                { label: 'EXTERIOR', value: item.wear || 'Vanilla' },
                { label: 'COLLECTION', value: collectionName },
                { label: 'PATTERN SEED', value: patternSeed },
              ].map((d, i) => (
                <View key={d.label} style={[s.detailCell, i % 2 !== 0 && { borderRightWidth: 0 }]}>
                  <Text style={s.detailLabel}>{d.label}</Text>
                  <Text style={[s.detailValue, d.color && { color: d.color }]} numberOfLines={1}>{d.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* --- Chart --- */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>MARKET TREND</Text>
              <View style={s.chartTabRow}>
                {['1M', '3M', '1Y', 'ALL'].map(t => (
                  <TouchableOpacity key={t} style={[s.chartTab, chartTab === t && s.chartTabActive]} onPress={() => setChartTab(t)}>
                    <Text style={[s.chartTabText, chartTab === t && s.chartTabTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={s.chartBox}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
              
              {/* เรียกใช้ InteractiveChart แทน MiniChart ตรงนี้ */}
              <InteractiveChart data={priceHistory[chartTab]} />
              
            </View>
          </View>

          {/* --- Tables --- */}
          <View style={[s.section, { borderBottomWidth: 0, paddingBottom: 40 }]}>
            <TabBar tabs={['Buy Orders', 'Latest Sales']} active={infoTab} onSelect={setInfoTab} />
            <View style={s.tabContent}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              {infoTab === 'Buy Orders' && (
                <View>
                  <View style={s.tableHeader}>
                    <Text style={s.tableHeaderText}>TARGET PRICE</Text>
                    <Text style={s.tableHeaderText}>VOLUME</Text>
                  </View>
                  {buyOrders.map((o, i) => <BuyOrderRow key={i} price={o.price} qty={o.qty} isHighest={i === 0} />)}
                </View>
              )}
              {infoTab === 'Latest Sales' && (
                <View>
                  <View style={[s.tableHeader, { justifyContent: 'space-between' }]}>
                    <Text style={s.tableHeaderText}>PRICE SOLD</Text>
                    <Text style={s.tableHeaderText}>FLOAT</Text>
                    <Text style={s.tableHeaderText}>TIME</Text>
                  </View>
                  {latestSales.map((sale, i) => (
                    <View key={i} style={s.saleRow}>
                      <Text style={s.salePrice}>{formatPriceDetailed(sale.price)}</Text>
                      <Text style={s.saleFloat}>{sale.float?.toFixed(5) || '—'}</Text>
                      <Text style={s.saleDate}>{sale.date}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// 3. STYLES
// ==========================================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 16, fontStyle: 'italic', letterSpacing: 1 },
  headerSub: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, marginTop: 2 },
  shareBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  scroll: { flex: 1 },

  imageSection: { alignItems: 'center', paddingVertical: 16 },
  imageRarityTop: { height: 1.5, width: '80%', marginBottom: 10 },
  imageBox: { width: width - 32, height: 240, borderRadius: 20, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(76, 44, 52, 0.2)' },
  mainImage: { width: '85%', height: '85%', zIndex: 10 },
  stBanner: { position: 'absolute', top: 16, left: 16, backgroundColor: '#CF6A32', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, zIndex: 20 },
  stBannerText: { color: '#fff', fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1 },

  priceSection: { paddingHorizontal: 20, paddingBottom: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  mainPrice: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 32 },
  changeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(236, 100, 108, 0.3)' },
  changeText: { fontFamily: 'Rajdhani_700Bold', fontSize: 12 },
  usdPrice: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 12, marginBottom: 16 },
  volumeText: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 1, marginBottom: 16 },

  floatSection: { marginTop: 4 },
  floatRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  floatLabel: { color: colors.textSecondary, fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1 },
  floatValue: { color: colors.textPrimary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11 },

  actionSection: { padding: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)', gap: 12 },
  buyNowBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 18, alignItems: 'center', shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { height: 4, width: 0 } },
  buyNowText: { color: '#000', fontFamily: 'Rajdhani_700Bold', fontSize: 15, letterSpacing: 0.5 },
  secondaryBtns: { flexDirection: 'row', gap: 12 },
  bidBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  bidBtnText: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 12, letterSpacing: 0.5 },

  section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: colors.textMuted, fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 2, marginBottom: 12 },

  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' },
  detailCell: { width: '50%', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)', borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.05)' },
  detailLabel: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  detailValue: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 13 },

  chartTabRow: { flexDirection: 'row', gap: 6 },
  chartTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  chartTabActive: { backgroundColor: 'rgba(236, 100, 108, 0.15)', borderWidth: 0.5, borderColor: colors.primary },
  chartTabText: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 10 },
  chartTabTextActive: { color: colors.primary, fontFamily: 'Rajdhani_700Bold' },
  chartBox: { borderRadius: 16, padding: 10, paddingBottom: 20, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)' },

  tabContent: { borderRadius: 16, overflow: 'hidden', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', marginTop: 12, backgroundColor: 'rgba(255,255,255,0.02)' },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)' },
  tableHeaderText: { color: colors.textMuted, fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1 },
  saleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)' },
  salePrice: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 13, flex: 1 },
  saleFloat: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, flex: 1.5, textAlign: 'center' },
  saleDate: { color: colors.textMuted, fontFamily: 'Rajdhani_500Medium', fontSize: 10, flex: 0.8, textAlign: 'right' },
});