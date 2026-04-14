import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import Constants from "expo-constants";
import * as AuthSession from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isExpoGo = Constants.appOwnership === "expo";
WebBrowser.maybeCompleteAuthSession();

const BACKEND_URL = "https://defuse-th-backend-main.onrender.com";

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [showAdminForm, setShowAdmin] = useState(false);
  
  // ✅ เปลี่ยนจาก username/password เป็น steamId/displayName เพื่อใช้เทสต์คลังปืนจริง
  const [steamIdInput, setSteamIdInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");

  const isHandlingAuth = React.useRef(false);

  useEffect(() => {
    isHandlingAuth.current = false;
    const subscription = Linking.addEventListener("url", handleDeepLink);
    checkExistingToken();
    return () => subscription.remove();
  }, []);

  const checkExistingToken = async () => {
    const token = await AsyncStorage.getItem("token");
    if (token) navigation.replace("Main");
  };

  const handleDeepLink = async ({ url }) => {
    if (isHandlingAuth.current) return;
    isHandlingAuth.current = true;

    if (!url.includes("auth/callback") && !url.includes("auth.expo.io")) {
      isHandlingAuth.current = false;
      return;
    }

    const parsed = Linking.parse(url);
    const { token, steamId, name, error } = parsed.queryParams;

    if (error) {
      Alert.alert("❌ Login ล้มเหลว", error);
      setLoading(false);
      isHandlingAuth.current = false;
      return;
    }
    if (token) {
      const decodedName = decodeURIComponent(name);
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("steamId", steamId);
      await AsyncStorage.setItem("displayName", decodedName);
      await AsyncStorage.setItem("userType", "steam");

      try {
        const verifyRes = await fetch(`${BACKEND_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success && verifyData.user?.avatar) {
          await AsyncStorage.setItem("avatar", verifyData.user.avatar);
        }
      } catch (e) {
        console.error("⚠️ Verify failed:", e);
      }

      isHandlingAuth.current = false;
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    } else {
      setLoading(false);
      isHandlingAuth.current = false;
    }
  };

  const handleSteamLogin = async () => {
    isHandlingAuth.current = false;
    setLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const url = `${BACKEND_URL}/auth/steam?redirect=${encodeURIComponent(redirectUri)}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);

      if (result.type === "success" && result.url) {
        await handleDeepLink({ url: result.url });
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ ERROR:", err);
      setLoading(false);
    }
  };

  // ── Mock Login (สำหรับ Developer) ─────────────────────────────────────
  const handleAdminLogin = async () => {
    // ✅ ดักถ้าไม่กรอก SteamID
    if (!steamIdInput || steamIdInput.trim() === "") {
      Alert.alert("แจ้งเตือน", "กรุณากรอก SteamID ของจริงเพื่อใช้ทดสอบครับ");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/mock-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          steamId: steamIdInput.trim(),
          displayName: displayNameInput.trim() || "Dev User", // ถ้าไม่กรอกชื่อ ให้ใช้คำว่า Dev User
        }),
      });
      const data = await res.json();

      if (data.success) {
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("steamId", data.steamId);
        await AsyncStorage.setItem("displayName", data.displayName);
        await AsyncStorage.setItem("userType", "admin");
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        Alert.alert("Error", data.error || "Login ล้มเหลว");
      }
    } catch (err) {
      console.error("❌ Network error:", err);
      Alert.alert("Error", "ไม่สามารถเชื่อมต่อ Server ได้");
    } finally {
      // ✅ แก้บั๊กปุ่มหมุนค้าง! ปิด loading เสมอไม่ว่าจะสำเร็จหรือพัง
      setLoading(false); 
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💣</Text>
      <Text style={styles.title}>DEFUSE TH</Text>
      <Text style={styles.subtitle}>CS2 Marketplace</Text>

      {!showAdminForm ? (
        <>
          <TouchableOpacity
            style={[styles.steamBtn, loading && styles.btnDisabled]}
            onPress={handleSteamLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#66c0f4" />
            ) : (
              <Text style={styles.steamBtnText}>🎮 Login ด้วย Steam</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.hint}>
            ต้องมีบัญชี Steam{"\n"}และเปิด Inventory เป็น Public
          </Text>

          <TouchableOpacity
            style={styles.adminLink}
            onPress={() => setShowAdmin(true)}
          >
            <Text style={styles.adminLinkText}>🔧 Developer Login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.adminForm}>
            <Text style={styles.adminFormTitle}>🔧 Developer Login</Text>

            {/* ✅ เปลี่ยนช่องกรอกเป็น SteamID และ ชื่อ */}
            <TextInput
              style={styles.input}
              placeholder="ใส่เลข SteamID (17 หลัก)"
              placeholderTextColor="#556677"
              value={steamIdInput}
              onChangeText={setSteamIdInput}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Display Name (ชื่อในแอป)"
              placeholderTextColor="#556677"
              value={displayNameInput}
              onChangeText={setDisplayNameInput}
            />

            <TouchableOpacity
              style={[styles.adminBtn, loading && styles.btnDisabled]}
              onPress={handleAdminLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.adminBtnText}>เข้าสู่ระบบ (Mock)</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setShowAdmin(false);
                setSteamIdInput("");
                setDisplayNameInput("");
              }}
            >
              <Text style={styles.backBtnText}>← กลับ</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0a0e1a", padding: 24 },
  logo: { fontSize: 64, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: "bold", color: "#fff", letterSpacing: 4 },
  subtitle: { fontSize: 16, color: "#8899aa", marginBottom: 48 },
  steamBtn: { backgroundColor: "#1b2838", borderWidth: 1.5, borderColor: "#66c0f4", paddingVertical: 16, paddingHorizontal: 48, borderRadius: 8, minWidth: 240, alignItems: "center" },
  steamBtnText: { color: "#66c0f4", fontSize: 18, fontWeight: "bold" },
  btnDisabled: { opacity: 0.6 },
  hint: { marginTop: 16, color: "#556677", fontSize: 13, textAlign: "center", lineHeight: 20 },
  adminLink: { marginTop: 40, padding: 8 },
  adminLinkText: { color: "#334455", fontSize: 12 },
  adminForm: { width: "100%", alignItems: "center" },
  adminFormTitle: { color: "#aabbcc", fontSize: 18, fontWeight: "bold", marginBottom: 24 },
  input: { width: "100%", backgroundColor: "#1a2233", borderWidth: 1, borderColor: "#2a3a4a", borderRadius: 8, paddingVertical: 14, paddingHorizontal: 16, color: "#fff", fontSize: 16, marginBottom: 12 },
  adminBtn: { width: "100%", backgroundColor: "#66c0f4", borderRadius: 8, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  adminBtnText: { color: "#000", fontSize: 16, fontWeight: "bold" },
  backBtn: { marginTop: 16, padding: 8 },
  backBtnText: { color: "#556677", fontSize: 14 },
});