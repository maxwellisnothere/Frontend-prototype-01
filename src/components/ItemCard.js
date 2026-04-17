import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatPrice } from '../data/items';
import GlowBackground from './GlowBackground'; // 🟢 Import SVG ที่เราสร้างไว้

// 🟢 เอากลับมาแล้ว! คอมโพเนนต์ป้าย StatTrak (ห้ามลบตัวนี้นะครับ)
const StatTrakBadge = () => (
  <View style={styles.stBadge}>
    <Text style={styles.stText}>STATTRAK™</Text>
  </View>
);

export default function ItemCard({ item, onPress }) {
  // ดึงสี rarityColor จากข้อมูลไอเท็มมาใช้งาน
  const rarityColor = item?.rarityColor || '#4B69FF';
  const safePrice = item?.price || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.02)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.imageBox}>
        {/* 🟢 ใช้ SVG พื้นหลังเรืองแสงตรงนี้ */}
        <GlowBackground color={rarityColor} />
        
        <Image source={{ uri: item?.image }} style={styles.image} resizeMode="contain" />
        {item?.stattrak && <StatTrakBadge />}
      </View>

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
      
      <LinearGradient
        colors={['transparent', rarityColor, 'transparent']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.bottomNeonLine}
      />
    </TouchableOpacity>
  );
}

// ==========================================
// 3. STYLES (เอาสไตล์ทั้งหมดกลับมาด้วยครับ)
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