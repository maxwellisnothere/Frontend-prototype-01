import React, { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Image, Modal, TextInput, ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import {
  logout,
  getStoredUser,
  depositBalance,
  withdrawBalance,
} from "../data/api";
import { useBalance } from "../context/BalanceContext";

// Component สำหรับเมนูแต่ละแถว
const MenuItem = ({ icon, label, sublabel, onPress, danger = false, accent = false }) => (
  <TouchableOpacity style={ms.item} onPress={onPress} activeOpacity={0.7}>
    <View style={[
      ms.iconBox,
      danger && { backgroundColor: colors.accentRed + "22" },
      accent && { backgroundColor: colors.primary + "22" },
    ]}>
      <Text style={ms.icon}>{icon}</Text>
    </View>
    <View style={ms.textBox}>
      <Text style={[ms.label, danger && { color: colors.accentRed }]}>{label}</Text>
      {sublabel && <Text style={ms.sublabel}>{sublabel}</Text>}
    </View>
    <Text style={ms.arrow}>›</Text>
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const { balance, loadBalance } = useBalance();
  const [user, setUser] = useState(null);
  
  // ✅ เพิ่ม State สำหรับจัดการปุ่มหมุนโหลด
  const [isProcessing, setIsProcessing] = useState(false);

  // State สำหรับ Modal เติมเงิน
  const [depositVisible, setDepositVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  // State สำหรับ Modal ถอนเงิน
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

  // --- Logic เติมเงิน ---
  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount <= 0) return Alert.alert("Error", "กรุณากรอกจำนวนเงิน");
    if (amount < 20) return Alert.alert("ขั้นต่ำ", "เติมเงินขั้นต่ำ ฿20");

    setIsProcessing(true); // 🟢 เริ่มหมุนโหลด
    try {
      const response = await depositBalance(amount);
      
      // ดักจับ error จาก backend ที่ส่งมาเป็น object { error: '...' }
      if (response && response.error) {
         throw new Error(response.error); 
      }
      
      setDepositVisible(false);
      setDepositAmount("");
      Alert.alert("✅ สำเร็จ", `เติมเงิน ฿${amount.toLocaleString()} เรียบร้อย`);
      await loadBalance();
    } catch (error) {
      Alert.alert("ข้อผิดพลาด", error.message || "ไม่สามารถเติมเงินได้ในขณะนี้");
    } finally {
      setIsProcessing(false); // 🔴 หยุดหมุนโหลดเสมอ
    }
  };

  // --- Logic ถอนเงิน ---
  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    
    if (!amount || amount <= 0) return Alert.alert("Error", "กรุณากรอกจำนวนเงิน");
    if (amount < 100) return Alert.alert("ขั้นต่ำ", "ระบบกำหนดขั้นต่ำการถอนที่ 100 บาท");
    if (amount > balance) return Alert.alert("ยอดเงินไม่พอ", "คุณมียอดเงินไม่เพียงพอ");
    if (!bankName || !accountNumber || !accountName) {
      return Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกข้อมูลบัญชีให้ครบถ้วน");
    }

    setWithdrawVisible(false); 
    
    Alert.alert("ยืนยันการถอนเงิน", `ถอนเงิน ฿${amount.toLocaleString()} เข้าบัญชี:\n\n${bankName}\nเลขบัญชี: ${accountNumber}\nชื่อ: ${accountName}`, [
      { text: "ยกเลิก", style: "cancel" },
      { 
        text: "ยืนยัน", 
        onPress: async () => {
          setIsProcessing(true); // 🟢 เริ่มหมุนโหลด (ตอนกดปุ่มยืนยัน)
          try {
            const response = await withdrawBalance({ amount, bankName, accountNumber, accountName });

            if (response && response.error) throw new Error(response.error);

            setWithdrawAmount("");
            setBankName("");
            setAccountNumber("");
            setAccountName("");
            
            Alert.alert("✅ สำเร็จ", "ส่งคำขอถอนเงินเรียบร้อย กรุณารอแอดมินดำเนินการโอนเงินครับ");
            await loadBalance();

          } catch (error) {
            console.error(error);
            Alert.alert("ข้อผิดพลาด", error.message || "ไม่สามารถทำรายการได้ในขณะนี้");
          } finally {
            setIsProcessing(false); // 🔴 หยุดหมุนโหลดเสมอ
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

  const displayName = user?.displayName || "Unknown";
  const steamId = user?.steamId || "";
  const avatar = user?.avatar || null;
  const isAdmin = user?.userType === "admin";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={loadBalance}><Text>🔄</Text></TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card & Balance (โค้ดเดิม) */}
        <View style={s.profileCard}>
          <View style={s.avatarBox}>
            {avatar ? <Image source={{ uri: avatar }} style={s.avatarImg} /> : 
            <View style={s.avatarPlaceholder}><Text style={s.avatarEmoji}>{isAdmin ? "🔧" : "🎯"}</Text></View>}
            <View style={[s.levelBadge, isAdmin && { backgroundColor: "#ff9900" }]} />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.userName}>{displayName}</Text>
            <View style={[s.userTypeBadge, isAdmin && { backgroundColor: "#ff990022" }]}>
              <Text style={s.userTypeText}>{isAdmin ? "🔧 Dev Mode" : "🎮 Steam"}</Text>
            </View>
            <Text style={s.userId}>ID: {steamId ? steamId.slice(-6) : "------"}</Text>
          </View>
        </View>

        <View style={s.balanceCard}>
          <View>
            <Text style={s.balanceLabel}>💰 BALANCE จำนวนเงิน (Baht)</Text>
            <Text style={s.balanceAmount}>฿ {balance.toLocaleString()}</Text>
          </View>
          <View style={s.balanceActions}>
            <TouchableOpacity style={s.depositBtn} onPress={() => setDepositVisible(true)}>
              <Text style={s.depositText}>+ เติมเงิน</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.withdrawBtn} onPress={() => setWithdrawVisible(true)}>
              <Text style={s.withdrawText}>- ถอนเงิน</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>ACCOUNT & ACTIVITY</Text>
          <View style={s.menuCard}>
            <MenuItem icon="🛒" label="Buy History" sublabel="ประวัติการซื้อ" onPress={() => navigation.navigate("BuyHistory")} />
            <View style={s.divider} />
            
            {/* ✅ 1. เปลี่ยนให้ชี้ไปที่หน้า SaleHistory ที่เราเพิ่งสร้าง */}
            <MenuItem icon="🚚" label="Sale History" sublabel="ประวัติการขาย & จัดส่งของ" accent onPress={() => navigation.navigate("SaleHistory")} />
            <View style={s.divider} />
            
            {/* ✅ 2. (แถม) เพิ่มปุ่มสำหรับหน้าจัดการของที่วางขายแยกออกมาต่างหาก */}
            <MenuItem icon="💸" label="Manage Listings" sublabel="จัดการของที่วางขาย" onPress={() => navigation.navigate("Sell")} />
            <View style={s.divider} />
            
            <MenuItem icon="🔒" label="Security" sublabel="รหัสผ่าน & 2FA" onPress={() => navigation.navigate("Security")} />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.menuCard}>
            <MenuItem icon="🚪" label="Logout" danger onPress={handleLogout} />
          </View>
        </View>
      </ScrollView>

      {/* --- Deposit Modal --- */}
      <Modal visible={depositVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Deposit / เติมเงิน</Text>
            <TextInput
              style={s.modalInput}
              placeholder="กรอกจำนวนเงิน (฿)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={depositAmount}
              onChangeText={setDepositAmount}
              autoFocus
            />
            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => { setDepositVisible(false); setDepositAmount(""); }} disabled={isProcessing}>
                <Text style={s.btnCancel}>ยกเลิก</Text>
              </TouchableOpacity>
              
              {/* 🟢 อัปเดตปุ่มยืนยันให้มี ActivityIndicator */}
              <TouchableOpacity onPress={handleDeposit} disabled={isProcessing}>
                {isProcessing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={s.btnConfirm}>ยืนยัน</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Withdraw Modal --- */}
      <Modal visible={withdrawVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Withdraw / ถอนเงิน</Text>
            <Text style={s.modalSub}>ยอดเงินคงเหลือ: ฿{balance.toLocaleString()}</Text>
            
            <TextInput style={[s.modalInput, { marginBottom: 10 }]} placeholder="จำนวนเงิน (ขั้นต่ำ ฿100)" placeholderTextColor="#666" keyboardType="numeric" value={withdrawAmount} onChangeText={setWithdrawAmount} />
            <TextInput style={[s.modalInput, { marginBottom: 10, fontSize: 14, textAlign: 'left' }]} placeholder="ธนาคาร / PromptPay" placeholderTextColor="#666" value={bankName} onChangeText={setBankName} />
            <TextInput style={[s.modalInput, { marginBottom: 10, fontSize: 14, textAlign: 'left' }]} placeholder="เลขบัญชี / เบอร์โทร" placeholderTextColor="#666" keyboardType="numeric" value={accountNumber} onChangeText={setAccountNumber} />
            <TextInput style={[s.modalInput, { fontSize: 14, textAlign: 'left' }]} placeholder="ชื่อบัญชีรับเงิน" placeholderTextColor="#666" value={accountName} onChangeText={setAccountName} />

            <View style={s.modalButtons}>
              <TouchableOpacity onPress={() => { setWithdrawVisible(false); }} disabled={isProcessing}>
                <Text style={s.btnCancel}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleWithdraw} disabled={isProcessing}>
                <Text style={[s.btnConfirm, { color: colors.accentRed }]}>ยืนยันการถอน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

// โค้ด Styles (s, ms) สามารถใช้ของเดิมต่อท้ายได้เลยครับ
// ... ส่วน StyleSheet (s, ms) เอาไว้เหมือนเดิมเป๊ะๆ ครับ
// (ผมละไว้เพื่อความกระชับ คุณสามารถใช้ของเก่าต่อท้ายได้เลย)

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  scroll: { flex: 1 },
  profileCard: { backgroundColor: colors.surfaceElevated, margin: 16, borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  avatarBox: { position: "relative" },
  avatarImg: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: colors.primary },
  avatarPlaceholder: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary + "33", alignItems: "center", justifyContent: "center" },
  avatarEmoji: { fontSize: 36 },
  levelBadge: { position: "absolute", bottom: -4, right: -4, width: 18, height: 18, backgroundColor: colors.primary, borderRadius: 9, borderWidth: 2, borderColor: colors.background },
  profileInfo: { flex: 1 },
  userName: { color: colors.textPrimary, fontSize: 18, fontWeight: "800" },
  userTypeBadge: { backgroundColor: "#66c0f422", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4 },
  userTypeText: { fontSize: 11, fontWeight: "700", color: "#aabbcc" },
  userId: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  balanceCard: { backgroundColor: colors.cardBg, marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.primary + "44", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  balanceLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  balanceAmount: { color: colors.primary, fontSize: 26, fontWeight: "900" },
  balanceActions: { gap: 8 },
  depositBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  depositText: { color: "#000", fontSize: 12, fontWeight: "900" },
  withdrawBtn: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  withdrawText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: colors.textMuted, fontSize: 10, fontWeight: "800", marginBottom: 8 },
  menuCard: { backgroundColor: colors.cardBg, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 64 },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "#000000aa", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", backgroundColor: "#1a1a1a", padding: 24, borderRadius: 20, borderWidth: 1, borderColor: "#333" },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 16 },
  modalSub: { color: "#888", fontSize: 13, marginBottom: 10 },
  modalInput: { backgroundColor: "#000", color: colors.primary, padding: 15, borderRadius: 12, fontSize: 18, fontWeight: "bold", textAlign: "center", borderWidth: 1, borderColor: "#444" },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", marginTop: 20, gap: 24 },
  btnCancel: { color: "#666", fontSize: 16, fontWeight: "600" },
  btnConfirm: { color: colors.primary, fontSize: 16, fontWeight: "800" },
});

const ms = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 18 },
  textBox: { flex: 1 },
  label: { color: colors.textPrimary, fontSize: 14, fontWeight: "600" },
  sublabel: { color: colors.textMuted, fontSize: 11 },
  arrow: { color: colors.textMuted, fontSize: 20 },
});