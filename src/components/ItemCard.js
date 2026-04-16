import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { formatPrice } from '../data/items';

export default function ItemCard({ item, onPress, compact = false }) {
  // 1. ป้องกัน Rarity Color ว่าง
  const rarityColor = item?.rarityColor || colors?.rarityMilSpec || '#00E5FF';
  
  // 2. จัดการเรื่องราคาให้ปลอดภัย (Fallback เป็น 0 เสมอ)
  const safePrice = item?.price || item?.basePrice || 0;

  // --- สไตล์แบบการ์ดเล็ก (Recently Viewed) ---
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.compactImageBox}>
          {/* เลเยอร์ 1: Glow ชั้นใน (Tighter Bloom) */}
          <View style={[styles.compactImageGlowInner, { backgroundColor: rarityColor, shadowColor: rarityColor }]} />
          {/* เลเยอร์ 2: Glow ชั้นนอก (Softer Halo) */}
          <View style={[styles.compactImageGlowOuter, { backgroundColor: rarityColor, shadowColor: rarityColor }]} />
          <Image source={{ uri: item?.image }} style={styles.compactImage} resizeMode="contain" />
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactSkin} numberOfLines={1}>{item?.skin || 'Unknown Skin'}</Text>
          <Text style={styles.compactPrice}>{formatPrice(safePrice)}</Text>
        </View>
        <View style={[styles.bottomRarityLine, { backgroundColor: rarityColor }]} />
      </TouchableOpacity>
    );
  }

  // --- สไตล์แบบการ์ดหลัก (Grid) ---
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageBox}>
        {/* เลเยอร์ 1: Glow ชั้นใน (Tighter Bloom) */}
        <View style={[styles.mainImageGlowInner, { backgroundColor: rarityColor, shadowColor: rarityColor }]} />
        {/* เลเยอร์ 2: Glow ชั้นนอก (Softer Halo) */}
        <View style={[styles.mainImageGlowOuter, { backgroundColor: rarityColor, shadowColor: rarityColor }]} />
        <Image source={{ uri: item?.image }} style={styles.image} resizeMode="contain" />
        
        {item?.stattrak && (
          <View style={styles.stBadge}>
            <Text style={styles.stText}>STATTRAK™</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.weaponName}>{item?.weapon || 'Weapon'}</Text>
        <Text style={styles.skinName} numberOfLines={1}>{item?.skin || 'Standard'}</Text>
        
        <View style={styles.footer}>
          <View style={styles.wearBadge}>
            <Text style={styles.wearText}>{item?.wear || 'FN'}</Text>
          </View>
          <Text style={styles.priceText}>{formatPrice(safePrice)}</Text>
        </View>
      </View>
      
      <View style={[styles.bottomRarityLine, { 
        backgroundColor: rarityColor, 
        shadowColor: rarityColor, 
        shadowOpacity: 0.6, 
        shadowRadius: 4,
        elevation: 5
      }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    margin: 6,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 4 },
    }),
  },
  imageBox: {
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  
  // --- การจัดแสงโกลว์หลัก (Grid) ---
  mainImageGlowInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3, // สว่างขึ้นกว่าเดิมเพื่อทำ Bloom
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20, // กระจายแสงให้ดูนุ่มนวล
    elevation: 8,
  },
  mainImageGlowOuter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.1, // นุ่มนวลทะลุกระจก
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 35, // กระจายแสงกว้างๆ
    elevation: 10,
  },
  
  image: {
    width: '85%',
    height: '85%',
    zIndex: 2,
  },
  info: {
    padding: 12,
    backgroundColor: 'rgba(16, 22, 35, 0.4)',
  },
  weaponName: {
    fontFamily: 'Rajdhani_500Medium',
    color: colors.textSecondary,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  skinName: {
    fontFamily: 'Rajdhani_700Bold',
    color: colors.textPrimary,
    fontSize: 15,
    fontStyle: 'italic',
    marginVertical: 2,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  priceText: {
    fontFamily: 'Rajdhani_700Bold',
    color: colors.primary,
    fontSize: 17,
    fontStyle: 'italic',
  },
  wearBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  wearText: {
    fontFamily: 'Rajdhani_600SemiBold',
    color: colors.textSecondary,
    fontSize: 9,
  },
  stBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(207, 106, 50, 0.85)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 5,
  },
  stText: {
    fontFamily: 'Rajdhani_700Bold',
    color: '#FFF',
    fontSize: 8,
  },
  compactCard: {
    width: 145,
    borderRadius: 14,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  compactImageBox: {
    height: 85,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  
  // --- การจัดแสงโกลว์ (Compact) ---
  compactImageGlowInner: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 22,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  compactImageGlowOuter: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32,
    opacity: 0.1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
  
  compactImage: {
    width: '80%',
    height: '80%',
    zIndex: 2,
  },
  compactInfo: {
    padding: 10,
    backgroundColor: 'rgba(16, 22, 35, 0.4)',
  },
  compactSkin: {
    fontFamily: 'Rajdhani_700Bold',
    color: colors.textPrimary,
    fontSize: 12,
  },
  compactPrice: {
    fontFamily: 'Rajdhani_700Bold',
    color: colors.primary,
    fontSize: 13,
    marginTop: 2,
  },
  bottomRarityLine: {
    height: 2.5,
    width: '100%',
  },
});