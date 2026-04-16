import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, RefreshControl, Image, ScrollView, Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { colors } from "../theme/colors";
import FilterModal, { DEFAULT_FILTERS } from "../components/FilterModal";
import { fetchListings } from "../data/api"; 
import { useBalance } from "../context/BalanceContext";

// ─── Float & Wear helpers ────────────────────────────────────
const WEAR_TIERS = [
  { label: "Factory New",    min: 0.00, max: 0.07, color: "#4ade80" },
  { label: "Minimal Wear",   min: 0.07, max: 0.15, color: "#a3e635" },
  { label: "Field-Tested",   min: 0.15, max: 0.38, color: "#facc15" },
  { label: "Well-Worn",      min: 0.38, max: 0.45, color: "#fb923c" },
  { label: "Battle-Scarred", min: 0.45, max: 1.00, color: "#f87171" },
];

const getWearColor = (wearLabel) => {
  const tier = WEAR_TIERS.find((t) => t.label === wearLabel);
  return tier ? tier.color : "#888";
};

const getWearFromFloat = (f) => WEAR_TIERS.find((t) => f >= t.min && f < t.max) || WEAR_TIERS[4];

const generateFloat = () => {
  const r = Math.random();
  if (r < 0.10) return parseFloat((Math.random() * 0.07).toFixed(4));
  if (r < 0.30) return parseFloat((0.07 + Math.random() * 0.08).toFixed(4));
  if (r < 0.65) return parseFloat((0.15 + Math.random() * 0.23).toFixed(4));
  if (r < 0.80) return parseFloat((0.38 + Math.random() * 0.07).toFixed(4));
  return parseFloat((0.45 + Math.random() * 0.55).toFixed(4));
};

const enrichItem = (item) => {
  const hasFloat = item.float != null;
  const hasWear  = item.wear  != null && item.wear !== "";

  if (hasFloat) {
    const tier = getWearFromFloat(item.float);
    return { ...item, wear: tier.label, wearColor: tier.color };
  }
  if (hasWear) {
    return { ...item, float: null, wearColor: getWearColor(item.wear) };
  }
  const floatVal = generateFloat();
  const tier     = getWearFromFloat(floatVal);
  return { ...item, float: floatVal, wear: tier.label, wearColor: tier.color };
};

const CATEGORIES = [
  { id: "", label: "ALL", icon: "grid" },
  { id: "Rifles", label: "RIFLES", icon: "target" },
  { id: "Pistols", label: "PISTOLS", icon: "zap" },
  { id: "Knives", label: "KNIVES", icon: "slash" },
  { id: "Gloves", label: "GLOVES", icon: "shield" },
  { id: "SMGs", label: "SMGs", icon: "wind" },
  { id: "Heavy", label: "HEAVY", icon: "anchor" },
];

// ==========================================
// SUB-COMPONENTS
// ==========================================
const BloomGlow = ({ color }) => (
  <View style={StyleSheet.absoluteFill}>
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient colors={[`${color}15`, 'transparent']} style={[cs.glowLayer, { width: 140, height: 140, borderRadius: 70 }]} />
      <LinearGradient colors={[`${color}30`, 'transparent']} style={[cs.glowLayer, { width: 90, height: 90, borderRadius: 45 }]} />
      <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
    </View>
  </View>
);

