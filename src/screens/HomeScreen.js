import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { colors } from "../theme/colors";
import { fetchInventory, getStoredUser } from "../data/api";
import { useFocusEffect } from "@react-navigation/native";
import ItemCard from "../components/ItemCard";

// ==========================================
// 1. DATA CONSTANTS
// ==========================================
const CATEGORIES = [
  { id: "all", label: "ALL ITEMS", icon: "grid" },
  { id: "Knives", label: "KNIVES", icon: "slash" },
  { id: "Gloves", label: "GLOVES", icon: "shield" },
  { id: "Rifles", label: "RIFLES", icon: "target" },
  { id: "Pistols", label: "PISTOLS", icon: "zap" },
];

const PROMOTIONS = [
  { id: '1', title: 'IEM RIO 2026 🇧🇷', subtitle: 'LIVE AT FARMASI ARENA', image: '🏆', color: colors.primary },
  { id: '2', title: 'BLAST RIVALS', subtitle: 'STARTS APRIL 27, 2026', image: '🔥', color: colors.accentRed || '#FF0055' },
];

const MATCHES = [
  { id: '1', team1: 'MOUZ', team2: 'Aurora', status: 'FINISHED', score: '2 - 0', event: 'IEM Rio' },
  { id: '2', team1: 'FaZe', team2: 'BIG', status: 'LIVE', score: '1 - 1', event: 'Rio Group A' },
  { id: '3', team1: 'Vitality', team2: 'G2', status: 'UPCOMING', score: 'VS', event: '21:00' },
];

// ==========================================
// 2. SUB-COMPONENTS
// ==========================================

