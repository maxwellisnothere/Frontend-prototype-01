# 📱 Defuse TH — Frontend (csgoApp)

> React Native + Expo app สำหรับ CS2 Skins Marketplace สำหรับคนไทย  
> Backend Repo: [defuse-th-backend](https://github.com/)

---

## 🔨 Build APK BY EXPO

```bash
eas login
# myapp.pp12345@gmail.com / Myapp@12345

eas init   # in => app.json
```

ผูกกับ Account ใน `app.json`:

```json
{
  "owner": "myapp12345",
  "extra": {
    "eas": {
      "projectId": "1c913bc0-0f6b-43ad-9649-7c7fae5f3621"
    }
  }
}
```

```bash
eas build -p android --profile development   # Build

eas logout   # change account
```

---

## 🛠️ Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | React Native + Expo SDK 55 |
| Navigation | @react-navigation/native, bottom-tabs, native-stack |
| Storage | @react-native-async-storage/async-storage |
| Steam Login | expo-web-browser + expo-linking |
| Language | JavaScript (ไม่ใช้ TypeScript) |

---

## ⚙️ ค่าคงที่สำคัญ

```env
BACKEND_URL = https://defuse-th-backend-main.onrender.com
APP_SCHEME  = myapp://auth/callback
```

---

## 📂 โครงสร้างไฟล์

```
csgoApp/src/
├── theme/
│   └── colors.js
├── data/
│   ├── api.js              ← fetch ทุกอย่างจาก Backend
│   ├── items.js            ← Mock data สำรอง
│   └── news.js
├── components/
│   ├── Header.js
│   ├── ItemCard.js
│   └── FilterModal.js
├── navigation/
│   ├── BottomTabNavigator.js   ← 5 tabs: Home / Items / Store / News / Profile
│   └── StackNavigator.js       ← Login, ItemDetail, Sell, Payment, QR, Verify
└── screens/
    ├── LoginScreen.js          ← Steam Login (expo-web-browser) + Admin Login
    ├── HomeScreen.js           ← ดึง items จาก Backend API
    ├── StoreScreen.js          ← CS2 items 2092 รายการ + Listings tab
    ├── InventoryScreen.js      ← รูปจาก Steam CDN จริง
    ├── ProfileScreen.js        ← Balance, Deposit, Logout, navigate Sell
    ├── SellScreen.js           ← วางขาย item → POST /market/list
    ├── ItemDetailScreen.js     ← Float bar, Price chart, Buy Orders
    ├── NewsScreen.js
    ├── VerificationScreen.js
    ├── PaymentScreen.js
    └── QRPaymentScreen.js
```

---

## 🚀 วิธีรัน

```bash
# เข้าโฟลเดอร์
cd csgoApp

# ติดตั้ง dependencies
npm install

# รัน Expo
npx expo start --clear

# เปิด Android Emulator → กด a ใน terminal
```

### Build APK

```bash
eas build -p android --profile development
```

---

## 🔄 User Flow

```
[Login]
 ↓ กด "Login with Steam" หรือ "Admin Login"
 ↓ ได้ JWT Token → เก็บใน AsyncStorage
 ↓ ไปหน้า Main

[ดู Store]
 ↓ เห็น CS2 items 2092 รายการ
 ↓ Tab "Listings" → เห็นของที่คนวางขาย
 ↓ กด item → ItemDetail → กด BUY

[ซื้อของ]
 ↓ User B กด BUY item ของ User A
 ↓ ตรวจสอบ balance → หัก balance User B
 ↓ เพิ่ม balance User A (หัก fee 5%)
 ↓ ย้าย item เข้า inventory User B
 ↓ บันทึก Order → แสดงใน Order History

[วางขาย]
 ↓ Profile → SellScreen
 ↓ เลือก item → กรอกราคา → กด "วางขาย"
 ↓ POST /market/list → บันทึกลง MongoDB
 ↓ คนอื่น Login → เห็นของใน Store → ซื้อได้

[Logout]
 ↓ ล้าง AsyncStorage → กลับหน้า Login
```

---

## ✅ สิ่งที่ทำเสร็จแล้ว

- [x] Steam Login จริง (expo-web-browser → Steam → Deep Link กลับแอพ)
- [x] Admin Login Button (bypass Steam สำหรับ dev)
- [x] Store แสดง items ค้นหา filter ได้
- [x] Inventory แสดงรูปจาก Steam CDN จริง
- [x] ItemDetailScreen (float bar, price chart, buy orders)
- [x] Bottom Tab Navigation ครบ 5 tabs
- [x] Logout ล้าง token กลับหน้า Login

---

## ❌ สิ่งที่ยังไม่ได้ทำ (Roadmap)

### 🔴 TASK 1 — ระบบซื้อขาย (Priority สูงสุด)
- [ ] เชื่อม `POST /market/buy/:listingId` ให้ทำงานครบ end-to-end
- [ ] แสดง balance อัปเดตทันทีหลังซื้อ/ขาย

### 🟠 TASK 2 — Inventory แยกตาม User
- [ ] `InventoryScreen` ดึงจาก `MongoDB User.inventory[]` แทน Mock data
- [ ] เมื่อซื้อ → ของเข้า inventory / เมื่อขาย → ของออก inventory

### 🟡 TASK 3 — Price History Graph
- [ ] `ItemDetailScreen` แสดงกราฟจากข้อมูลการซื้อขายจริง

### 🟢 TASK 4 — Buy / Sale History
- [ ] ProfileScreen → Buy History
- [ ] ProfileScreen → Sale History

---

## 📄 License

สำหรับการศึกษา — CPE451 Project, 2568