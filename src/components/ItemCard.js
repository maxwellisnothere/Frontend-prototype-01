import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { formatPrice } from '../data/items';

// ==========================================
// 1. SUB-COMPONENTS
// ==========================================

const BloomGlow = ({ color }) => (
  <View style={styles.glowContainer}>
    <LinearGradient colors={[`${color}15`, 'transparent']} style={[styles.glowLayer, styles.glowOuter]} />
    <LinearGradient colors={[`${color}30`, 'transparent']} style={[styles.glowLayer, styles.glowMid]} />
    <LinearGradient colors={[`${color}60`, 'transparent']} style={[styles.glowLayer, styles.glowInner]} />
    <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
  </View>
);

const StatTrakBadge = () => (
  <View style={styles.stBadge}>
    <Text style={styles.stText}>STATTRAK™</Text>
  </View>
);

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function ItemCard({ item, onPress }) {
  const rarityColor = item?.rarityColor || '#4B69FF';
  const safePrice = item?.price || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* ผิวกระจกหลัก */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* รูปภาพและแสง */}
      <View style={styles.imageBox}>
        <BloomGlow color={rarityColor} />
        <Image source={{ uri: item?.image }} style={styles.image} resizeMode="contain" />
        {item?.stattrak && <StatTrakBadge />}
      </View>

      {/* ข้อมูลไอเทม */}
      <View style={styles.info}>
        <Text style={styles.weaponName}>{item?.weapon || 'WEAPON'}</Text>
        <Text style={styles.skinName} numberOfLines={1}>{item?.skin || 'SKIN'}</Text>
        
        <View style={styles.footer}>
          <View style={[styles.wearBadge, { borderColor: `${rarityColor}40` }]}>
            <Text style={styles.wearText}>{item?.wear || 'FN'}</Text>
          </View>
          <Text style={styles.priceText}>{formatPrice(safePrice)}</Text>
        </View>
      </View>
      
      {/* เส้นนีออนที่ฐาน */}
      <LinearGradient
        colors={['transparent', rarityColor, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.bottomNeonLine}
      />
    </TouchableOpacity>
  );
}

// ==========================================
// 3. STYLES
// ==========================================
const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 20,
    backgroundColor: '#070B14',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  imageBox: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLayer: { position: 'absolute' },
  glowOuter: { width: 180, height: 180, borderRadius: 90 },
  glowMid: { width: 120, height: 120, borderRadius: 60 },
  glowInner: { width: 70, height: 70, borderRadius: 35 },
  image: {
    width: '85%',
    height: '85%',
    zIndex: 10,
  },
  info: {
    padding: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  weaponName: {
    fontFamily: 'Rajdhani_600SemiBold',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    letterSpacing: 1.5,
  },
  skinName: {
    fontFamily: 'Rajdhani_700Bold',
    color: '#FFFFFF',
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  priceText: {
    fontFamily: 'Rajdhani_600SemiBold',
    color: '#a5e24f',
    fontSize: 17,
  },
  wearBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  wearText: {
    fontFamily: 'Rajdhani_600SemiBold',
    color: '#FFF',
    fontSize: 9,
  },
  bottomNeonLine: {
    height: 1.5,
    width: '100%',
  },
  stBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#CF6A32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 15,
  },
  stText: {
    color: '#FFF',
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 8,
  },
});