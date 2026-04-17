import React from 'react';
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

const CATEGORIES = [
  { id: "all", label: "ALL", icon: "grid" },
  { id: "Knives", label: "🔪 KNIVES", icon: "slash" },
  { id: "Gloves", label: "🧤 GLOVES", icon: "shield" },
  { id: "Sniper", label: "🎯 SNIPER", icon: "crosshair" },
  { id: "Rifles", label: "🔫 RIFLES", icon: "target" },
  { id: "Pistols", label: "🔫 PISTOLS", icon: "zap" },
  { id: "Cases", label: "📦 CASES", icon: "box" },
];

// 🟢 เพิ่ม props onOpenFilter 
export default function FilterSection({ search, setSearch, activeCategory, setActiveCategory, onOpenFilter }) {
  return (
    <View style={styles.filterSection}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <BlurView intensity={Platform.OS === 'android' ? 60 : 30} tint="dark" style={StyleSheet.absoluteFill} />
          <Feather name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH SKINS IN MARKET..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {/* 🟢 ปุ่มเปิด Filter Modal */}
          <TouchableOpacity style={styles.filterBtn} onPress={onOpenFilter}>
             <Feather name="sliders" size={20} color={colors.primary} />
          </TouchableOpacity>
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
}

const styles = StyleSheet.create({
  filterSection: { marginTop: 15, paddingBottom: 5, zIndex: 10 }, 
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 }, 
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: 'rgba(7, 11, 20, 0.4)',
    borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.1)', 
    height: 52, overflow: 'hidden', position: 'relative'
  },
  searchIcon: { paddingLeft: 16, zIndex: 10 },
  searchInput: { flex: 1, color: colors.textPrimary, fontFamily: 'Rajdhani_600SemiBold', fontSize: 15, paddingHorizontal: 12, zIndex: 10 },
  // 🟢 สไตล์ปุ่ม Filter
  filterBtn: { padding: 12, borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.1)', zIndex: 10 },
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
});