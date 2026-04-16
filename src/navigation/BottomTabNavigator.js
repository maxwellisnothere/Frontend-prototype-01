// src/navigation/BottomTabNavigator.js
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

// --- 1. Import หน้าจอ ---
import HomeScreen from '../screens/HomeScreen';
import StoreScreen from '../screens/StoreScreen';
import InventoryScreen from '../screens/InventoryScreen';
import NewsScreen from '../screens/NewsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// ==========================================
// Component: ไอคอนพร้อม Animation สมูทๆ (Smooth Transition)
// ==========================================
const AnimatedTabIcon = ({ focused, iconName, color }) => {
  // ใช้ Animated.Value ตัวเดียวคุมทุกอย่าง (0 = ไม่ได้เลือก, 1 = ถูกเลือก)
  const focusAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    // ใช้ Spring ที่ปรับจูนให้ "นุ่ม" ขึ้น (ลด tension, เพิ่ม friction)
    Animated.spring(focusAnim, {
      toValue: focused ? 1 : 0,
      friction: 7,   // ความหนืด (ยิ่งเยอะยิ่งไม่เด้งดึ๋งมาก)
      tension: 40,   // ความตึง (ยิ่งน้อยยิ่งสมูท)
      useNativeDriver: true,
    }).start();
  }, [focused]);

  // --- Interpolate: แปลงค่า 0-1 เป็น Animation เอฟเฟกต์ต่างๆ ---
  
  // 1. ขนาดของไอคอน (1 -> 1.15)
  const scaleAnim = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15]
  });
  
  // 2. การลอยขึ้น (-5px)
  const translateYAnim = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5]
  });
  
  // 3. ความสว่างของแสงฟุ้งหลังไอคอน (0 -> 0.15)
  const glowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15]
  });

  // 4. จุดด้านล่าง (ค่อยๆ ปรากฏ และค่อยๆ ขยายจาก 50% เป็น 100%)
  const dotOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });
  const dotScale = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });

  return (
    <Animated.View 
      style={[
        styles.iconContainer, 
        { transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] }
      ]}
    >
      {/* แสง Glow: ให้ Render ทิ้งไว้เลย แต่คุมด้วย Opacity */}
      <Animated.View 
        style={[
          styles.activeGlow, 
          { backgroundColor: colors.primary, opacity: glowOpacity }
        ]} 
      />
      
      <Feather name={iconName} size={22} color={color} />
      
      {/* จุดด้านล่าง: คุมด้วย Opacity และ Scale ให้ค่อยๆ ซูมขึ้นมา */}
      <Animated.View 
        style={[
          styles.activeDot, 
          { 
            backgroundColor: colors.primary, 
            opacity: dotOpacity, 
            transform: [{ scale: dotScale }] 
          }
        ]} 
      />
    </Animated.View>
  );
};

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom, 20); 

  const tabs = [
    { name: 'Home', icon: 'home', component: HomeScreen },
    { name: 'Store', icon: 'shopping-cart', component: StoreScreen },
    { name: 'Inventory', icon: 'briefcase', component: InventoryScreen },
    { name: 'News', icon: 'globe', component: NewsScreen },
    { name: 'Profile', icon: 'user', component: ProfileScreen },
  ];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.4)',
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomSpacing,
          left: 20,
          right: 20,
          height: 65,
          borderRadius: 32,
          backgroundColor: 'transparent',
          borderWidth: 0.8,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          elevation: 0,
          borderTopWidth: 0,
        },
        tabBarBackground: () => (
          <View style={styles.blurWrapper}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.05)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ),
        tabBarLabelStyle: {
          fontFamily: 'Rajdhani_700Bold',
          fontSize: 9,
          letterSpacing: 0.5,
          marginTop: -2,
        },
      }}
    >
      {tabs.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component} 
          options={{
            // เรียกใช้ Component ที่มี Animation ตรงนี้
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} iconName={tab.icon} color={color} />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  blurWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(7, 11, 20, 0.6)',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  activeGlow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    opacity: 0.15,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  }
});