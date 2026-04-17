import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { BlurView } from "expo-blur";
import { colors } from "../theme/colors";

// 🟢 ฟังก์ชันจัดสรร URL ให้รองรับทั้ง Local Server และ Mock Data เดิม
const getValidImageUrl = (url) => {
  const fallback = "https://community.akamai.steamstatic.com/public/images/economy/appIconFallback.png";
  if (!url) return fallback;

  // 1. ถ้าเป็นรูปจาก Backend ของเราเอง ปล่อยผ่านได้เลย!
  if (url.includes('10.0.2.2') || url.includes('localhost') || url.includes('/uploads/')) {
    return url;
  }

  // 2. ถ้าเป็นรูปจาก Steam (อาจจะมาจาก Mock Data หน้า Home) ให้ล้างคำผิดก่อน
  return url
    .replace(/\s+/g, '') // 🔥 กวาดช่องว่าง (space) ทิ้งให้หมด! (ตัวการหลักจาก Log)
    .replace(/akamaihdd+/g, 'akamaihd')
    .replace(/aka+maihd/g, 'akamaihd')
    .replace(/\.neet/g, '.net')
    .replace(/economyy+/g, 'economy')
    .replace(/immage+/g, 'image')
    .replace(/steamsta+ti+c+/g, 'steamstatic') // ดัก steamstattic, steamstatiic
    .replace(/([^:])\/\/+/g, '$1/'); 
};

export default function HorizontalCard({ data, onPress, isTrend = false }) {
  const itemInfo = isTrend ? data : (data.item || data);
  const price = data.price || itemInfo.basePrice;
  
  // 🟢 ประมวลผล URL ของรูปภาพ
  const rawImage = itemInfo.image || itemInfo.icon_url;
  const [imgSource, setImgSource] = useState({ uri: getValidImageUrl(rawImage) });

  useEffect(() => {
    setImgSource({ uri: getValidImageUrl(rawImage) });
  }, [rawImage]);

  const rarityColor = itemInfo.rarityColor || '#4B69FF';
  const name = itemInfo.name || itemInfo.weapon || "Unknown Item";

  return (
    <TouchableOpacity style={styles.horizontalCardStyle} activeOpacity={0.8} onPress={onPress}>
      <BlurView intensity={Platform.OS === 'android' ? 60 : 30} tint="dark" style={StyleSheet.absoluteFill} />
      
      <View style={styles.imageBox}>
        <Image 
          source={imgSource} 
          style={styles.cardImage} 
          resizeMode="contain"
          onError={(e) => {
            console.warn(`🖼️ รูปไม่ขึ้น (${name}):`, e.nativeEvent.error);
            // ถ้ารูปยังพังอีก ให้สลับไปใช้ Fallback ทันที
            setImgSource({ uri: "https://community.akamai.steamstatic.com/public/images/economy/appIconFallback.png" });
          }}
        />
      </View>

      <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
      
      <View style={styles.cardPriceRow}>
        <Text style={styles.cardPrice}>
          {price ? (typeof price === 'string' ? price : `฿${Number(price).toLocaleString()}`) : "N/A"}
        </Text>
        
        {isTrend && data.change && (
          <View style={[styles.trendBadge, { backgroundColor: data.isUp ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)' }]}>
            <Text style={[styles.trendChange, { color: data.isUp ? '#4ade80' : '#f87171' }]}>
              {data.change}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.bottomLine, { backgroundColor: rarityColor }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  horizontalCardStyle: {
    width: 150,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    marginBottom: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#070B14',
  },
  imageBox: {
    height: 80,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardImage: { 
    width: '90%', 
    height: '90%',
  },
  cardName: { 
    color: colors.textPrimary, 
    fontFamily: 'Rajdhani_600SemiBold', 
    fontSize: 12, 
    marginBottom: 8 
  },
  cardPriceRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  cardPrice: { 
    color: '#a5e24f',
    fontFamily: 'Rajdhani_700Bold', 
    fontSize: 13 
  },
  trendBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  trendChange: { fontFamily: 'Rajdhani_700Bold', fontSize: 10 },
  bottomLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.8,
  }
});