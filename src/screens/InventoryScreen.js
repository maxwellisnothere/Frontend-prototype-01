import { fetchInventory, getStoredUser, fetchBalance } from '../data/api';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';

const BASE_URL = 'https://defuse-th-backend-main.onrender.com';
const FILTERS  = ['Sellable', 'Trade Lock', 'Containers'];

// ✅ ฟังก์ชัน format ราคาใหม่ รองรับทศนิยม 2 ตำแหน่ง
const formatPriceDetailed = (price) => {
  if (price == null) return "฿0.00";
  return `฿${price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const priceMemCache = new Map();
const PRICE_CACHE_TTL = 5 * 60 * 1000; 

async function fetchSteamPrice(itemName) {
  if (!itemName || itemName.trim() === '') return null;
  const cached = priceMemCache.get(itemName);
  if (cached && Date.now() - cached.ts < PRICE_CACHE_TTL) return cached;
  
  try {
    const res  = await fetch(`${BASE_URL}/inventory/price/${encodeURIComponent(itemName)}`);
    const json = await res.json();
    
    if (json.success && json.thb > 0) {
      const result = {
        lowestThb: json.thb,
        lowestUsd: json.usd,
        ts: Date.now(),
      };
      priceMemCache.set(itemName, result);
      return result;
    }
  } catch (err) {
    console.log("❌ Fetch price error:", err);
  }
  return null;
}

const ItemCard = ({ item, onSell, onPress, onPriceLoaded }) => {
  const [steamThb, setSteamThb]       = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(true);
  const mountedRef = useRef(true);

  const itemName = item.wear
    ? `${item.weapon} | ${item.skin} (${item.wear})`
    : item.name || '';

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
      <TouchableOpacity style={cs.card} onPress={onPress} activeOpacity={0.85}>
        <View style={[cs.rarityBar, { backgroundColor: item.rarityColor || '#8847FF' }]} />
        <View style={cs.imageBox}>
          <Image source={{ uri: item.image }} style={cs.image} resizeMode="contain" />
          {item.stattrak && <View style={cs.stBadge}><Text style={cs.stText}>StatTrak™</Text></View>}
          {item.listed && <View style={cs.listedOverlay}><Text style={cs.listedOverlayText}>LISTED</Text></View>}
          {item.tradeLock && <View style={cs.lockBadge}><Text style={cs.lockText}>🔒</Text></View>}
        </View>
        <View style={cs.info}>
          <Text style={cs.weapon} numberOfLines={1}>{item.weapon}</Text>
          <Text style={cs.skin} numberOfLines={1}>{item.skin}</Text>
          <View style={cs.detailRow}>
            {item.wear && (
              <Text style={cs.wear}>
                {item.wear === 'Factory New' ? 'FN'
                  : item.wear === 'Minimal Wear' ? 'MW'
                  : item.wear === 'Field-Tested' ? 'FT'
                  : item.wear === 'Well-Worn' ? 'WW'
                  : item.wear === 'Battle-Scarred' ? 'BS'
                  : item.wear}
              </Text>
            )}
            {item.float != null && <Text style={cs.float}>{item.float.toFixed(4)}</Text>}
          </View>

          <View style={cs.priceRow}>
            {loadingPrice ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                {/* ✅ ใช้ formatPriceDetailed โชว์ทศนิยม 2 ตำแหน่ง */}
                <Text style={[cs.price, !hasSteam && cs.priceFallback]}>
                  {formatPriceDetailed(displayPrice)}
                </Text>
                {hasSteam && <View style={cs.liveDot} />}
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[cs.sellBtn, item.tradeLock && cs.sellBtnLocked, item.listed && cs.sellBtnListed]}
        disabled={item.tradeLock}
        onPress={() => !item.tradeLock && onSell(item)}
      >
        <Text style={cs.sellBtnText}>
          {item.tradeLock ? '🔒 LOCKED' : item.listed ? '✅ LISTED' : 'SELL'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function InventoryScreen({ navigation }) {
  const [items,        setItems]        = useState([]);
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [balance,      setBalance]      = useState(0);
  const [loading,      setLoading]      = useState(true);

  const [steamPrices, setSteamPrices] = useState({});

  useFocusEffect(
    React.useCallback(() => {
      loadInventory();
      loadBalance();
    }, [])
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
      if (!user?.steamId) { setLoading(false); return; }

      const data = await fetchInventory(user.steamId);
      if (data.success) {
        const mapped = (data.items || []).map(mapSteamItem);
        setItems(mapped);
      }
    } catch (err) {
      console.log('❌ loadInventory error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const mapSteamItem = (item) => {
    const name  = item.market_hash_name || item.name || '';
    const parts = name.split('|');
    const itemId = item.assetid || item.assetId || item.id || Math.random().toString();

    return {
      id:          itemId,
      assetId:     itemId,
      name,
      weapon:      parts[0]?.trim() || 'Unknown',
      skin:        parts[1]?.trim().replace(/\(.*\)/, '').trim() || '',
      wear:        item.wear || extractWear(parts[1] || ''),
      
      // ✅ จุดไคลแมกซ์: ดึงราคามาจาก marketPriceTHB ให้ถูกต้อง 
      price:       item.marketPriceTHB || item.price || 0,
      priceUSD:    item.marketPriceUSD || 0, // ส่ง USD ไปให้หน้า Detail ด้วย
      
      rarity:      item.rarity || 'Mil-Spec Grade', 
      rarityColor: item.rarityColor || '#8847FF',
      image:
        item.image ||
        (item.icon_url
          ? `https://steamcommunity-a.akamaihd.net/economy/image/${item.icon_url}`
          : null),
      float:     item.float ?? null,
      stattrak:  item.stattrak || false,
      tradeLock: item.tradeLock || false,
      category:  item.category || 'Guns',
      listed:    item.listed || false,
    };
  };

  const extractWear = (str) => {
    const m = str.match(/\((.*?)\)/);
    return m ? m[1] : null;
  };

  const handlePriceLoaded = (id, price) => {
    setSteamPrices(prev => ({ ...prev, [id]: price }));
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(i =>
      (i.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.weapon || '').toLowerCase().includes(search.toLowerCase()) ||
      (i.skin || '').toLowerCase().includes(search.toLowerCase())
    );
    if (activeFilter === 'Trade Lock') result = result.filter(i => i.tradeLock);
    if (activeFilter === 'Sellable')   result = result.filter(i => !i.tradeLock && !i.listed);
    if (activeFilter === 'Containers') result = result.filter(i => i.category === 'Cases');
    return result;
  }, [search, activeFilter, items]);

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => {
      const steam = steamPrices[item.id];
      return sum + (steam ?? item.price ?? 0);
    }, 0);
  }, [items, steamPrices]);

  const steamLoadedCount = Object.keys(steamPrices).length;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Inventory</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => { loadInventory(); loadBalance(); }} style={s.refreshBtn}>
            <Text style={{ fontSize: 18 }}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.refreshBtn}>
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={s.refreshBtn}>
            <Text style={{ fontSize: 22 }}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.valueBanner}>
        <View>
          <Text style={s.valueLabel}>TOTAL VALUE</Text>
          <View style={s.valuePriceRow}>
            {/* ✅ อัปเดต Total Value เป็นทศนิยมด้วย */}
            <Text style={s.valueAmount}>{formatPriceDetailed(totalValue)}</Text>
            {steamLoadedCount < items.length && items.length > 0 && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
            )}
            {steamLoadedCount > 0 && steamLoadedCount >= items.length && (
              <View style={s.liveTag}>
                <View style={s.liveDotGreen} />
                <Text style={s.liveTagText}>Steam</Text>
              </View>
            )}
          </View>
          <Text style={s.valueCount}>
            {items.length} items
            {steamLoadedCount > 0 && (
              <Text style={{ color: colors.textMuted }}>  •  โหลดราคา {steamLoadedCount}/{items.length}</Text>
            )}
          </Text>
        </View>
        <View style={s.valueRight}>
          <TouchableOpacity style={s.sellAllBtn} onPress={() => navigation.navigate('Sell')}>
            <Text style={s.sellAllText}>💰 วางขาย</Text>
          </TouchableOpacity>
          <View style={s.balanceBadge}>
            <Text style={s.balanceText}>Balance: ฿{balance.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="ค้นหา..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterPill, activeFilter === f && s.filterPillActive]}
            onPress={() => setActiveFilter(activeFilter === f ? null : f)}
          >
            <Text style={[s.filterPillText, activeFilter === f && s.filterPillTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>กำลังโหลด inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={i => i.id}
          numColumns={2}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => navigation.navigate('ItemDetail', { item })}
              onSell={(item) => navigation.navigate('Sell', { item })}
              onPriceLoaded={handlePriceLoaded}
            />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyText}>ไม่พบ items</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refreshBtn: { padding: 4 },

  valueBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  valueLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  valuePriceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  valueAmount: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  liveTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#22c55e20', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8,
    borderWidth: 1, borderColor: '#22c55e44',
  },
  liveDotGreen: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#22c55e' },
  liveTagText: { color: '#22c55e', fontSize: 9, fontWeight: '700' },
  valueCount: { color: colors.textSecondary, fontSize: 12 },
  valueRight: { alignItems: 'flex-end', gap: 8 },
  sellAllBtn: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  sellAllText: { color: '#000', fontSize: 12, fontWeight: '900' },
  balanceBadge: {
    backgroundColor: colors.accentGreen + '22', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.accentGreen,
  },
  balanceText: { color: colors.accentGreen, fontSize: 10, fontWeight: '600' },

  searchRow: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceElevated, borderRadius: 10,
    paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.textPrimary, height: 40, fontSize: 14 },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.cardBg,
  },
  filterPillActive: { backgroundColor: colors.primary + '22', borderColor: colors.primary },
  filterPillText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: colors.primary, fontWeight: '700' },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  grid: { padding: 8, paddingBottom: 30 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 44, marginBottom: 12, opacity: 0.4 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});

