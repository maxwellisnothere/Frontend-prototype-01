// src/components/AnimatedBackground.js
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function AnimatedBackground({ children }) {
  // สร้างค่า Animation สำหรับความสว่าง (Opacity)
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // สร้าง Animation วนลูปแบบ Breathing (หายใจเข้า-ออก)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8, // สว่างขึ้น
          duration: 3000, // ใช้เวลา 3 วินาที
          useNativeDriver: true, // เพื่อประสิทธิภาพสูงสุด (อ้างอิงจาก React Native Docs)
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3, // มืดลง
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowOpacity]);

  return (
    <View style={styles.container}>
      {/* เลเยอร์ที่ 1: Gradient พื้นหลังหลัก */}
      <LinearGradient
        colors={[colors.background, '#0A1128', colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* เลเยอร์ที่ 2: เอฟเฟกต์เรืองแสง Electric Blue ที่เคลื่อนไหวได้ */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: glowOpacity }]}>
        <LinearGradient
          colors={['transparent', 'rgba(0, 240, 255, 0.1)', 'transparent']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 0.8 }}
        />
      </Animated.View>

      {/* เลเยอร์ที่ 3: เนื้อหาของแอปพลิเคชัน */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    zIndex: 1, // ทำให้มั่นใจว่าเนื้อหาอยู่เหนือพื้นหลัง
  }
});