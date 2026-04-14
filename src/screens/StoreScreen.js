import React, { useState, useEffect, useCallback, useMemo } from "react";
  import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Image,
    ScrollView,
  } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { colors } from "../theme/colors";
  import FilterModal, { DEFAULT_FILTERS } from "../components/FilterModal";
  import { fetchItems, fetchListings, buyItem } from "../data/api";
  import { useBalance } from "../context/BalanceContext";

  // ─── Float & Wear helpers ────────────────────────────────────
  const WEAR_TIERS = [
    { label: "Factory New",    min: 0.00, max: 0.07, color: "#4ade80" },
    { label: "Minimal Wear",   min: 0.07, max: 0.15, color: "#a3e635" },
    { label: "Field-Tested",   min: 0.15, max: 0.38, color: "#facc15" },
    { label: "Well-Worn",      min: 0.38, max: 0.45, color: "#fb923c" },
    { label: "Battle-Scarred", min: 0.45, max: 1.00, color: "#f87171" },
  ];

  // แปลง wear string → color (สำหรับ item ที่มี wear แต่ไม่มี float)
  const getWearColor = (wearLabel) => {
    const tier = WEAR_TIERS.find((t) => t.label === wearLabel);
    return tier ? tier.color : "#888";
  };

  const getWearFromFloat = (f) =>
    WEAR_TIERS.find((t) => f >= t.min && f < t.max) || WEAR_TIERS[4];

  // generate float random เฉพาะกรณีไม่มีทั้ง float และ wear
  const generateFloat = () => {
    const r = Math.random();
    if (r < 0.10) return parseFloat((Math.random() * 0.07).toFixed(4));
    if (r < 0.30) return parseFloat((0.07 + Math.random() * 0.08).toFixed(4));
    if (r < 0.65) return parseFloat((0.15 + Math.random() * 0.23).toFixed(4));
    if (r < 0.80) return parseFloat((0.38 + Math.random() * 0.07).toFixed(4));
    return parseFloat((0.45 + Math.random() * 0.55).toFixed(4));
  };

  const enrichItem = (item) => {
    // item จาก items.js / API มี float และ wear อยู่แล้ว
    const hasFloat = item.float != null;
    const hasWear  = item.wear  != null && item.wear !== "";

    if (hasFloat) {
      // มี float → คำนวณ wear จาก float (แม่นยำกว่า string จาก API)
      const tier = getWearFromFloat(item.float);
      return { ...item, wear: tier.label, wearColor: tier.color };
    }

    if (hasWear) {
      // มี wear string แต่ไม่มี float (เช่น Cases) → แปลง wear → color เท่านั้น
      return { ...item, float: null, wearColor: getWearColor(item.wear) };
    }

    // ไม่มีทั้งคู่ → generate float ใหม่
    const floatVal = generateFloat();
    const tier     = getWearFromFloat(floatVal);
    return { ...item, float: floatVal, wear: tier.label, wearColor: tier.color };
  };
  // ────────────────────────────────────────────────────────────


  const CATEGORIES = [
    { id: "", label: "All", icon: "🔫" },
    { id: "Rifles", label: "Rifles", icon: "🎯" },
    { id: "Pistols", label: "Pistols", icon: "💥" },
    { id: "Knives", label: "Knives", icon: "🔪" },
    { id: "Gloves", label: "Gloves", icon: "🧤" },
    { id: "SMGs", label: "SMGs", icon: "🔧" },
    { id: "Heavy", label: "Heavy", icon: "💣" },
    { id: "Equipment", label: "Equipment", icon: "🛡️" },
  ];

  const ItemCard = ({ item, onPress }) => (
    <TouchableOpacity style={cs.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[cs.rarityBar, { backgroundColor: item.rarityColor }]} />
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
        <View style={[cs.rarityBadge, { borderColor: item.rarityColor }]}>
          <Text style={[cs.rarityText, { color: item.rarityColor }]}>
            {item.rarity}
          </Text>
        </View>
        {/* Wear + Float */}
        {item.wear && (
          <View style={cs.wearRow}>
            <View style={[cs.wearDot, { backgroundColor: item.wearColor || "#888" }]} />
            <Text style={[cs.wearText, { color: item.wearColor || "#888" }]}>
              {item.wear}
            </Text>
          </View>
        )}
        {item.float !== undefined && (
          <Text style={cs.floatText}>Float: {Number(item.float).toFixed(4)}</Text>
        )}
        <Text style={cs.price}>
          {item.listingPrice
            ? `฿${item.listingPrice.toLocaleString()}`
            : `฿${item.basePrice?.toLocaleString() || "—"}`}
        </Text>
        {item.sellerName && <Text style={cs.seller}>👤 {item.sellerName}</Text>}
      </View>
    </TouchableOpacity>
  );

  export default function StoreScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [filterVisible, setFilterVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [balance, setBalance] = useState(0);
    const [activeTab, setActiveTab] = useState("database");
    const { balance: ctxBalance, loadBalance } = useBalance();

    // ─── Filter state ────────────────────────────────────────────
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    // นับจำนวน filter ที่ active สำหรับแสดง badge
    const activeFilterCount =
      filters.rarities.length +
      filters.wears.length +
      (filters.weaponType ? 1 : 0) +
      (filters.priceMin   ? 1 : 0) +
      (filters.priceMax   ? 1 : 0) +
      (filters.sort       ? 1 : 0);

    // apply filter + sort กับ items ที่โหลดมาแล้ว (client-side)
    const filteredItems = useMemo(() => {
      let result = [...items];

      if (filters.rarities.length > 0)
        result = result.filter((i) => filters.rarities.includes(i.rarity));

      if (filters.wears.length > 0)
        result = result.filter((i) => filters.wears.includes(i.wear));

      if (filters.weaponType)
        result = result.filter((i) =>
          (i.category || i.type || "").toLowerCase().includes(filters.weaponType.toLowerCase()) ||
          filters.weaponType.toLowerCase().includes((i.category || i.type || "").toLowerCase())
        );

      const minP = parseFloat(filters.priceMin);
      const maxP = parseFloat(filters.priceMax);
      if (!isNaN(minP)) result = result.filter((i) => (i.listingPrice || i.basePrice || i.price || 0) >= minP);
      if (!isNaN(maxP)) result = result.filter((i) => (i.listingPrice || i.basePrice || i.price || 0) <= maxP);

      if (filters.sort === "price_asc")
        result.sort((a, b) => (a.listingPrice || a.basePrice || 0) - (b.listingPrice || b.basePrice || 0));
      else if (filters.sort === "price_desc")
        result.sort((a, b) => (b.listingPrice || b.basePrice || 0) - (a.listingPrice || a.basePrice || 0));
      else if (filters.sort === "float_asc")
        result.sort((a, b) => (a.float ?? 1) - (b.float ?? 1));
      else if (filters.sort === "float_desc")
        result.sort((a, b) => (b.float ?? 0) - (a.float ?? 0));

      return result;
    }, [items, filters]);
    // ────────────────────────────────────────────────────────────

    useEffect(() => {
      setBalance(ctxBalance);
    }, [ctxBalance]);

    useEffect(() => {
      loadBalance();
    }, []);

    useEffect(() => {
      setPage(1);
    }, [search, selectedCategory, activeTab]);

    useEffect(() => {
      loadData();
    }, [page, search, selectedCategory, activeTab]);
    const loadData = async (isRefresh = false) => {
      console.log(
        "📦 [StoreScreen] loadData — tab:",
        activeTab,
        "| cat:",
        selectedCategory,
        "| search:",
        search,
        "| page:",
        page,
      ); // ← เพิ่ม

      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else setLoading(true);

      try {
        if (activeTab === "database") {
          const data = await fetchItems({
            search,
            category: selectedCategory,
            page: isRefresh ? 1 : page,
            limit: 20,
          });
          if (data.success) {
            console.log(
              "✅ [StoreScreen] items loaded:",
              data.items.length,
              "| total:",
              data.total,
            ); // ← เพิ่ม
            if (isRefresh || page === 1) setItems(data.items.map(enrichItem));
            else setItems((prev) => [...prev, ...data.items.map(enrichItem)]);
            setTotal(data.total);
            setTotalPages(data.totalPages);
          }
        } else {
          const data = await fetchListings();
          if (data.success) {
            console.log(
              "✅ [StoreScreen] listings loaded:",
              data.listings.length,
            ); // ← เพิ่ม
            setItems(
              data.listings.map((l) => enrichItem({
                ...l.item,
                listingId: l.listingId,
                listingPrice: l.price,
                sellerName: l.sellerName,
              })),
            );
            setTotal(data.total);
          }
        }
      } catch (err) {
        console.log("❌ [StoreScreen] error:", err.message); // ← เพิ่ม
        Alert.alert("Error", "ไม่สามารถโหลดข้อมูลได้: " + err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    const handleSearch = () => {
      setSearch(searchInput);
      setPage(1);
    };

    const handleBuy = (item) => {
      navigation.navigate("Payment", {
        items: [{ ...item, price: item.listingPrice || item.basePrice }],
      });
    };

    const loadMore = () => {
      if (page < totalPages && !loading) setPage((p) => p + 1);
    };

    return (
      <SafeAreaView style={s.safe} edges={["top"]}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Store</Text>
          <View style={s.headerRight}>
            <View style={s.balanceBadge}>
              <Text style={s.balanceText}>฿{balance.toLocaleString()}</Text>
            </View>
            {/* Filter button */}
            <TouchableOpacity
              style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnActive]}
              onPress={() => setFilterVisible(true)}
            >
              <Text style={s.filterIcon}>⚙️</Text>
              {activeFilterCount > 0 && (
                <View style={s.filterBadge}>
                  <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => loadData(true)}>
              <Text style={{ fontSize: 18 }}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab: Database vs Listings */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, activeTab === "database" && s.tabActive]}
            onPress={() => {
              setActiveTab("database");
              setPage(1);
            }}
          >
            <Text
              style={[s.tabText, activeTab === "database" && s.tabTextActive]}
            >
              🎮 CS2 Items ({activeTab === "database" ? total : "2092"})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, activeTab === "listings" && s.tabActive]}
            onPress={() => {
              setActiveTab("listings");
              setPage(1);
            }}
          >
            <Text
              style={[s.tabText, activeTab === "listings" && s.tabTextActive]}
            >
              🏪 Listings ({activeTab === "listings" ? total : ""})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <View style={s.searchBox}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="ค้นหา เช่น AK-47, Karambit..."
              placeholderTextColor={colors.textMuted}
              value={searchInput}
              onChangeText={setSearchInput}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchInput.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchInput("");
                  setSearch("");
                }}
              >
                <Text style={s.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={s.searchBtn} onPress={handleSearch}>
            <Text style={s.searchBtnText}>ค้นหา</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.catScroll}
          contentContainerStyle={s.catContent}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[s.catBtn, selectedCategory === cat.id && s.catBtnActive]}
              onPress={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
            >
              <Text
                style={[
                  s.catText,
                  selectedCategory === cat.id && s.catTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Result row */}
        <View style={s.resultRow}>
          <Text style={s.resultText}>
            {activeFilterCount > 0
              ? `${filteredItems.length} / ${items.length} items (filtered)`
              : `${total.toLocaleString()} items`}
          </Text>
          {activeFilterCount > 0 ? (
            <TouchableOpacity onPress={() => setFilters(DEFAULT_FILTERS)}>
              <Text style={s.clearFilterText}>ล้าง filter ✕</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.pageText}>หน้า {page}/{totalPages}</Text>
          )}
        </View>

        {/* Items Grid */}
        {loading && page === 1 ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={s.loadingText}>กำลังโหลด CS2 items...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(i, idx) => i.id || String(idx)}
            numColumns={2}
            contentContainerStyle={s.grid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            renderItem={({ item }) => (
              <ItemCard
                item={item}
                onPress={() =>
                  navigation.navigate("ItemDetail", {
                    item: { ...item, price: item.listingPrice || item.basePrice },
                  })
                }
              />
            )}
            ListFooterComponent={
              loading && page > 1 ? (
                <View style={s.loadMoreBox}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>🔍</Text>
                <Text style={s.emptyText}>ไม่พบ items</Text>
              </View>
            }
          />
        )}

        <FilterModal
          visible={filterVisible}
          onClose={() => setFilterVisible(false)}
          filters={filters}
          onApply={(newFilters) => setFilters(newFilters)}
        />
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
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
    filterBtn: {
      padding: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#333",
      position: "relative",
    },
    filterBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + "22" },
    filterIcon: { fontSize: 16 },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: colors.primary,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 3,
    },
    filterBadgeText: { color: "#000", fontSize: 9, fontWeight: "900" },
    clearFilterText: { color: colors.primary, fontSize: 11, fontWeight: "700" },
    balanceBadge: {
      backgroundColor: colors.primary + "22",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: colors.primary + "44",
    },
    balanceText: { color: colors.primary, fontSize: 13, fontWeight: "800" },

    tabRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
    tabTextActive: { color: colors.primary, fontWeight: "700" },

    searchRow: {
      flexDirection: "row",
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceElevated,
      borderRadius: 10,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: { fontSize: 14, marginRight: 6 },
    searchInput: { flex: 1, color: colors.textPrimary, height: 38, fontSize: 13 },
    clearBtn: { color: colors.textMuted, fontSize: 14, padding: 4 },
    searchBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 14,
      justifyContent: "center",
    },
    searchBtnText: { color: "#000", fontSize: 13, fontWeight: "800" },

    // ✅ Category ScrollView styles
    catScroll: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexShrink: 0,
      flexGrow: 0,
    },
    catContent: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    catBtn: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
      flexShrink: 0,
    },
    catBtnActive: {
      backgroundColor: colors.primary + "22",
      borderColor: colors.primary,
    },
    catText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
    catTextActive: { color: colors.primary, fontWeight: "700" },

    resultRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultText: { color: colors.textMuted, fontSize: 11 },
    pageText: { color: colors.textMuted, fontSize: 11 },

    loadingBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingTop: 80,
    },
    loadingText: { color: colors.textSecondary, fontSize: 14 },
    loadMoreBox: { padding: 20, alignItems: "center" },

    grid: { padding: 8, paddingBottom: 30 },
    empty: { alignItems: "center", paddingTop: 80, gap: 12 },
    emptyIcon: { fontSize: 48, opacity: 0.4 },
    emptyText: { color: colors.textMuted, fontSize: 15 },
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
    noImage: { fontSize: 40, opacity: 0.3 },
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
    rarityBadge: {
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    rarityText: { fontSize: 8, fontWeight: "700" },
    wearRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
    wearDot: { width: 6, height: 6, borderRadius: 3 },
    wearText: { fontSize: 8, fontWeight: "700" },
    floatText: { color: "#666", fontSize: 8, marginBottom: 2 },
    price: { color: colors.primary, fontSize: 12, fontWeight: "800" },
    seller: { color: colors.textMuted, fontSize: 9, marginTop: 2 },
  });