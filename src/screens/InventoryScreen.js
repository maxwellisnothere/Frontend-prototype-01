import { fetchInventory, getStoredUser, fetchBalance } from '../data/api';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Image, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { colors } from '../theme/colors';
import GlowBackground from '../components/GlowBackground';

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

const BASE_URL = 'https://defuse-th-backend-main.onrender.com';
const FILTERS = ['Sellable', 'Trade Lock', 'Containers'];

// ==========================================
// 1. HELPERS & CACHE
// ==========================================
const formatPriceDetailed = (price) => {
  if (price == null) return '฿0.00';
  return `฿${price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const priceMemCache = new Map();
const PRICE_CACHE_TTL = 5 * 60 * 1000;

async function fetchSteamPrice(itemName) {
  if (!itemName || itemName.trim() === '') return null;
  const cached = priceMemCache.get(itemName);
  if (cached && Date.now() - cached.ts < PRICE_CACHE_TTL) return cached;
  try {
    const res = await fetch(`${BASE_URL}/inventory/price/${encodeURIComponent(itemName)}`);
    const json = await res.json();
    if (json.success && json.thb > 0) {
      const result = { lowestThb: json.thb, lowestUsd: json.usd, ts: Date.now() };
      priceMemCache.set(itemName, result);
      return result;
    }
  } catch (err) {
    console.log('❌ Fetch price error:', err);
  }
  return null;
}

// ==========================================
// 2. ITEM CARD
// ==========================================
const ItemCard = React.memo(({ item, onSell, onPress, onPriceLoaded }) => {
  const [steamThb, setSteamThb] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const mountedRef = useRef(true);

  const itemName = item.wear ? `${item.weapon} | ${item.skin} (${item.wear})` : item.name || '';
  const rarityColor = item.rarityColor || colors.rarityMilSpec;

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    const load = async () => {
      setLoadingPrice(true);
      const result = await fetchSteamPrice(itemName);
      if (!cancelled && mountedRef.current) {
        const price = result?.lowestThb ?? null;
        setSteamThb(price);
        setLoadingPrice(false);
        if (price !== null && onPriceLoaded) onPriceLoaded(item.id, price);
      }
    };
    load();
    return () => { cancelled = true; mountedRef.current = false; };
  }, [itemName]);

  const displayPrice = steamThb ?? item.price ?? 0;
  const hasSteam = steamThb !== null && steamThb > 0;

  return (
    <View style={cs.wrapper}>
      <TouchableOpacity style={cs.card} onPress={onPress} activeOpacity={0.9}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']}
          style={StyleSheet.absoluteFill}
        />

        <View style={cs.imageBox}>
          <GlowBackground color={rarityColor} />
          <Image source={{ uri: item.image }} style={cs.image} resizeMode="contain" />
          {item.stattrak && (
            <View style={cs.stBadge}><Text style={cs.stText}>STATTRAK™</Text></View>
          )}
          {item.tradeLock && (
            <View style={cs.lockBadge}><Feather name="lock" size={10} color="#FFF" /></View>
          )}
        </View>

        <View style={cs.info}>
          <Text style={cs.weapon} numberOfLines={1}>{item.weapon}</Text>
          <Text style={cs.skin} numberOfLines={1}>{item.skin}</Text>

          <View style={cs.detailRow}>
            {item.wear && (
              <View style={[cs.wearBadge, { borderColor: `${rarityColor}40` }]}>
                <Text style={cs.wear}>
                  {item.wear.split('-').map(w => w[0]).join('').toUpperCase().substring(0, 2)}
                </Text>
              </View>
            )}
            {item.float != null && (
              <Text style={cs.float}>{item.float.toFixed(4)}</Text>
            )}
          </View>

          <View style={cs.priceRow}>
            {loadingPrice ? (
              <ActivityIndicator size="small" color={colors.textMuted} />
            ) : (
              <>
                <Text style={[cs.price, !hasSteam && cs.priceFallback]}>
                  {formatPriceDetailed(displayPrice)}
                </Text>
                {hasSteam && <View style={cs.liveDot} />}
              </>
            )}
          </View>
        </View>

        <View style={[cs.bottomNeonLine, { backgroundColor: rarityColor }]} />

        {item.listed && (
          <View style={cs.listedOverlay}>
            <View style={cs.listedOverlayInner}>
              <Text style={cs.listedOverlayIcon}>✅</Text>
              <Text style={cs.listedOverlayText}>LISTED</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[cs.sellBtn, (item.tradeLock || item.listed) && cs.sellBtnLocked]}
        disabled={item.tradeLock || item.listed}
        onPress={() => onSell(item)}
        activeOpacity={0.8}
      >
        <Text style={[cs.sellBtnText, (item.tradeLock || item.listed) && cs.sellBtnTextMuted]}>
          {item.tradeLock ? '🔒 LOCKED' : item.listed ? '✅ LISTED' : 'SELL ITEM'}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

// ==========================================
// 3. MAIN SCREEN
// ==========================================
export default function InventoryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [steamPrices, setSteamPrices] = useState({});

  useFocusEffect(
    useCallback(() => { loadInventory(); loadBalance(); }, [])
  );

  const loadBalance = async () => {
    try {
      const data = await fetchBalance();
      if (data.success) setBalance(data.balance);
    } catch {}
  };

  const loadInventory = async () => {
    setLoading(true);
    setSteamPrices({});
    try {
      const user = await getStoredUser();
      if (!user?.steamId) return;
      const data = await fetchInventory(user.steamId);
      if (data.success) setItems((data.items || []).map(mapSteamItem));
    } catch (err) {
      console.log('❌ loadInventory error:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapSteamItem = (item) => {
    const name = item.market_hash_name || item.name || '';
    const parts = name.split('|');
    const itemId = item.assetid || item.assetId || item.id || Math.random().toString();
    return {
      id: itemId, assetId: itemId, name,
      weapon: parts[0]?.trim() || 'Unknown',
      skin: parts[1]?.trim().replace(/\(.*\)/, '').trim() || '',
      wear: item.wear || parts[1]?.match(/\((.*?)\)/)?.[1] || null,
      price: item.marketPriceTHB || item.price || 0,
      rarity: item.rarity || 'Mil-Spec Grade',
      rarityColor: item.rarityColor || colors.rarityMilSpec,
      image: item.image || (item.icon_url ? `https://steamcommunity-a.akamaihd.net/economy/image/${item.icon_url}` : null),
      float: item.float ?? null,
      stattrak: item.stattrak || false,
      tradeLock: item.tradeLock || false,
      category: item.category || 'Guns',
      listed: item.listed || false,
    };
  };

  const handlePriceLoaded = useCallback((id, price) => {
    setSteamPrices(prev => ({ ...prev, [id]: price }));
  }, []);

  const filteredItems = useMemo(() => {
    let result = items.filter(i =>
      (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.weapon || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.skin || '').toLowerCase().includes(search.toLowerCase())
    );
    if (activeFilter === 'Trade Lock') result = result.filter(i => i.tradeLock);
    if (activeFilter === 'Sellable') result = result.filter(i => !i.tradeLock && !i.listed);
    if (activeFilter === 'Containers') result = result.filter(i => i.category === 'Cases');
    return result;
  }, [search, activeFilter, items]);

  const totalValue = useMemo(() =>
    items.reduce((sum, item) => sum + (steamPrices[item.id] ?? item.price ?? 0), 0),
    [items, steamPrices]
  );

  const steamLoadedCount = Object.keys(steamPrices).length;

  return (
    <View style={s.container}>
      {/* Layer 1: SVG Background */}
      <View style={StyleSheet.absoluteFill}>
        <SvgXml xml={xmlData} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>

      {/* Layer 2: Gradient Overlay */}
      <LinearGradient
        colors={['rgba(19, 18, 19, 0.7)', 'rgba(0, 0, 0, 0.9)']}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={s.safe} edges={['top']}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>INVENTORY</Text>
          <View style={s.headerRight}>
            <TouchableOpacity onPress={() => { loadInventory(); loadBalance(); }} style={s.iconBtn}>
              <Feather name="refresh-cw" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.iconBtn}>
              <Feather name="user" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Value Banner */}
        <View style={s.bannerWrapper}>
          <View style={s.valueBanner}>
            <LinearGradient
              colors={['rgba(255,255,255,0.05)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.bannerContent}>
              <View>
                <Text style={s.valueLabel}>TOTAL VALUE</Text>
                <View style={s.valuePriceRow}>
                  <Text style={s.valueAmount}>{formatPriceDetailed(totalValue)}</Text>
                  {steamLoadedCount > 0 && steamLoadedCount >= items.length && (
                    <View style={s.liveTag}>
                      <View style={s.liveDotGreen} />
                      <Text style={s.liveTagText}>LIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={s.valueCount}>{items.length} ITEMS</Text>
              </View>
              <View style={s.valueRight}>
                <View style={s.balanceBadge}>
                  <Text style={s.balanceText}>BAL: ฿{balance.toLocaleString()}</Text>
                </View>
                <TouchableOpacity style={s.sellAllBtn} onPress={() => navigation.navigate('Sell')}>
                  <Text style={s.sellAllText}>QUICK SELL</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={s.filterSection}>
          <View style={s.searchBox}>
            <Feather name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={s.searchInput}
              placeholder="SEARCH ITEMS..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f}
                style={[s.filterPill, activeFilter === f && s.filterPillActive]}
                onPress={() => setActiveFilter(activeFilter === f ? null : f)}
              >
                <Text style={[s.filterPillText, activeFilter === f && s.filterPillTextActive]}>
                  {f.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Item Grid */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>SYNCING STEAM DATA...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={i => i.id}
            numColumns={2}
            contentContainerStyle={s.grid}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={8}
            maxToRenderPerBatch={10}
            windowSize={5}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onPress={() => navigation.navigate('ItemDetail', { item })}
                onSell={(it) => navigation.navigate('Sell', { item: it })}
                onPriceLoaded={handlePriceLoaded}
              />
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Feather name="box" size={40} color={colors.textMuted} />
                <Text style={s.emptyText}>NO ITEMS FOUND</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// 4. STYLES
// ==========================================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  headerTitle: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 22, fontStyle: 'italic', letterSpacing: 1 },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },

  bannerWrapper: { paddingHorizontal: 16, paddingBottom: 16 },
  valueBanner: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  bannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  valueLabel: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 1.5 },
  valuePriceRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  valueAmount: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 26 },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8,
    backgroundColor: 'rgba(236, 100, 108, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  liveDotGreen: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  liveTagText: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 9 },
  valueCount: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11 },
  valueRight: { alignItems: 'flex-end', gap: 8 },
  balanceBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  balanceText: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 10 },
  sellAllBtn: { backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  sellAllText: { color: '#000', fontFamily: 'Rajdhani_700Bold', fontSize: 12 },

  filterSection: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, paddingHorizontal: 14, height: 44,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 13, marginLeft: 10 },
  filterRow: { marginTop: 12, gap: 8 },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  filterPillActive: { backgroundColor: 'rgba(236, 100, 108, 0.15)', borderColor: colors.primary },
  filterPillText: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  filterPillTextActive: { color: colors.primary },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 12, letterSpacing: 1.5 },
  grid: { paddingHorizontal: 12, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 12, letterSpacing: 1 },
});

