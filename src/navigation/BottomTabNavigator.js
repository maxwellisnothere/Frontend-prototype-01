// src/navigation/BottomTabNavigator.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Feather } from '@expo/vector-icons'; // ใช้ Feather สำหรับไอคอนลายเส้นมินิมอล
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import NewsScreen from '../screens/NewsScreen';
import StoreScreen from '../screens/StoreScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const insets = useSafeAreaInsets();
  // คำนวณระยะห่างด้านล่าง โดยเผื่อพื้นที่สำหรับ iPhone รุ่นที่มีรอยบาก/Home Indicator
  const bottomSpacing = Math.max(insets.bottom, 20); 

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary, // สีส้มสดใสเมื่อทำงาน
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomSpacing,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 35, // ทรงยาเม็ด (Pill shape)
          backgroundColor: 'transparent', // ต้องโปร่งใสเพื่อให้เห็น BlurView
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.5)', // ขอบกระจกแบบบางๆ
          elevation: 0, // ปิด Shadow พื้นฐานของ Android เพื่อใช้ดีไซน์ลอยตัว
          borderTopWidth: 0, 
        },
        // ใส่เอฟเฟกต์กระจกฝ้าเป็นฉากหลัง
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, styles.blurContainer]}>
            <BlurView tint="light" intensity={70} style={StyleSheet.absoluteFill} />
          </View>
        ),
        tabBarItemStyle: {
          paddingVertical: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontStyle: 'italic', // ให้ความรู้สึกสปอร์ต/eSports
          marginTop: 2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.glowWrapper : null}>
              <Feather name="home" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Store"
        component={StoreScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.glowWrapper : null}>
              <Feather name="shopping-cart" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Inventory"
        component={InventoryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.glowWrapper : null}>
              <Feather name="briefcase" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.glowWrapper : null}>
              <Feather name="globe" size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.glowWrapper : null}>
              <Feather name="user" size={24} color={color} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    borderRadius: 35,
    overflow: 'hidden', // สำคัญมาก: ช่วยตัดขอบ BlurView ให้อยู่ในทรงยาเม็ด
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // สีฐานนิดๆ ช่วยให้ตัวอักษรอ่านง่ายขึ้น
  },
  glowWrapper: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8, // สร้างเอฟเฟกต์เรืองแสง (Glow) เมื่อไอคอนถูกเลือก
  }
});