const TopNavBar = ({ onRefresh, onProfile }) => (
  <View style={styles.navBar}>
    <View style={styles.logoRow}>
      <View style={styles.logoBadge}><Text style={styles.logoLetter}>D</Text></View>
      <Text style={styles.logoText}>DEFUSE <Text style={styles.logoHL}>TH</Text></Text>
    </View>
    <View style={styles.navRight}>
      <TouchableOpacity style={styles.iconBtn} onPress={onRefresh} activeOpacity={0.7}>
        <Feather name="refresh-cw" size={20} color={colors.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={onProfile} activeOpacity={0.85}>
        <Feather name="user" size={20} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  </View>
);

const PromotionCard = ({ promo }) => (
  <TouchableOpacity style={styles.promoCard} activeOpacity={0.9}>
    <BlurView intensity={Platform.OS === 'android' ? 80 : 40} tint="dark" style={StyleSheet.absoluteFill} />
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.01)']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <LinearGradient colors={[promo.color + '40', 'transparent']} style={styles.promoGlow} />
    
    <View style={styles.promoContent}>
      <Text style={styles.promoEmoji}>{promo.image}</Text>
      <View>
        <Text style={[styles.promoTitle, { color: promo.color }]}>{promo.title}</Text>
        <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const MatchCard = ({ match }) => (
  <View style={styles.matchCard}>
    <BlurView intensity={Platform.OS === 'android' ? 60 : 30} tint="dark" style={StyleSheet.absoluteFill} />
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <View style={styles.matchContent}>
      <Text style={[styles.matchStatus, match.status === 'LIVE' && { color: colors.accentRed }]}>
        {match.status === 'LIVE' ? '● LIVE' : match.event}
      </Text>
      <View style={styles.matchTeams}>
        <Text style={styles.teamName}>{match.team1}</Text>
        <Text style={styles.matchScore}>{match.score}</Text>
        <Text style={styles.teamName}>{match.team2}</Text>
      </View>
    </View>
  </View>
);

// ส่วนตัวกรองที่เราต้องการให้ "ติดหนึบ"
const FilterSection = ({ search, setSearch, activeCategory, setActiveCategory }) => (
  <View style={styles.filterSection}>
    <View style={styles.searchContainer}>
      <View style={styles.searchBox}>
        <BlurView intensity={Platform.OS === 'android' ? 60 : 30} tint="dark" style={StyleSheet.absoluteFill} />
        <Feather name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="SEARCH SKINS..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catContent}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.catBtn, activeCategory === cat.id && styles.catBtnActive]}
          onPress={() => setActiveCategory(cat.id)}
          activeOpacity={0.8}
        >
          {activeCategory === cat.id && (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          {activeCategory === cat.id && (
            <LinearGradient
               colors={['rgba(0, 229, 255, 0.2)', 'rgba(0, 229, 255, 0.05)']}
               style={StyleSheet.absoluteFill}
            />
          )}
          <Feather 
            name={cat.icon} 
            size={14} 
            color={activeCategory === cat.id ? colors.primary : colors.textSecondary} 
          />
          <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

// ==========================================
// 3. MAIN SCREEN
// ==========================================

export default function HomeScreen({ navigation }) {
  const [allItems, setAllItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [steamId, setSteamId] = useState(null);
  
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  // --- Effects ---
  useFocusEffect(useCallback(() => { loadUser(); }, []));

  useEffect(() => { if (steamId) loadInventory(); }, [steamId]);

  useEffect(() => { filterItems(); }, [search, activeCategory, allItems]);

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true })
    );
    shimmerAnim.setValue(-1);
    loop.start();
    return () => loop.stop();
  }, [loading, shimmerAnim]);

  // --- API Methods ---
  const loadUser = async () => {
    try {
      const user = await getStoredUser();
      if (user?.steamId) setSteamId(user.steamId);
    } catch (e) {
      console.error("Error loading user:", e);
    } finally {
      if(!steamId) setLoading(false);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await fetchInventory(steamId);
      if (data.success) setAllItems(data.items || []);
    } catch(e) {
      console.error("Error fetching inventory:", e);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let result = allItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => i.weapon?.toLowerCase().includes(q) || i.skin?.toLowerCase().includes(q));
    }
    if (activeCategory !== "all") {
      result = result.filter(i => i.category === activeCategory);
    }
    setFiltered(result);
  };

  // --- Render Helpers ---
  const renderLoading = () => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [-1, 1], outputRange: ['-100%', '100%'],
    });

    return (
      <View style={styles.loadingWrapper}>
        <Text style={styles.loadingText}>SYNCING DATABASE...</Text>
        {[0, 1, 2].map((key) => (
          <View key={key} style={styles.shimmerCard}>
            <Animated.View style={[styles.shimmerBar, { transform: [{ translateX: shimmerTranslate }] }]} />
          </View>
        ))}
      </View>
    );
  };

  // renderHeader ตอนนี้จะเหลือแค่ Promo กับ Matches ที่พร้อมจะเลื่อนหายไปตอนไถจอ
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.sectionTitle}>FEATURED HIGHLIGHTS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoScroll}>
        {PROMOTIONS.map(promo => <PromotionCard key={promo.id} promo={promo} />)}
      </ScrollView>

      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>PRO MATCHES</Text>
        <TouchableOpacity activeOpacity={0.7}><Text style={styles.viewAllText}>VIEW ALL</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.matchScroll}>
        {MATCHES.map(match => <MatchCard key={match.id} match={match} />)}
      </ScrollView>
    </View>
  );

  // --- Main Render ---
  return (
    <View style={styles.container}>
      {/* Background Ambience */}
      <View style={styles.ambientGlowLarge} />
      <View style={styles.ambientGlowAccent} />
      <LinearGradient colors={['#131213', '#000000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safe} edges={["top"]}>
        
        {/* ==========================================
            ส่วนนี้จะ ติดหนึบตลอดกาล ไม่ขยับไปไหน
            ========================================== */}
        <TopNavBar 
          onRefresh={loadInventory} 
          onProfile={() => navigation.navigate("Profile")} 
        />

        <FilterSection 
          search={search} setSearch={setSearch} 
          activeCategory={activeCategory} setActiveCategory={setActiveCategory} 
        />
        
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>{filtered.length} ITEMS FOUND</Text>
        </View>

        {/* ==========================================
            ส่วนนี้คือ FlatList ที่สามารถไถขึ้น-ลงได้อย่างอิสระ
            ========================================== */}
        {loading ? renderLoading() : (
          <FlatList
            ListHeaderComponent={renderHeader} 
            data={filtered}
            keyExtractor={(item, idx) => item.id || String(idx)}
            numColumns={2}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ItemCard item={item} onPress={() => navigation.navigate("ItemDetail", { item })} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// ==========================================
// 4. STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  
  navBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoBadge: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  logoLetter: { color: "#000", fontFamily: 'Rajdhani_700Bold', fontSize: 18 },
  logoText: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 20, fontStyle: 'italic', letterSpacing: 1 },
  logoHL: { color: colors.primary },
  navRight: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  headerContainer: { paddingBottom: 10 },
  sectionTitle: { 
    color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 13, 
    fontStyle: 'italic', marginTop: 10, marginBottom: 16, paddingHorizontal: 20, letterSpacing: 1.5 
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  viewAllText: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, marginTop: 8 },

  promoScroll: { paddingLeft: 20, paddingRight: 10, gap: 16 },
  promoCard: {
    width: 280, borderRadius: 20, 
    borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.12)', 
    position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(7, 11, 20, 0.3)',
  },
  promoContent: { flexDirection: 'row', padding: 18, alignItems: 'center', zIndex: 10 },
  promoGlow: { position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: 60, opacity: 0.8 },
  promoEmoji: { fontSize: 26, marginRight: 16 },
  promoTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 16, fontStyle: 'italic' },
  promoSubtitle: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  matchScroll: { paddingLeft: 20, paddingRight: 10, gap: 12, marginBottom: 20 },
  matchCard: {
    width: 180, borderRadius: 16, 
    borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(7, 11, 20, 0.3)',
  },
  matchContent: { padding: 16, zIndex: 10 },
  matchStatus: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  matchTeams: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamName: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 14, flex: 1, textAlign: 'center' },
  matchScore: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 13, paddingHorizontal: 10 },

  filterSection: { marginTop: 15, paddingBottom: 5 }, 
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 }, 
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: 'rgba(7, 11, 20, 0.4)',
    borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)', 
    height: 52, overflow: 'hidden', position: 'relative'
  },
  searchIcon: { paddingLeft: 16, zIndex: 10 },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 15, paddingHorizontal: 12, zIndex: 10 },

  catContent: { paddingHorizontal: 20, gap: 10, marginBottom: 10 }, 
  catBtn: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 25, backgroundColor: 'rgba(7, 11, 20, 0.4)', 
    borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 44, position: 'relative', overflow: 'hidden'
  },
  catBtnActive: { borderColor: colors.primary },
  catLabel: { color: colors.textSecondary, fontFamily: 'Rajdhani_700Bold', fontSize: 12, marginLeft: 10, zIndex: 10 },
  catLabelActive: { color: colors.primary },

  resultRow: { paddingHorizontal: 20, marginBottom: 10 },
  resultText: { color: colors.textMuted, fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1.2 },

  loadingWrapper: { flex: 1, padding: 20 },
  shimmerCard: {
    width: '100%', height: 120, borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shimmerBar: { width: '40%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  loadingText: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 14, marginBottom: 20, textAlign: 'center', letterSpacing: 2 },

  ambientGlowLarge: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(0, 229, 255, 0.08)', top: -80, left: -40,
  },
  ambientGlowAccent: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255, 0, 85, 0.08)', bottom: 40, right: -40,
  },

  grid: { paddingHorizontal: 12, paddingBottom: 100 },
});