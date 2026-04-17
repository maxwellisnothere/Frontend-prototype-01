import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, Animated, FlatList, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import axios from 'axios'; // 🟢 เพิ่ม Axios สำหรับยิง API ตรง
import { colors } from "../theme/colors";

// 🟢 Import Components ที่เราแยกไฟล์ไว้
import TopNavBar from "../components/TopNavBar";
import FilterSection from "../components/FilterSection";
import PromotionCard from "../components/PromotionCard";
import HorizontalCard from "../components/HorizontalCard";
import ItemCard from "../components/ItemCard";
import FilterModal, { DEFAULT_FILTERS } from "../components/FilterModal";

const CATEGORIES = [
  { id: "all", label: "ALL", icon: "grid" },
  { id: "Knives", label: "🔪 KNIVES", icon: "slash" },
  { id: "Gloves", label: "🧤 GLOVES", icon: "shield" },
  { id: "Sniper", label: "🎯 SNIPER", icon: "crosshair" },
  { id: "Rifles", label: "🔫 RIFLES", icon: "target" },
  { id: "Pistols", label: "🔫 PISTOLS", icon: "zap" },
  { id: "Cases", label: "📦 CASES", icon: "box" },
];

const PROMOTIONS = [
  { id: '1', title: 'IEM RIO 2026 🇧🇷', subtitle: 'LIVE AT FARMASI ARENA', image: '🏆', color: colors.primary },
  { id: '2', title: 'BLAST RIVALS', subtitle: 'STARTS APRIL 27, 2026', image: '🔥', color: colors.accentRed || '#FF0055' },
];

