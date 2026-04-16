import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import { 
  useFonts, 
  Rajdhani_500Medium, 
  Rajdhani_600SemiBold, 
  Rajdhani_700Bold 
} from "@expo-google-fonts/rajdhani";

import StackNavigator from "./src/navigation/StackNavigator";
import { BalanceProvider } from "./src/context/BalanceContext";
import { HistoryProvider } from "./src/context/HistoryContext";
import { colors } from "./src/theme/colors";

// ป้องกันไม่ให้ Splash Screen หายไปเองจนกว่าเราจะสั่ง
SplashScreen.preventAutoHideAsync();

export default function App() {
  // โหลด Custom Fonts (Rajdhani)
  const [fontsLoaded, fontError] = useFonts({
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  // ฟังก์ชันจัดการการปิด Splash Screen เมื่อแอปพร้อม
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      // ซ่อน Splash Screen อย่างนุ่มนวล
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // หากฟอนต์ยังโหลดไม่เสร็จ ให้คืนค่า null (Splash Screen จะยังแสดงอยู่)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View 
      style={styles.container} 
      onLayout={onLayoutRootView}
    >
      <BalanceProvider>
        <HistoryProvider>
          <NavigationContainer>
            <StackNavigator />
          </NavigationContainer>
        </HistoryProvider>
      </BalanceProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // ใช้สีพื้นหลังของธีมเพื่อความต่อเนื่อง
  },
});