import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GlowBackground from './GlowBackground'; // 🟢 ดึง SVG ที่เราสร้างมาใช้
import { formatPrice } from '../data/items';

export default function HorizontalCard({ data, isTrend, onPress }) {
  // ดึงข้อมูลไอเทม (รองรับทั้งโครงสร้างแบบซ้อนและไม่ซ้อน)
  const item = data?.item || data;
  
  if (!item) return null;

  const rarityColor = item?.rarityColor || '#4B69FF';
  const safePrice = item?.price || item?.basePrice || 0;

  // 🟢 จำลองตัวเลขราคาขึ้น-ลง (ถ้า Backend ส่ง item.trend มาจะใช้ค่านั้น ถ้าไม่มีจะสุ่มตัวเลขหลอกๆ ขึ้นมาให้ดูสวยงาม)
  const trendValue = item?.trend || (Math.random() * 8 - 2).toFixed(2); // สุ่มค่า -2% ถึง +6%
  const isUp = parseFloat(trendValue) > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* เอฟเฟกต์กระจกบางๆ */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.01)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.imageBox}>
        {/* 🟢 ใช้ SVG Glow ตามสีความหายาก เหมือนใน ItemCard เลย */}
        <GlowBackground color={rarityColor} />
        
        <Image source={{ uri: item?.image }} style={styles.image} resizeMode="contain" />
      </View>

      <View style={styles.info}>
        <Text style={styles.weaponName}>{item?.weapon || 'WEAPON'}</Text>
        <Text style={styles.skinName} numberOfLines={1}>{item?.skin || 'SKIN'}</Text>
        
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>{formatPrice(safePrice)}</Text>
          
          {/* 🟢 แสดงเปอร์เซ็นต์ราคาขึ้น-ลง (สีเขียว = ขึ้น, สีแดง = ลง) */}
          {isTrend && (
            <View style={[styles.trendBadge, { backgroundColor: isUp ? 'rgba(0, 255, 102, 0.15)' : 'rgba(255, 0, 85, 0.15)' }]}>
              <Text style={[styles.trendText, { color: isUp ? '#00FF66' : '#FF0055' }]}>
                {isUp ? '▲' : '▼'} {Math.abs(trendValue)}%
              </Text>
            </View>
          )}
        </View>
      </View>
      
      {/* เส้นนีออนบางๆ ด้านล่างเพื่อความสวยงาม */}
      <View style={[styles.bottomLine, { backgroundColor: rarityColor }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160, // กำหนดความกว้างตายตัว เพื่อให้เรียงกันและเลื่อนซ้าย-ขวาได้สวยงาม
    height: 200,
    backgroundColor: '#070B14',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  imageBox: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '85%',
    height: '85%',
    zIndex: 10,
  },
  info: {
    padding: 12,
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  weaponName: {
    fontFamily: 'Rajdhani_600SemiBold',
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    letterSpacing: 1,
  },
  skinName: {
    fontFamily: 'Rajdhani_700Bold',
    color: '#FFFFFF',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontFamily: 'Rajdhani_700Bold',
    color: '#a5e24f',
    fontSize: 15,
  },
  trendBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
  },
  bottomLine: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
  },
});