const cs = StyleSheet.create({
  wrapper: { flex: 1, margin: 6 },
  card: {
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  imageBox: { height: 110, alignItems: 'center', justifyContent: 'center' },
  image: { width: '80%', height: '80%', zIndex: 10 },
  stBadge: {
    position: 'absolute', top: 8, left: 8, backgroundColor: '#CF6A32',
    paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, zIndex: 15,
  },
  stText: { color: '#FFF', fontFamily: 'Rajdhani_700Bold', fontSize: 7 },
  lockBadge: {
    position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 5, borderRadius: 4, zIndex: 15,
  },
  listedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    borderRadius: 16,
  },
  listedOverlayInner: {
    alignItems: 'center',
    gap: 6,
  },
  listedOverlayIcon: {
    fontSize: 28,
  },
  listedOverlayText: {
    color: colors.primary,
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    letterSpacing: 3,
  },
  info: { padding: 12, backgroundColor: 'rgba(0,0,0,0.4)' },
  weapon: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 1 },
  skin: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 14, marginTop: 2, fontStyle: 'italic' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  wearBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, borderWidth: 0.5 },
  wear: { color: '#FFF', fontFamily: 'Rajdhani_600SemiBold', fontSize: 8 },
  float: { color: colors.textMuted, fontFamily: 'Rajdhani_500Medium', fontSize: 9 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 18 },
  price: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 15 },
  priceFallback: { color: colors.textSecondary },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  bottomNeonLine: { height: 1.5, width: '100%' },
  sellBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)', marginTop: 4, borderRadius: 8,
    paddingVertical: 10, alignItems: 'center', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.05)',
  },
  sellBtnLocked: { opacity: 0.4 },
  sellBtnText: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1 },
  sellBtnTextMuted: { color: colors.textMuted },
});