export default function HomeScreen({ navigation }) {
  const [marketListings, setMarketListings] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  
  const [filterVisible, setFilterVisible] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState(DEFAULT_FILTERS);

  const [loading, setLoading] = useState(true);
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => { loadData(); }, []);

  useEffect(() => { filterItems(); }, [search, activeCategory, marketListings, advancedFilters]);

  useEffect(() => {
    if (!loading) return;
    const loop = Animated.loop(Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }));
    shimmerAnim.setValue(-1);
    loop.start();
    return () => loop.stop();
  }, [loading, shimmerAnim]);

  // 🔥 จุดที่แก้ไข: ดึงข้อมูลจาก Backend (/items) โดยตรง
  const loadData = async () => {
    setLoading(true);
    try {
      // 🟢 วิ่งไปสูบข้อมูลที่ทำ Local Mirror ไว้แล้ว
      const response = await axios.get('http://10.0.2.2:3000/items');
      
      if (response.data && response.data.success) {
        const cleanItems = response.data.items || [];
        
        // เซ็ตค่าลง State (ใช้ 15 ตัวแรกเป็นเทรนด์)
        setMarketListings(cleanItems);
        setTrendingItems(cleanItems.slice(0, 15));
      }

    } catch(e) { 
      console.error("❌ Error fetching data:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const filterItems = () => {
    let result = marketListings;
    
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(listing => {
        const item = listing.item || listing; 
        return (item.weapon?.toLowerCase().includes(q) || item.skin?.toLowerCase().includes(q) || item.name?.toLowerCase().includes(q));
      });
    }
    
    if (activeCategory !== "all") {
      const searchWord = activeCategory.toLowerCase().replace('s', ''); 
      result = result.filter(listing => {
        const item = listing.item || listing;
        return (item.weapon || "").toLowerCase().includes(searchWord) || (item.category || "").toLowerCase().includes(searchWord) || (item.name || "").toLowerCase().includes(searchWord);
      });
    }
    
    if (advancedFilters.rarities.length > 0) {
      result = result.filter(listing => advancedFilters.rarities.includes((listing.item || listing).rarity));
    }
    if (advancedFilters.wears.length > 0) {
      result = result.filter(listing => advancedFilters.wears.includes((listing.item || listing).wear));
    }
    if (advancedFilters.weaponType) {
      result = result.filter(listing => (listing.item || listing).weapon?.includes(advancedFilters.weaponType));
    }
    if (advancedFilters.priceMin) {
      result = result.filter(listing => (listing.price || listing.basePrice) >= Number(advancedFilters.priceMin));
    }
    if (advancedFilters.priceMax) {
      result = result.filter(listing => (listing.price || listing.basePrice) <= Number(advancedFilters.priceMax));
    }
    
    if (advancedFilters.sort) {
       result = [...result]; 
       if (advancedFilters.sort === "price_asc") result.sort((a, b) => (a.price || a.basePrice) - (b.price || b.basePrice));
       if (advancedFilters.sort === "price_desc") result.sort((a, b) => (b.price || b.basePrice) - (a.price || a.basePrice));
    }
    
    setFilteredListings(result);
  };

  const getListingsByCategory = (categoryName) => {
    const searchWord = categoryName.toLowerCase().replace('s', '');
    return marketListings.filter(listing => {
      const item = listing.item || listing;
      if (!item) return false;
      return (item.weapon || "").toLowerCase().includes(searchWord) || (item.category || "").toLowerCase().includes(searchWord) || (item.name || "").toLowerCase().includes(searchWord);
    });
  };

  const renderLoading = () => {
    const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-100%', '100%'] });
    return (
      <View style={styles.loadingWrapper}>
        <Text style={styles.loadingText}>SYNCING MARKET DATA...</Text>
        {[0, 1, 2].map((key) => (
          <View key={key} style={styles.shimmerCard}>
            <Animated.View style={[styles.shimmerBar, { transform: [{ translateX: shimmerTranslate }] }]} />
          </View>
        ))}
      </View>
    );
  };

  const renderHeader = () => {
    const isSearchingOrFiltering = search.trim() !== "" || activeCategory !== "all" || advancedFilters.rarities.length > 0 || advancedFilters.sort !== "";
    
    if (isSearchingOrFiltering) {
      return (
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>FOUND {filteredListings.length} ITEMS</Text>
        </View>
      );
    }

    return (
      <View style={styles.headerContainer}>
        <Text style={styles.sectionTitle}>FEATURED HIGHLIGHTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {PROMOTIONS.map(promo => <PromotionCard key={promo.id} promo={promo} />)}
        </ScrollView>

        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>📈 MARKET TRENDS</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {trendingItems.length > 0 ? (
            trendingItems.map((item, idx) => (
              <HorizontalCard key={item.id || idx} data={item} isTrend={true} onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })} />
            ))
          ) : ( <Text style={styles.emptyText}>กำลังอัปเดตข้อมูลตลาด...</Text> )}
        </ScrollView>

        {CATEGORIES.filter(c => c.id !== "all").map(category => {
          const categoryListings = getListingsByCategory(category.id).slice(0, 15); 
          if (categoryListings.length === 0) return null;
          return (
            <View key={category.id} style={styles.categoryBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.sectionTitle}>🔥 HOT {category.label}</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveCategory(category.id)}>
                  <Text style={styles.viewAllText}>SEE ALL</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                {categoryListings.map((listing, idx) => (
                  <HorizontalCard 
                    key={listing.listingId || listing.id || idx} 
                    data={listing} 
                    isTrend={false}
                    onPress={() => navigation.navigate("ItemDetail", { item: listing })} 
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}

        <View style={styles.divider} />
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>ALL MARKET LISTINGS</Text>
          <Text style={styles.resultText}>{marketListings.length} ITEMS</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.ambientGlowLarge} />
      <View style={styles.ambientGlowAccent} />
      <LinearGradient colors={['#131213', '#000000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <TopNavBar onRefresh={loadData} onProfile={() => navigation.navigate("Profile")} />
        
        <FilterSection 
           search={search} setSearch={setSearch} 
           activeCategory={activeCategory} setActiveCategory={setActiveCategory} 
           onOpenFilter={() => setFilterVisible(true)}
        />

        {loading ? renderLoading() : (
          <FlatList
            ListHeaderComponent={renderHeader}
            data={filteredListings}
            keyExtractor={(item, idx) => item.listingId || item.id || String(idx)}
            numColumns={2}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ItemCard item={item.item || item} price={item.price || item.basePrice} onPress={() => navigation.navigate("ItemDetail", { item: item })} />
            )}
            ListEmptyComponent={() => (<Text style={styles.emptySearchText}>ไม่มีไอเทมที่ตรงกับการค้นหา</Text>)}
          />
        )}
      </SafeAreaView>

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filters={advancedFilters}
        onApply={(newFilters) => setAdvancedFilters(newFilters)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1 },
  headerContainer: { paddingBottom: 10, paddingTop: 10 },
  sectionTitle: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 13, fontStyle: 'italic', marginBottom: 12, paddingHorizontal: 20, letterSpacing: 1.5 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20, marginTop: 10 },
  viewAllText: { color: colors.primary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 11, marginTop: 8 },
  divider: { height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginVertical: 20, marginHorizontal: 20 },
  horizontalScroll: { paddingLeft: 20, paddingRight: 10, gap: 12, paddingBottom: 15 },
  categoryBlock: { marginTop: 5 },
  gridContainer: { paddingHorizontal: 12, paddingBottom: 100 },
  resultRow: { paddingHorizontal: 20, marginBottom: 15, marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  resultText: { color: colors.textMuted, fontFamily: 'Rajdhani_700Bold', fontSize: 11, letterSpacing: 1.2 },
  emptyText: { color: colors.textMuted, fontFamily: 'Rajdhani_500Medium', fontSize: 12, paddingHorizontal: 20, marginBottom: 20 },
  emptySearchText: { color: colors.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: 'Rajdhani_600SemiBold' },
  loadingWrapper: { flex: 1, padding: 20 },
  shimmerCard: { width: '100%', height: 120, borderRadius: 20, overflow: 'hidden', marginBottom: 16, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)' },
  shimmerBar: { width: '40%', height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.08)' },
  loadingText: { color: colors.primary, fontFamily: 'Rajdhani_700Bold', fontSize: 14, marginBottom: 20, textAlign: 'center', letterSpacing: 2 },
  ambientGlowLarge: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(0, 229, 255, 0.08)', top: -80, left: -40 },
  ambientGlowAccent: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255, 0, 85, 0.08)', bottom: 40, right: -40 },
});