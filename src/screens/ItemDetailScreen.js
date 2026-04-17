import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, Image, ActivityIndicator, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-gifted-charts';
import { SvgXml } from 'react-native-svg';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://defuse-th-backend-main.onrender.com';

const xmlData = `<svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="smooth_blur" x="-300" y="-300" width="1400" height="1400" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="100"/>
    </filter>
    <filter id="grain_effect" x="0" y="0" width="800" height="800" filterUnits="userSpaceOnUse">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0" in="noise"/>
      <feComposite operator="in" in2="SourceGraphic"/>
    </filter>
  </defs>
  <rect width="800" height="800" fill="#020202"/>
  <g filter="url(#smooth_blur)">
    <circle cx="100" cy="700" r="250" fill="#0A2472" fill-opacity="0.5"/>
    <circle cx="750" cy="400" r="200" fill="#1E3A8A" fill-opacity="0.3"/>
    <circle cx="700" cy="100" r="180" fill="#00072D" fill-opacity="0.6"/>
  </g>
  <rect width="800" height="800" filter="url(#grain_effect)" opacity="0.6"/>
</svg>`;

const formatPrice = (price) => {
  if (price == null) return '฿0.00';
  return `฿${price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// ==========================================
// 1. FLOAT BAR
// ==========================================
const WEAR_ZONES = [
  { label: 'FN', width: '7%',  color: '#4ade80' },
  { label: 'MW', width: '8%',  color: '#a3e635' },
  { label: 'FT', width: '23%', color: '#facc15' },
  { label: 'WW', width: '7%',  color: '#fb923c' },
  { label: 'BS', width: '55%', color: '#f87171' },
];

const getWearColor = (f) => {
  const p = f * 100;
  if (p < 7)  return '#4ade80';
  if (p < 15) return '#a3e635';
  if (p < 38) return '#facc15';
  if (p < 45) return '#fb923c';
  return '#f87171';
};

const FloatBar = ({ float }) => {
  if (float == null) return null;
  return (
    <View style={fb.container}>
      <View style={fb.track}>
        {WEAR_ZONES.map(z => (
          <View key={z.label} style={[fb.zone, { width: z.width, backgroundColor: z.color }]} />
        ))}
        <View style={[fb.needle, { left: `${float * 100}%`, borderColor: getWearColor(float) }]} />
      </View>
      <View style={fb.labels}>
        {WEAR_ZONES.map(z => (
          <Text key={z.label} style={[fb.label, { color: z.color }]}>{z.label}</Text>
        ))}
      </View>
    </View>
  );
};

const fb = StyleSheet.create({
  container: { marginTop: 4 },
  track: { height: 6, borderRadius: 3, flexDirection: 'row', overflow: 'hidden', marginBottom: 8, position: 'relative' },
  zone: { height: 6 },
  needle: { position: 'absolute', top: -3, width: 12, height: 12, borderRadius: 6, backgroundColor: '#000', borderWidth: 2, marginLeft: -6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontFamily: 'Rajdhani_700Bold', fontSize: 10 },
});

// ==========================================
// 2. CHART
// ==========================================
const PriceChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <View style={{ marginTop: 8, marginLeft: -14 }}>
      <LineChart
        areaChart
        data={data}
        width={width - 72}
        height={160}
        thickness={2.5}
        color={colors.primary}
        startFillColor={colors.primary}
        endFillColor={colors.primary}
        startOpacity={0.35}
        endOpacity={0.01}
        initialSpacing={12}
        endSpacing={12}
        noOfSections={3}
        maxValue={maxValue * 1.2}
        yAxisColor="transparent"
        yAxisThickness={0}
        rulesType="dashed"
        rulesColor="rgba(255,255,255,0.08)"
        yAxisTextStyle={{ color: colors.textMuted, fontSize: 9, fontFamily: 'Rajdhani_600SemiBold' }}
        xAxisColor="transparent"
        xAxisLabelTextStyle={{ color: colors.textMuted, fontSize: 9, fontFamily: 'Rajdhani_600SemiBold' }}
        hideDataPoints
        curved
        curvature={0.2}
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: 'rgba(255,255,255,0.3)',
          pointerStripWidth: 1,
          strokeDashArray: [4, 4],
          pointerColor: '#fff',
          radius: 5,
          pointerLabelWidth: 110,
          pointerLabelHeight: 56,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items) => {
            if (!items?.[0]) return null;
            return (
              <View style={ch.tooltip}>
                <Text style={ch.tooltipDate}>{items[0].dateLabel}</Text>
                <Text style={ch.tooltipPrice}>{formatPrice(items[0].value)}</Text>
              </View>
            );
          },
        }}
      />
    </View>
  );
};

const ch = StyleSheet.create({
  tooltip: {
    backgroundColor: '#fff',
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  tooltipDate: { color: '#888', fontSize: 10, fontFamily: 'Rajdhani_600SemiBold', marginBottom: 2 },
  tooltipPrice: { color: '#000', fontSize: 13, fontFamily: 'Rajdhani_700Bold' },
});

// ==========================================
// 3. TAB BAR
// ==========================================
const TabBar = ({ tabs, active, onSelect }) => (
  <View style={tb.row}>
    {tabs.map(t => (
      <TouchableOpacity
        key={t}
        style={[tb.tab, active === t && tb.tabActive]}
        onPress={() => onSelect(t)}
      >
        <Text style={[tb.label, active === t && tb.labelActive]}>{t.toUpperCase()}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const tb = StyleSheet.create({
  row: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 4, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.08)' },
  label: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  labelActive: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold' },
});

// ==========================================
// 4. MAIN SCREEN
// ==========================================
export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params || {};

  const [chartTab, setChartTab]       = useState('1M');
  const [infoTab, setInfoTab]         = useState('Buy Orders');
  const [livePrice, setLivePrice]     = useState(null);
  const [liveUsd, setLiveUsd]         = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);

  const itemName   = item?.wear ? `${item.weapon} | ${item.skin} (${item.wear})` : item?.name || '';
  const rarityColor = item?.rarityColor || colors.rarityMilSpec;

  // Animation: ปืนสไลด์เข้ามาจากขวา + fade in
  const gunSlide = useRef(new Animated.Value(80)).current;
  const gunOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(gunSlide, {
        toValue: 0,
        duration: 520,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(gunOpacity, {
        toValue: 1,
        duration: 520,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!itemName) return;
    (async () => {
      setLoadingPrice(true);
      try {
        const res  = await fetch(`${BASE_URL}/inventory/price/${encodeURIComponent(itemName)}`);
        const json = await res.json();
        if (json.success && json.thb > 0) {
          setLivePrice(json.thb);
          setLiveUsd(json.usd);
        }
      } catch (err) { console.log('❌ Price error:', err); }
      finally { setLoadingPrice(false); }
    })();
  }, [itemName]);

  if (!item) return null;

  const displayPrice  = livePrice || item.price || 0;
  const displayUsd    = liveUsd   || displayPrice / 35;
  const displayVolume = Math.floor(Math.random() * 500) + 50;
  const patternSeed   = item.float ? Math.floor(item.float * 1000000) % 1000 : 420;
  const isPriceUp     = false; // TODO: เชื่อม API จริง

  // Generate chart data
  const makeChartData = (multipliers, interval) => {
    const dates = [];
    const dayStep = { '1M': 1, '3M': 3, '1Y': 15, 'ALL': 30 }[interval] || 1;
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const base = multipliers.map(m => displayPrice * m);

    // แทรกค่ากลางเพื่อให้เส้นกราฟลื่น
    const expanded = [];
    for (let i = 0; i < base.length - 1; i++) {
      expanded.push(base[i]);
      expanded.push((base[i] + base[i + 1]) / 2 + (Math.random() * 80 - 40));
    }
    expanded.push(base[base.length - 1]);

    return expanded.map((val, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (expanded.length - 1 - idx) * dayStep);
      return {
        value: Math.max(0, val),
        label: idx % 4 === 0 ? `${d.getDate()} ${monthNames[d.getMonth()]}` : '',
        dateLabel: `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      };
    });
  };

  const priceHistory = useMemo(() => ({
    '1M':  makeChartData([0.80, 0.90, 1.10, 1.05, 1.12, 1.00], '1M'),
    '3M':  makeChartData([0.60, 0.70, 0.90, 1.20, 1.10, 1.00], '3M'),
    '1Y':  makeChartData([0.40, 0.50, 0.80, 1.30, 1.10, 1.00], '1Y'),
    'ALL': makeChartData([0.20, 0.40, 0.90, 1.50, 1.20, 1.00], 'ALL'),
  }), [displayPrice]);

  const buyOrders = [
    { price: displayPrice * 0.97, qty: 1 },
    { price: displayPrice * 0.93, qty: 1 },
    { price: displayPrice * 0.88, qty: 2 },
    { price: displayPrice * 0.82, qty: 5 },
  ];

  const latestSales = [
    { price: displayPrice,        float: item.float,                         date: '2 hrs ago' },
    { price: displayPrice * 1.05, float: item.float ? item.float - 0.01 : null, date: 'Yesterday' },
  ];

  const detailFields = [
    { label: 'WEAPON',       value: item.weapon },
    { label: 'SKIN',         value: item.skin },
    { label: 'RARITY',       value: item.rarity || 'Mil-Spec', color: rarityColor },
    { label: 'EXTERIOR',     value: item.wear || 'Vanilla' },
    { label: 'PATTERN SEED', value: patternSeed },
    { label: '24H VOL',      value: displayVolume },
  ];

  return (
    <View style={s.container}>
      {/* Layer 1: SVG Background */}
      <View style={StyleSheet.absoluteFill}>
        <SvgXml xml={xmlData} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>
      {/* Layer 2: Gradient Overlay */}
      <LinearGradient
        colors={['rgba(19, 18, 19, 0.75)', 'rgba(0, 0, 0, 0.92)']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Feather name="chevron-left" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{item.weapon} | {item.skin}</Text>
            <Text style={s.headerSub}>{item.wear || 'Vanilla'}</Text>
          </View>
          <TouchableOpacity style={s.iconBtn}>
            <Feather name="star" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Image */}
          <View style={s.imageSection}>
            <LinearGradient
              colors={['transparent', rarityColor, 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.rarityLine}
            />
            <View style={s.imageBox}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={[`${rarityColor}40`, 'transparent']} style={s.glowRadial} />
              <Animated.View style={[
                s.animatedGun,
                { transform: [{ translateX: gunSlide }], opacity: gunOpacity }
              ]}>
                <Image source={{ uri: item.image }} style={s.mainImage} resizeMode="contain" />
              </Animated.View>
              {item.stattrak && (
                <View style={s.stBanner}><Text style={s.stBannerText}>STATTRAK™</Text></View>
              )}
            </View>
          </View>

          <View style={s.content}>

            {/* Price */}
            <View style={s.priceBlock}>
              <View style={s.priceRow}>
                {loadingPrice ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={s.mainPrice}>{formatPrice(displayPrice)}</Text>
                )}
                <View style={[s.changeBadge, { backgroundColor: isPriceUp ? 'rgba(74,222,128,0.15)' : 'rgba(236,100,108,0.15)' }]}>
                  <Text style={[s.changeText, { color: isPriceUp ? '#4ade80' : colors.primary }]}>
                    {isPriceUp ? '+' : ''}−12.1%
                  </Text>
                </View>
              </View>
              <Text style={s.usdPrice}>~${displayUsd.toFixed(2)} USD</Text>
            </View>

            {/* Float */}
            {item.float != null && (
              <View style={s.glassBox}>
                <View style={s.floatHeader}>
                  <Text style={s.glassLabel}>FLOAT VALUE</Text>
                  <Text style={s.floatValue}>{item.float.toFixed(10)}</Text>
                </View>
                <FloatBar float={item.float} />
              </View>
            )}

            {/* Buy Button */}
            <TouchableOpacity
              style={s.buyBtn}
              onPress={() => navigation.navigate('Payment', { items: [{ ...item, price: displayPrice }] })}
            >
              <Text style={s.buyBtnText}>PURCHASE ITEM — {formatPrice(displayPrice)}</Text>
            </TouchableOpacity>

            {/* Chart */}
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>MARKET TREND</Text>
                <View style={s.chartTabs}>
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
              <View style={s.glassBox}>
                <PriceChart data={priceHistory[chartTab]} />
              </View>
            </View>

            {/* Details Grid */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>INSPECTION DETAILS</Text>
              <View style={s.detailsGrid}>
                {detailFields.map((d, i) => (
                  <View key={d.label} style={[s.detailCell, i % 2 !== 0 && { borderRightWidth: 0 }]}>
                    <Text style={s.detailLabel}>{d.label}</Text>
                    <Text style={[s.detailValue, d.color && { color: d.color }]} numberOfLines={1}>
                      {d.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Buy Orders / Latest Sales */}
            <View style={[s.section, { paddingBottom: 60 }]}>
              <TabBar tabs={['Buy Orders', 'Latest Sales']} active={infoTab} onSelect={setInfoTab} />
              <View style={s.tableBox}>
                {infoTab === 'Buy Orders' && (
                  <View>
                    <View style={s.tableHeader}>
                      <Text style={s.tableHeaderText}>TARGET PRICE</Text>
                      <Text style={s.tableHeaderText}>VOLUME</Text>
                    </View>
                    {buyOrders.map((o, i) => (
                      <View key={i} style={[s.tableRow, i === 0 && s.tableRowHighlight]}>
                        <Text style={[s.tablePrice, i === 0 && { color: colors.primary }]}>
                          {formatPrice(o.price)}
                        </Text>
                        <View style={s.qtyBox}>
                          <Text style={s.qtyText}>{o.qty}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                {infoTab === 'Latest Sales' && (
                  <View>
                    <View style={s.tableHeader}>
                      <Text style={s.tableHeaderText}>PRICE SOLD</Text>
                      <Text style={s.tableHeaderText}>FLOAT</Text>
                      <Text style={s.tableHeaderText}>TIME</Text>
                    </View>
                    {latestSales.map((sale, i) => (
                      <View key={i} style={s.tableRow}>
                        <Text style={[s.tablePrice, { color: colors.primary }]}>{formatPrice(sale.price)}</Text>
                        <Text style={s.saleFloat}>{sale.float?.toFixed(5) || '—'}</Text>
                        <Text style={s.saleDate}>{sale.date}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// 5. STYLES
// ==========================================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 16, fontStyle: 'italic' },
  headerSub: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, marginTop: 2 },

  scroll: { flex: 1 },
  imageSection: { alignItems: 'center', paddingTop: 16, paddingBottom: 8 },
  rarityLine: { height: 1.5, width: '80%', marginBottom: 12 },
  imageBox: {
    width: width - 32, height: 230,
    borderRadius: 24, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  glowRadial: { width: 200, height: 200, borderRadius: 100, position: 'absolute' },
  mainImage: { width: '85%', height: '85%', zIndex: 10 },
  animatedGun: { width: '85%', height: '85%', zIndex: 10, alignItems: 'center', justifyContent: 'center' },
  stBanner: { position: 'absolute', top: 14, left: 14, backgroundColor: '#CF6A32', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 20 },
  stBannerText: { color: '#fff', fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1 },

  content: { paddingHorizontal: 20, paddingTop: 16 },

  priceBlock: { marginBottom: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  mainPrice: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 34 },
  changeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  changeText: { fontFamily: 'Rajdhani_700Bold', fontSize: 12 },
  usdPrice: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 13 },

  glassBox: {
    borderRadius: 20, overflow: 'hidden', padding: 16,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)', marginBottom: 16,
  },
  glassLabel: { color: colors.textMuted, fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1 },
  floatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  floatValue: { color: colors.textPrimary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11 },

  buyBtn: {
    backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginBottom: 4,
    shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { height: 4, width: 0 },
  },
  buyBtnText: { color: '#000', fontFamily: 'Rajdhani_700Bold', fontSize: 15, letterSpacing: 0.5 },

  section: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: colors.textMuted, fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 2 },

  chartTabs: { flexDirection: 'row', gap: 6 },
  chartTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
  chartTabActive: { backgroundColor: 'rgba(236,100,108,0.15)', borderWidth: 0.5, borderColor: colors.primary },
  chartTabText: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 10 },
  chartTabTextActive: { color: colors.primary, fontFamily: 'Rajdhani_700Bold' },

  detailsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', borderRadius: 20, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)',
  },
  detailCell: {
    width: '50%', paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)',
    borderRightWidth: 0.5, borderRightColor: 'rgba(255,255,255,0.05)',
  },
  detailLabel: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  detailValue: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 13 },

  tableBox: {
    marginTop: 12, borderRadius: 20, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tableHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tableHeaderText: { color: colors.textMuted, fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 1 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  tableRowHighlight: { backgroundColor: 'rgba(236,100,108,0.08)' },
  tablePrice: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 14, flex: 1 },
  qtyBox: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)' },
  qtyText: { color: colors.textSecondary, fontFamily: 'Rajdhani_700Bold', fontSize: 12 },
  saleFloat: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, flex: 1.5, textAlign: 'center' },
  saleDate: { color: colors.textMuted, fontFamily: 'Rajdhani_500Medium', fontSize: 10, flex: 0.8, textAlign: 'right' },
});