const ItemCard = ({ item, onPress }) => {
  const rarityColor = item.rarityColor || colors.rarityMilSpec;
  
  return (
    <TouchableOpacity style={cs.card} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']} style={StyleSheet.absoluteFill} />
      
      <View style={cs.imageBox}>
        <BloomGlow color={rarityColor} />
        {item.image ? (
          <Image source={{ uri: item.image }} style={cs.image} resizeMode="contain" />
        ) : (
          <Feather name="box" size={40} color={colors.textMuted} style={{ zIndex: 10 }} />
        )}
      </View>
      
      <View style={cs.info}>
        <Text style={cs.weapon} numberOfLines={1}>{item.weapon}</Text>
        <Text style={cs.skin} numberOfLines={1}>{item.skin}</Text>
        
        <View style={cs.detailRow}>
          {item.wear && (
            <View style={[cs.wearBadge, { borderColor: `${rarityColor}40` }]}>
               <Text style={cs.wearText}>{item.wear.split('-').map(w => w[0]).join('').toUpperCase().substring(0,2)}</Text>
            </View>
          )}
          {item.float !== undefined && (
            <Text style={cs.floatText}>{Number(item.float).toFixed(4)}</Text>
          )}
        </View>

        <Text style={cs.price}>
          ฿{(item.listingPrice || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        {item.sellerName && <Text style={cs.seller}>Listed by {item.sellerName}</Text>}
      </View>

      <LinearGradient
        colors={['transparent', rarityColor, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={cs.bottomNeonLine}
      />
    </TouchableOpacity>
  );
};

// ==========================================
// MAIN SCREEN
// ==========================================
export default function StoreScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const { balance: ctxBalance, loadBalance } = useBalance();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const activeFilterCount =
    filters.rarities.length + filters.wears.length +
    (filters.weaponType ? 1 : 0) + (filters.priceMin ? 1 : 0) + (filters.priceMax ? 1 : 0) + (filters.sort ? 1 : 0);

  const filteredItems = useMemo(() => {
    let result = [...items];
    if (search) {
      result = result.filter(i => (i.weapon || "").toLowerCase().includes(search.toLowerCase()) || (i.skin || "").toLowerCase().includes(search.toLowerCase()));
    }
    if (selectedCategory) result = result.filter(i => (i.category || i.type || "").toLowerCase().includes(selectedCategory.toLowerCase()));
    if (filters.rarities.length > 0) result = result.filter((i) => filters.rarities.includes(i.rarity));
    if (filters.wears.length > 0) result = result.filter((i) => filters.wears.includes(i.wear));
    if (filters.weaponType) result = result.filter((i) => (i.category || i.type || "").toLowerCase().includes(filters.weaponType.toLowerCase()));

    const minP = parseFloat(filters.priceMin);
    const maxP = parseFloat(filters.priceMax);
    if (!isNaN(minP)) result = result.filter((i) => (i.listingPrice || 0) >= minP);
    if (!isNaN(maxP)) result = result.filter((i) => (i.listingPrice || 0) <= maxP);

    if (filters.sort === "price_asc") result.sort((a, b) => (a.listingPrice || 0) - (b.listingPrice || 0));
    else if (filters.sort === "price_desc") result.sort((a, b) => (b.listingPrice || 0) - (a.listingPrice || 0));
    else if (filters.sort === "float_asc") result.sort((a, b) => (a.float ?? 1) - (b.float ?? 1));
    else if (filters.sort === "float_desc") result.sort((a, b) => (b.float ?? 0) - (a.float ?? 0));

    return result;
  }, [items, filters, search, selectedCategory]);

  useEffect(() => { setBalance(ctxBalance); }, [ctxBalance]);
  useEffect(() => { loadBalance(); loadData(); }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await fetchListings();
      if (data.success) {
        setItems(data.listings.map((l) => enrichItem({ ...l.item, listingId: l.listingId || l._id, listingPrice: l.price, sellerName: l.sellerName || "Unknown" })));
        setTotal(data.total || data.listings.length);
      }
    } catch (err) { Alert.alert("Error", "ไม่สามารถโหลดข้อมูลได้: " + err.message); } 
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleSearch = () => setSearch(searchInput);

  return (
    <View style={s.container}>
      <LinearGradient colors={[colors.background, '#000000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>MARKETPLACE</Text>
          <View style={s.headerRight}>
            <View style={s.balanceBadge}>
              <Text style={s.balanceText}>BAL: ฿{balance.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]} onPress={() => setFilterVisible(true)}>
              <Feather name="sliders" size={16} color={activeFilterCount > 0 ? colors.primary : colors.textPrimary} />
              {activeFilterCount > 0 && (
                <View style={s.filterBadge}><Text style={s.filterBadgeText}>{activeFilterCount}</Text></View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => loadData(true)} style={s.iconBtn}>
              <Feather name="refresh-cw" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Categories */}
        <View style={s.filterSection}>
          <View style={s.searchRow}>
            <View style={s.searchBox}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <Feather name="search" size={16} color={colors.textMuted} style={s.searchIcon} />
              <TextInput
                style={s.searchInput}
                placeholder="SEARCH MARKET..."
                placeholderTextColor={colors.textMuted}
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchInput.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchInput(""); setSearch(""); }} style={{ paddingRight: 10 }}>
                  <Feather name="x" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catContent}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[s.catBtn, selectedCategory === cat.id && s.catBtnActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                {selectedCategory === cat.id && <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />}
                {selectedCategory === cat.id && <LinearGradient colors={['rgba(236, 100, 108, 0.2)', 'transparent']} style={StyleSheet.absoluteFill} />}
                
                <Feather name={cat.icon} size={12} color={selectedCategory === cat.id ? colors.primary : colors.textSecondary} />
                <Text style={[s.catText, selectedCategory === cat.id && s.catTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={s.resultRow}>
          <Text style={s.resultText}>
            {activeFilterCount > 0 || search || selectedCategory ? `FOUND ${filteredItems.length} ITEMS` : `TOTAL ${items.length} ITEMS FOR SALE`}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
              <Text style={s.clearFilterText}>CLEAR FILTERS ✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Items Grid */}
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>SYNCING MARKET DATA...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(i, idx) => i.listingId || i.id || String(idx)}
            numColumns={2}
            contentContainerStyle={s.grid}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={colors.primary} />}
            renderItem={({ item }) => (
              <ItemCard item={item} onPress={() => navigation.navigate("ItemDetail", { item: { ...item, price: item.listingPrice }})} />
            )}
            ListEmptyComponent={
              <View style={s.empty}>
                <Feather name="inbox" size={40} color={colors.textMuted} />
                <Text style={s.emptyText}>NO LISTINGS FOUND</Text>
              </View>
            }
          />
        )}

        <FilterModal visible={filterVisible} onClose={() => setFilterVisible(false)} filters={filters} onApply={(newFilters) => setFilters(newFilters)} />
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 20, fontStyle: 'italic', letterSpacing: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { padding: 4 },
  
  balanceBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' },
  balanceText: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 10 },
  
  filterBtn: { padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', position: "relative", backgroundColor: 'rgba(255,255,255,0.05)' },
  filterBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(236, 100, 108, 0.15)' },
  filterBadge: { position: "absolute", top: -6, right: -6, backgroundColor: colors.primary, borderRadius: 10, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center" },
  filterBadgeText: { color: "#000", fontFamily: 'Rajdhani_700Bold', fontSize: 9 },
  
  filterSection: { paddingHorizontal: 16, paddingBottom: 10 },
  searchRow: { marginBottom: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, height: 44, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  searchIcon: { paddingLeft: 14, zIndex: 10 },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 13, paddingHorizontal: 10, zIndex: 10 },
  
  catContent: { gap: 8 },
  catBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(7, 11, 20, 0.4)', borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' },
  catBtnActive: { borderColor: colors.primary },
  catText: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, letterSpacing: 0.5, marginLeft: 6, zIndex: 10 },
  catTextActive: { color: colors.primary },

  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10 },
  resultText: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 10, letterSpacing: 1 },
  clearFilterText: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 10, letterSpacing: 0.5 },
  
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 80 },
  loadingText: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 12, letterSpacing: 1.5 },
  grid: { padding: 12, paddingBottom: 100 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyText: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 12, letterSpacing: 1 },
});

const cs = StyleSheet.create({
  card: { flex: 1, margin: 6, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(76, 44, 52, 0.2)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', position: 'relative' },
  imageBox: { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glowLayer: { position: 'absolute' },
  image: { width: '80%', height: '80%', zIndex: 10 },
  info: { padding: 12, backgroundColor: 'rgba(0,0,0,0.3)' },
  weapon: { color: colors.textSecondary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 9, letterSpacing: 1 },
  skin: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 14, marginTop: 2, fontStyle: 'italic' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  wearBadge: { paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, borderWidth: 0.5 },
  wearText: { color: '#FFF', fontFamily: 'Rajdhani_600SemiBold', fontSize: 8 },
  floatText: { color: colors.textMuted, fontFamily: 'Rajdhani_500Medium', fontSize: 9 },
  price: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 15 },
  seller: { color: colors.textMuted, fontFamily: 'Rajdhani_500Medium', fontSize: 9, marginTop: 4, fontStyle: 'italic' },
  bottomNeonLine: { height: 1.5, width: '100%' },
});