import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons'; // เปลี่ยนเป็น Vector Icons เพื่อความพรีเมียม
import { colors } from '../theme/colors';

export default function Header({ 
  title, 
  showCart, 
  showNotif, 
  cartCount = 0, 
  onCartPress, 
  onNotifPress, 
  showBack, 
  onBackPress 
}) {
  return (
    <View style={styles.outerContainer}>
      {/* เลเยอร์กระจกฝ้า (Glassmorphism) */}
      <BlurView tint="dark" intensity={85} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.container}>
          
          {/* ส่วนซ้าย: Logo หรือ ปุ่ม Back */}
          <View style={styles.left}>
            {showBack ? (
              <TouchableOpacity onPress={onBackPress} style={styles.iconBtn} activeOpacity={0.7}>
                <Feather name="chevron-left" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <Text style={styles.logoLetter}>D</Text>
                  {/* แสงเรืองแสงหลังโลโก้ */}
                  <View style={styles.logoGlow} />
                </View>
                <Text style={styles.logoTitle}>
                  DEFUSE <Text style={styles.logoBold}>TH</Text>
                </Text>
              </View>
            )}
          </View>

          {/* ส่วนกลาง: Title */}
          <View style={styles.center}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>

          {/* ส่วนขวา: Icons */}
          <View style={styles.right}>
            {showCart && (
              <TouchableOpacity style={styles.iconBtn} onPress={onCartPress} activeOpacity={0.7}>
                <Feather name="shopping-cart" size={22} color={colors.textPrimary} />
                {cartCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {showNotif && (
              <TouchableOpacity style={styles.iconBtn} onPress={onNotifPress} activeOpacity={0.7}>
                <Feather name="bell" size={22} color={colors.textPrimary} />
                <View style={styles.notifDot} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
      
      {/* เส้นขอบนีออนบางๆ ด้านล่างสุด */}
      <View style={styles.bottomBorder} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: 'rgba(7, 11, 20, 0.4)', // สีฐานแบบโปร่งแสง
    overflow: 'hidden',
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 60,
  },
  left: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  right: {
    flex: 1.2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  // --- Logo Styles ---
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    position: 'relative',
  },
  logoLetter: {
    color: '#000',
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 8,
    opacity: 0.5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  logoTitle: {
    color: colors.textSecondary,
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    letterSpacing: 1.5,
  },
  logoBold: {
    color: colors.primary,
    fontFamily: 'Rajdhani_700Bold',
  },

  // --- Title & Icons ---
  title: {
    color: colors.textPrimary,
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: colors.primary,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#070B14',
  },
  badgeText: {
    color: '#000',
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 10,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentRed,
    borderWidth: 1.5,
    borderColor: '#070B14',
  },
  bottomBorder: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});