import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Modal, TextInput, ActivityIndicator, ImageBackground
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";
import { logout, getStoredUser, depositBalance, withdrawBalance } from "../data/api";
import { useBalance } from "../context/BalanceContext";

// ==========================================
// 1. REUSABLE COMPONENTS (GRID MENU)
// ==========================================
const MenuButton = ({ label, onPress, isDanger }) => (
  <TouchableOpacity 
    style={[s.menuBtn, isDanger && s.menuBtnDanger]} 
    onPress={onPress} 
    activeOpacity={0.8}
  >
    <Text style={[s.menuBtnLabel, isDanger && s.menuBtnLabelDanger]}>{label}</Text>
  </TouchableOpacity>
);

const CustomInput = ({ placeholder, value, onChangeText, isNumeric }) => (
  <TextInput
    style={s.inputField}
    placeholder={placeholder}
    placeholderTextColor="#666"
    keyboardType={isNumeric ? "numeric" : "default"}
    value={value}
    onChangeText={onChangeText}
  />
);

// ==========================================
// 2. MAIN SCREEN
// ==========================================
export default function ProfileScreen({ navigation }) {
  const { balance, loadBalance } = useBalance();
  const [user, setUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [depositVisible, setDepositVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  useEffect(() => {
    loadUser();
    loadBalance();
  }, []);

  const loadUser = async () => {
    const stored = await getStoredUser();
    if (stored) setUser(stored);
  };

  // --- API Handlers ---
  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) return Alert.alert("Error", "กรุณากรอกจำนวนเงิน");
    if (amount < 20) return Alert.alert("ขั้นต่ำ", "เติมเงินขั้นต่ำ ฿20");

    setIsProcessing(true);
    try {
      const response = await depositBalance(amount);
      if (response?.error) throw new Error(response.error);
      setDepositVisible(false);
      setDepositAmount("");
      Alert.alert("✅ สำเร็จ", `เติมเงิน ฿${amount.toLocaleString()} เรียบร้อย`);
      await loadBalance();
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", error.message || "ไม่สามารถเติมเงินได้");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 100) return Alert.alert("ขั้นต่ำ", "ระบบกำหนดขั้นต่ำการถอนที่ 100 บาท");
    if (amount > balance) return Alert.alert("ยอดเงินไม่พอ", "คุณมียอดเงินไม่เพียงพอ");
    if (!bankName || !accountNumber || !accountName) return Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลบัญชีให้ครบถ้วน");

    setWithdrawVisible(false); 
    Alert.alert("ยืนยันการถอนเงิน", `ถอนเงิน ฿${amount.toLocaleString()}\nธนาคาร: ${bankName}\nเลขบัญชี: ${accountNumber}\nชื่อ: ${accountName}`, [
      { text: "ยกเลิก", style: "cancel" },
      { 
        text: "ยืนยัน", 
        onPress: async () => {
          setIsProcessing(true);
          try {
            const response = await withdrawBalance({ amount, bankName, accountNumber, accountName });
            if (response?.error) throw new Error(response.error);
            setWithdrawAmount(""); setBankName(""); setAccountNumber(""); setAccountName("");
            Alert.alert("✅ สำเร็จ", "ส่งคำขอถอนเงินเรียบร้อย กรุณารอแอดมินดำเนินการ");
            await loadBalance();
          } catch (error) {
            Alert.alert("ข้อผิดพลาด", error.message || "ไม่สามารถทำรายการได้");
          } finally {
            setIsProcessing(false);
          }
        }
      }
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "ต้องการออกจากระบบ?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); navigation.replace("Login"); } },
    ]);
  };

  const displayName = user?.displayName || "Loading...";
  const steamId = user?.steamId || "";
  const avatar = user?.avatar || null; 
  const isAdmin = user?.userType === "admin";

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* --- Cover Header --- */}
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' }} 
          style={s.coverPhoto}
        >
          <SafeAreaView edges={["top"]}>
            <View style={s.headerNav}>
              <TouchableOpacity onPress={loadBalance} style={s.refreshBtn}>
                <Text style={s.refreshText}>REFRESH 🔄</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </ImageBackground>

        {/* --- Profile Info --- */}
        <View style={s.profileSection}>
          <View style={s.avatarRow}>
            <View style={s.avatarContainer}>
              {/* Glow Layer */}
              <LinearGradient 
                colors={[isAdmin ? "#ff990066" : "#00ff8466", "transparent"]} 
                style={s.avatarGlow} 
              />
              {/* Rounded Square Avatar */}
              <View style={[s.avatarWrapper, isAdmin && { borderColor: "#ff9900" }]}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={s.avatarImage} />
                ) : (
                  <View style={s.avatarPlaceholder}><Text style={s.avatarInitial}>?</Text></View>
                )}
              </View>
            </View>
            <TouchableOpacity style={s.editProfileBtn}>
              <Text style={s.editProfileText}>EDIT PROFILE</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.userName}>{displayName}</Text>
          <View style={s.metaRow}>
            <Text style={s.metaText}>STEAM ID: {steamId || "N/A"}</Text>
          </View>
        </View>

        {/* --- Wallet Section --- */}
        <View style={s.contentSection}>
          <Text style={s.sectionTitle}>WALLET</Text>
          <View style={s.walletCard}>
            <View>
              <Text style={s.walletLabel}>CURRENT BALANCE</Text>
              <Text style={s.walletAmount}>฿ {balance.toLocaleString()}</Text>
            </View>
            <View style={s.walletActions}>
              <TouchableOpacity style={s.actionBtnMain} onPress={() => setDepositVisible(true)}>
                <Text style={s.actionBtnTextMain}>DEPOSIT</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtnSub} onPress={() => setWithdrawVisible(true)}>
                <Text style={s.actionBtnTextSub}>WITHDRAW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- General Grid Menu --- */}
        <View style={s.contentSection}>
          <Text style={s.sectionTitle}>GENERAL</Text>
          <View style={s.menuGrid}>
            <MenuButton label="BUY HISTORY" onPress={() => navigation.navigate("BuyHistory")} />
            <MenuButton label="SALE HISTORY" onPress={() => navigation.navigate("SaleHistory")} />
            <MenuButton label="MY LISTINGS" onPress={() => navigation.navigate("Sell")} />
            <MenuButton label="SECURITY" onPress={() => navigation.navigate("Security")} />
          </View>
        </View>

        {/* --- System Menu --- */}
        <View style={s.contentSection}>
          <Text style={s.sectionTitle}>SYSTEM</Text>
          <View style={s.menuGrid}>
            <MenuButton label="LOGOUT" isDanger onPress={handleLogout} />
          </View>
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* --- Deposit Modal --- */}
      <Modal visible={depositVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>DEPOSIT FUND</Text>
            <CustomInput placeholder="Amount (฿)" value={depositAmount} onChangeText={setDepositAmount} isNumeric />
            <View style={s.modalActionRow}>
              <TouchableOpacity onPress={() => setDepositVisible(false)}><Text style={s.modalBtnCancel}>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleDeposit}>
                {isProcessing ? <ActivityIndicator color="#00ff84" /> : <Text style={s.modalBtnConfirm}>CONFIRM</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Withdraw Modal --- */}
      <Modal visible={withdrawVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>WITHDRAW FUND</Text>
            <CustomInput placeholder="Amount" value={withdrawAmount} onChangeText={setWithdrawAmount} isNumeric />
            <CustomInput placeholder="Bank Name" value={bankName} onChangeText={setBankName} />
            <CustomInput placeholder="Account No." value={accountNumber} onChangeText={setAccountNumber} isNumeric />
            <CustomInput placeholder="Account Name" value={accountName} onChangeText={setAccountName} />
            <View style={s.modalActionRow}>
              <TouchableOpacity onPress={() => setWithdrawVisible(false)}><Text style={s.modalBtnCancel}>CANCEL</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleWithdraw}>
                {isProcessing ? <ActivityIndicator color="#ff453a" /> : <Text style={s.modalBtnDanger}>WITHDRAW</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ==========================================
// 4. STYLESHEETS
// ==========================================
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  
  coverPhoto: { width: "100%", height: 160 },
  headerNav: { paddingHorizontal: 20, paddingTop: 10, alignItems: 'flex-end' },
  refreshBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 8 },
  refreshText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  profileSection: { paddingHorizontal: 25, marginTop: -40, marginBottom: 25 },
  avatarRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 15 },
  avatarContainer: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  avatarGlow: { position: 'absolute', width: 110, height: 110, borderRadius: 25 },
  avatarWrapper: { width: 85, height: 85, borderRadius: 16, backgroundColor: "#1C1C1E", borderWidth: 2, borderColor: "#00ff84", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 24 },
  
  editProfileBtn: { backgroundColor: "#1C1C1E", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#2C2C2E" },
  editProfileText: { color: "#fff", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  userName: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginBottom: 5 },
  metaRow: { marginBottom: 10 },
  metaText: { color: "#8E8E93", fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },

  contentSection: { paddingHorizontal: 25, marginBottom: 25 },
  sectionTitle: { color: "#FFFFFF", fontSize: 12, fontWeight: "900", letterSpacing: 1.5, marginBottom: 15, opacity: 0.6 },

  walletCard: { backgroundColor: "#1C1C1E", borderRadius: 16, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: "#2C2C2E" },
  walletLabel: { color: "#8E8E93", fontSize: 10, fontWeight: "700", marginBottom: 5 },
  walletAmount: { color: "#00ff84", fontSize: 24, fontWeight: "900" },
  walletActions: { gap: 8 },
  actionBtnMain: { backgroundColor: "#FFFFFF", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  actionBtnTextMain: { color: "#000", fontSize: 11, fontWeight: "900" },
  actionBtnSub: { borderWidth: 1, borderColor: "#333", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  actionBtnTextSub: { color: "#fff", fontSize: 11, fontWeight: "700" },

  // Menu Grid
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  menuBtn: { width: '48%', height: 65, backgroundColor: "#1C1C1E", borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: "#2C2C2E" },
  menuBtnDanger: { borderColor: "#421616", backgroundColor: "#260D0D" },
  menuBtnLabel: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  menuBtnLabelDanger: { color: "#FF453A" },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", padding: 25 },
  modalBox: { width: "100%", backgroundColor: "#1C1C1E", padding: 25, borderRadius: 20, borderWidth: 1, borderColor: "#2C2C2E" },
  modalTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", marginBottom: 20, textAlign: "center", letterSpacing: 1 },
  inputField: { backgroundColor: "#000", color: "#fff", padding: 15, borderRadius: 12, fontSize: 14, borderWidth: 1, borderColor: "#333", marginBottom: 12 },
  modalActionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 15 },
  modalBtnCancel: { color: "#8E8E93", fontSize: 14, fontWeight: "800" },
  modalBtnConfirm: { color: "#00ff84", fontSize: 14, fontWeight: "900" },
  modalBtnDanger: { color: "#FF453A", fontSize: 14, fontWeight: "900" },
});