import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { fetchInventory, getStoredUser } from "../data/api";
import { useFocusEffect } from "@react-navigation/native"; // เพิ่ม import กลับมา
const CATEGORIES = [
  { id: "all", label: "All", icon: "🔫" },
  { id: "Knives", label: "Knives", icon: "🔪" },
  { id: "Gloves", label: "Gloves", icon: "🧤" },
  { id: "Rifles", label: "Rifles", icon: "🎯" },
  { id: "Pistols", label: "Pistols", icon: "💥" },
  { id: "SMGs", label: "SMGs", icon: "🔧" },
  { id: "Heavy", label: "Heavy", icon: "💣" },
  { id: "Equipment", label: "Equip", icon: "🛡️" },
];

const ItemCard = ({ item, onPress }) => (
  <TouchableOpacity style={cs.card} onPress={onPress} activeOpacity={0.8}>
    <View
      style={[cs.rarityBar, { backgroundColor: item.rarityColor || "#B0C3D9" }]}
    />
    <View style={cs.imageBox}>
      {item.image ? (
        <Image
          source={{ uri: item.image }}
          style={cs.image}
          resizeMode="contain"
        />
      ) : (
        <Text style={cs.noImage}>🔫</Text>
      )}
    </View>
    <View style={cs.info}>
      <Text style={cs.weapon} numberOfLines={1}>
        {item.weapon}
      </Text>
      <Text style={cs.skin} numberOfLines={1}>
        {item.skin}
      </Text>
      <Text style={cs.price}>
        ฿{(item.basePrice || item.price || 0).toLocaleString()}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const [allItems, setAllItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [steamId, setSteamId] = useState(null);

  // useEffect(() => {
  //   loadUser();
  // }, []);
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 HomeScreen focused"); // เพิ่ม
      setSteamId(null);
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
      console.log("🔍 loadUser called, user:", user?.steamId || "null"); // เพิ่ม
      if (user?.steamId) {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`🟢 USER ENTERED APP`);
        console.log(`👤 Name    : ${user.displayName}`);
        console.log(`🆔 SteamId : ${user.steamId}`);
        console.log(`🏷️  Type    : ${user.userType}`);
        console.log(`🕐 Time    : ${new Date().toLocaleString("th-TH")}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        setSteamId(user.steamId);
      } else {
        console.log("⚠️ No user found in storage"); // เพิ่ม
        setLoading(false);
      }
    } catch (e) {
      console.error("❌ loadUser error:", e); // เพิ่ม
      setLoading(false);
    }
  };
  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await fetchInventory(steamId);
      if (data.success) setAllItems(data.items || []);
    } catch (err) {
      console.log("loadInventory error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let result = [...allItems];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.weapon?.toLowerCase().includes(q) ||
          i.skin?.toLowerCase().includes(q),
      );
    }
    if (activeCategory !== "all") {
      result = result.filter((i) => i.category === activeCategory);
    }
    setFiltered(result);
  };

  const handleCategoryPress = (catId) => {
    if (catId === activeCategory) return;
    setActiveCategory(catId);
    setSearch("");
  };

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <View style={s.logoBadge}>
            <Text style={s.logoLetter}>D</Text>
          </View>
          <Text style={s.logoText}>
            DEFUSE <Text style={s.logoHL}>TH</Text>
          </Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn} onPress={() => loadInventory()}>
            <Text style={{ fontSize: 22 }}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => navigation.navigate("Profile")}
          >
            <Text style={{ fontSize: 22 }}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="ค้นหา skins..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text
                style={{ color: colors.textMuted, fontSize: 16, padding: 4 }}
              >
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={s.catContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catBtn, activeCategory === cat.id && s.catBtnActive]}
            onPress={() => handleCategoryPress(cat.id)}
          >
            <Text style={s.catIcon}>{cat.icon}</Text>
            <Text
              style={[
                s.catLabel,
                activeCategory === cat.id && s.catLabelActive,
              ]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result count */}
      <View style={s.resultRow}>
        <Text style={s.resultText}>
          {filtered.length.toLocaleString()} items
          {activeCategory !== "all"
            ? ` · ${CATEGORIES.find((c) => c.id === activeCategory)?.label}`
            : ""}
          {search ? ` · "${search}"` : ""}
        </Text>
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {/* Items Grid */}
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>กำลังโหลด inventory...</Text>
        </View>
      ) : !steamId ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 44, marginBottom: 12 }}>🔐</Text>
          <Text style={s.emptyText}>กรุณาเข้าสู่ระบบก่อน</Text>
          <TouchableOpacity
            style={s.loginBtn}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={s.loginBtnText}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, idx) => item.id || String(idx)}
          numColumns={2}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() =>
                navigation.navigate("ItemDetail", {
                  item: { ...item, price: item.basePrice || item.price || 0 },
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 44, marginBottom: 12 }}>📦</Text>
              <Text style={s.emptyText}>ไม่พบ items ใน inventory</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoLetter: { color: "#000", fontWeight: "900", fontSize: 16 },
  logoText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  logoHL: { color: colors.primary, fontWeight: "900" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { padding: 4 },

  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: colors.textPrimary, height: 40, fontSize: 14 },

  catScroll: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexShrink: 0,
    flexGrow: 0,
  },
  catContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    flexShrink: 0,
  },
  catIcon: { fontSize: 14, marginRight: 5 },
  catLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 0,
  },
  catBtnActive: {
    backgroundColor: colors.primary + "22",
    borderColor: colors.primary,
  },
  catLabelActive: { color: colors.primary, fontWeight: "700" },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultText: { color: colors.textMuted, fontSize: 12 },

  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: { color: colors.textSecondary, fontSize: 14 },

  grid: { padding: 8, paddingBottom: 30 },
  empty: { alignItems: "center", paddingTop: 80 },
  emptyText: { color: colors.textMuted, fontSize: 15, marginBottom: 16 },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  loginBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
});

const cs = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: colors.cardBg,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  rarityBar: { height: 3 },
  imageBox: {
    height: 110,
    backgroundColor: colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: "100%", height: "100%" },
  noImage: { fontSize: 36, opacity: 0.3 },
  info: { padding: 8 },
  weapon: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: "600",
    marginBottom: 1,
  },
  skin: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  price: { color: colors.primary, fontSize: 12, fontWeight: "800" },
});
