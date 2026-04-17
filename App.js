import React, { useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from "expo-linking"; // 🟢 1. ดึง expo-linking มาใช้งาน

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

SplashScreen.preventAutoHideAsync();

// 🟢 2. ตั้งค่าการรับ URL กลับเข้าแอป (Deep Linking)
const linking = {
  prefixes: [Linking.createURL("/"), "myapp://"], // ระบุ Prefix ให้ตรงกับ Backend
  config: {
    screens: {
      // ระบุชื่อหน้าจอที่ต้องการให้รับข้อมูลกลับมา (ดูชื่อจาก StackNavigator)
      // สมมติว่าหน้าจอ Login ใช้ชื่อ "Login"
      Login: "auth/callback", 
    },
  },
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <BalanceProvider>
        <HistoryProvider>
          {/* 🟢 3. แนบ linking เข้าไปใน NavigationContainer */}
          <NavigationContainer linking={linking}>
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
    backgroundColor: colors.background,
  },
});