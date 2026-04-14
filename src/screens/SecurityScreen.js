import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";

export default function SecurityScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // ✅ โหมดแก้ไข

  useEffect(() => {
    loadData();
  }, []);

  // โหลดข้อมูล
  const loadData = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem("user_email");
      const savedPhone = await AsyncStorage.getItem("user_phone");

      if (savedEmail) setEmail(savedEmail);
      if (savedPhone) setPhone(savedPhone);
    } catch (e) {
      console.log("load error", e);
    }
  };

const handleSave = async () => {
  if (!email || !phone) {
    Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกให้ครบ");
    return;
  }

  // ✅ เช็ค email format (ต้องมี @ และรูปแบบถูก)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    Alert.alert("อีเมลไม่ถูกต้อง", "กรุณากรอกอีเมลให้ถูกต้อง (ต้องมี @)");
    return;
  }

  setLoading(true);

  try {
    await AsyncStorage.setItem("user_email", email);
    await AsyncStorage.setItem("user_phone", phone);

    setIsEditing(false);
    Alert.alert("สำเร็จ", "บันทึกเรียบร้อย");
  } catch (e) {
    Alert.alert("Error", "บันทึกไม่สำเร็จ");
  }

  setLoading(false);
};

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Security Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
          <View style={s.iconContainer}>
            <Text style={s.mainIcon}>🔒</Text>
            <Text style={s.sectionDesc}>
              ตั้งค่าข้อมูลการติดต่อเพื่อความปลอดภัย
            </Text>
          </View>

          {/* EMAIL */}
          <View style={s.inputWrapper}>
            <Text style={s.label}>EMAIL</Text>
            <View
              style={[
                s.inputBox,
                !isEditing && s.inputDisabled, // ✅ สีเทา
              ]}
            >
              <TextInput
                style={s.input}
                placeholder="example@email.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                editable={isEditing} // ✅ ล็อก
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* PHONE */}
          <View style={s.inputWrapper}>
            <Text style={s.label}>PHONE</Text>
            <View
              style={[
                s.inputBox,
                !isEditing && s.inputDisabled,
              ]}
            >
              <TextInput
                style={s.input}
                placeholder="08XXXXXXXX"
                placeholderTextColor={colors.textMuted}
                value={phone}
                editable={isEditing}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* ปุ่ม */}
          {!isEditing ? (
            // 🔵 ปุ่มแก้ไข
            <TouchableOpacity
              style={s.editBtn}
              onPress={() => setIsEditing(true)}
            >
              <Text style={s.editBtnText}>แก้ไขข้อมูล</Text>
            </TouchableOpacity>
          ) : (
            // 🟢 ปุ่มบันทึก
            <TouchableOpacity
              style={[s.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={s.saveBtnText}>
                {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: colors.surface,
  },

  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  backBtn: { width: 40, alignItems: "center" },
  backText: { color: colors.textPrimary, fontSize: 28 },

  content: { padding: 20 },

  iconContainer: { alignItems: "center", marginBottom: 30 },
  mainIcon: { fontSize: 50 },

  inputWrapper: { marginBottom: 20 },
  label: { color: colors.primary, marginBottom: 6 },

  inputBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  inputDisabled: {
    backgroundColor: "#2a2a2a", // ✅ สีเทา
  },

  input: {
    height: 50,
    color: colors.textPrimary,
  },

  editBtn: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  editBtnText: { color: "#fff", fontWeight: "bold" },

  saveBtn: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },

  saveBtnText: { fontWeight: "bold" },
});