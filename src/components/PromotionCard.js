import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

export default function PromotionCard({ promo }) {
  return (
    <TouchableOpacity style={styles.promoCard} activeOpacity={0.9}>
      <BlurView intensity={Platform.OS === 'android' ? 80 : 40} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.01)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient colors={[promo.color + '40', 'transparent']} style={styles.promoGlow} />
      <View style={styles.promoContent}>
        <Text style={styles.promoEmoji}>{promo.image}</Text>
        <View>
          <Text style={[styles.promoTitle, { color: promo.color }]}>{promo.title}</Text>
          <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  promoCard: {
    width: 280, borderRadius: 20, marginBottom: 10,
    borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.12)', 
    position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(7, 11, 20, 0.3)',
  },
  promoContent: { flexDirection: 'row', padding: 18, alignItems: 'center', zIndex: 10 },
  promoGlow: { position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: 60, opacity: 0.8 },
  promoEmoji: { fontSize: 26, marginRight: 16 },
  promoTitle: { fontFamily: 'Rajdhani_700Bold', fontSize: 16, fontStyle: 'italic' },
  promoSubtitle: { fontFamily: 'Rajdhani_500Medium', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});