const cs = StyleSheet.create({
  wrapper: { flex: 1, margin: 4 },
  card: {
    backgroundColor: colors.cardBg, borderRadius: 10,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
  },
  rarityBar: { height: 3 },
  imageBox: {
    height: 100, backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  stBadge: {
    position: 'absolute', top: 4, left: 4,
    backgroundColor: '#CF6A32', borderRadius: 3,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  stText: { color: '#fff', fontSize: 7, fontWeight: '800' },
  lockBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  lockText: { fontSize: 10 },
  listedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(76,175,80,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  listedOverlayText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  info: { padding: 8 },
  weapon: { color: colors.textMuted, fontSize: 9, fontWeight: '600', marginBottom: 1 },
  skin: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 3 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  wear: {
    color: colors.textMuted, fontSize: 9, fontWeight: '600',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3,
  },
  float: { color: colors.textMuted, fontSize: 9 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 20 },
  price: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  priceFallback: { color: colors.textMuted },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#22c55e' },
  sellBtn: {
    backgroundColor: colors.accentGreen, paddingVertical: 8, alignItems: 'center',
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
  },
  sellBtnLocked: { backgroundColor: colors.surfaceElevated },
  sellBtnListed:  { backgroundColor: colors.accentGreen + '44' },
  sellBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});