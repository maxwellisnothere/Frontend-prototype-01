import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient"; // เพิ่มการไล่สีเพื่อความเนียน
import { colors } from "../theme/colors";
import { fetchInventory, getStoredUser } from "../data/api";
import { useFocusEffect } from "@react-navigation/native";
import ItemCard from "../components/ItemCard";

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

export default function HomeScreen({ navigation }) {
  const [allItems, setAllItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [steamId, setSteamId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, []),
  );

  useEffect(() => {
    if (steamId) loadInventory();
  }, [steamId]);

  useEffect(() => {
    filterItems();
  }, [search, activeCategory, allItems]);

  const loadUser = async () => {
    try {
      const user = await getStoredUser();
      if (user?.steamId) setSteamId(user.steamId);
      else setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await fetchInventory(steamId);
      if (data.success) setAllItems(data.items || []);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let result = [...allItems];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i => 
        i.weapon?.toLowerCase().includes(q) || i.skin?.toLowerCase().includes(q)
      );
    }
    if (activeCategory !== "all") {
      result = result.filter(i => i.category === activeCategory);
    }
    setFiltered(result);
  };

  const renderHeader = () => (
    <View style={s.headerContainer}>
      {/* 1. Highlights - Premium Glass Cards */}
      <Text style={s.sectionTitle}>FEATURED HIGHLIGHTS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.promoScroll}>
        {PROMOTIONS.map((promo) => (
          <TouchableOpacity key={promo.id} style={s.promoCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={[s.promoGlow, { backgroundColor: promo.color }]} />
            <Text style={s.promoEmoji}>{promo.image}</Text>
            <View>
              <Text style={[s.promoTitle, { color: promo.color }]}>{promo.title}</Text>
              <Text style={s.promoSubtitle}>{promo.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 2. Pro Matches */}
      <View style={s.titleRow}>
        <Text style={s.sectionTitle}>PRO MATCHES</Text>
        <TouchableOpacity><Text style={s.viewAllText}>VIEW ALL</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.matchScroll}>
        {MATCHES.map((match) => (
          <View key={match.id} style={s.matchCard}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={[s.matchStatus, match.status === 'LIVE' && { color: colors.accentRed || '#FF0055' }]}>
              {match.status === 'LIVE' ? '● LIVE' : match.event}
            </Text>
            <View style={s.matchTeams}>
              <Text style={s.teamName}>{match.team1}</Text>
              <Text style={s.matchScore}>{match.score}</Text>
              <Text style={s.teamName}>{match.team2}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 3. Search & Categories - Unified Container */}
      <View style={s.filterSection}>
        <View style={s.searchBox}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={s.searchInput}
            placeholder="SEARCH SKINS..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catContent}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[s.catBtn, activeCategory === cat.id && s.catBtnActive]}
              onPress={() => setActiveCategory(cat.id)}
            >
              <Feather 
                name={cat.icon} 
                size={14} 
                color={activeCategory === cat.id ? colors.primary : colors.textSecondary} 
              />
              <Text style={[s.catLabel, activeCategory === cat.id && s.catLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.resultRow}>
        <Text style={s.resultText}>{filtered.length} ITEMS FOUND</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Background Gradient สำหรับทั้งหน้าจอ */}
      <LinearGradient
        colors={['#0B0F19', '#070B14', '#05070A']}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* Navbar */}
        <View style={s.navBar}>
          <View style={s.logoRow}>
            <View style={s.logoBadge}><Text style={s.logoLetter}>D</Text></View>
            <Text style={s.logoText}>DEFUSE <Text style={s.logoHL}>TH</Text></Text>
          </View>
          <View style={s.navRight}>
            <TouchableOpacity style={s.iconBtn} onPress={() => loadInventory()}>
              <Feather name="refresh-cw" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate("Profile")}>
              <Feather name="user" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>SYNCING DATABASE...</Text>
          </View>
        ) : !steamId ? (
          <View style={s.empty}>
            <Text style={s.emptyText}>PLEASE LOGIN TO VIEW INVENTORY</Text>
            <TouchableOpacity style={s.loginBtn} onPress={() => navigation.navigate("Login")}>
              <Text style={s.loginBtnText}>CONNECT STEAM</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ListHeaderComponent={renderHeader}
            data={filtered}
            keyExtractor={(item, idx) => item.id || String(idx)}
            numColumns={2}
            contentContainerStyle={s.grid}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onPress={() => navigation.navigate("ItemDetail", { item })}
              />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoBadge: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  logoLetter: { color: "#000", fontFamily: 'Rajdhani_700Bold', fontSize: 16 },
  logoText: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 18, fontStyle: 'italic', letterSpacing: 1 },
  logoHL: { color: colors.primary },
  navRight: { flexDirection: "row", gap: 15 },
  iconBtn: { padding: 4 },

  headerContainer: { paddingBottom: 10 },
  sectionTitle: { 
    color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 13, 
    fontStyle: 'italic', marginTop: 25, marginBottom: 15, paddingHorizontal: 20, letterSpacing: 1.5 
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  viewAllText: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, marginTop: 10 },

  promoScroll: { paddingLeft: 20, paddingRight: 10, gap: 15 },
  promoCard: {
    flexDirection: 'row', width: 280, padding: 15, borderRadius: 16, 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', 
    alignItems: 'center', position: 'relative', overflow: 'hidden'
  },
  promoGlow: { position: 'absolute', top: -30, left: -30, width: 80, height: 80, borderRadius: 40, opacity: 0.1 },
  promoEmoji: { fontSize: 24, marginRight: 15, zIndex: 2 },
  promoTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 15, fontStyle: 'italic' },
  promoSubtitle: { fontFamily: 'Rajdhani_500Medium', fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  matchScroll: { paddingLeft: 20, paddingRight: 10, gap: 12 },
  matchCard: {
    width: 175, padding: 15, borderRadius: 14, 
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative', overflow: 'hidden'
  },
  matchStatus: { fontFamily: 'Rajdhani_700Bold', fontSize: 10, color: colors.textMuted, textAlign: 'center', marginBottom: 10, zIndex: 1 },
  matchTeams: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 },
  teamName: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 14, flex: 1, textAlign: 'center' },
  matchScore: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 12, paddingHorizontal: 8 },

  filterSection: { marginTop: 30 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', 
    height: 48, marginHorizontal: 20, marginBottom: 20
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 14, marginLeft: 10 },

  catContent: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  catBtn: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 25, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  catBtnActive: { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderColor: colors.primary },
  catLabel: { color: colors.textSecondary, fontFamily: 'Rajdhani_700Bold', fontSize: 12, marginLeft: 8 },
  catLabelActive: { color: colors.primary },

  resultRow: { paddingHorizontal: 20, marginBottom: 10 },
  resultText: { color: colors.textMuted, fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1 },

  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 13, marginTop: 15, letterSpacing: 2 },

  grid: { paddingHorizontal: 10, paddingBottom: 100 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 100 },
  emptyText: { color: colors.textMuted, fontFamily: 'Rajdhani_600SemiBold', fontSize: 14, marginBottom: 20 },
  loginBtn: { backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12 },
  loginBtnText: { color: "#000", fontFamily: 'Rajdhani_700Bold', fontSize: 14 },
});