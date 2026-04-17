// csgoApp/src/data/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";

// ====== CONFIG ======
const BASE_URL = process.env.BASE_URL || "http://10.0.2.2:3000";

// ====== AUTH ======

export function getSteamLoginURL() {
  return `${BASE_URL}/auth/steam`;
}

// Mock Login
export async function mockLogin(steamId, displayName = "") {
  const res = await fetch(`${BASE_URL}/auth/mock-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ steamId, displayName }),
  });
  const data = await res.json();
  if (data.token) {
    await AsyncStorage.setItem("token", data.token);
    await AsyncStorage.setItem("steamId", data.steamId || steamId);
    await AsyncStorage.setItem("displayName", data.displayName || displayName);
    await AsyncStorage.setItem("avatar", data.avatar || "");
    await AsyncStorage.setItem("userType", "mock");
  }
  return data;
}

// Verify Token
export async function verifyToken(token) {
  try {
    const t = token || (await AsyncStorage.getItem("token"));
    if (!t) return null;
    const res = await fetch(`${BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    return data.success ? data.user : null;
  } catch {
    return null;
  }
}

// ✅ Logout — ล้างทุก key ให้ครบ
export async function logout() {
  const displayName = await AsyncStorage.getItem("displayName");
  const steamId = await AsyncStorage.getItem("steamId");
  const userType = await AsyncStorage.getItem("userType");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔴 LOGOUT`);
  console.log(`👤 Name    : ${displayName}`);
  console.log(`🆔 SteamId : ${steamId}`);
  console.log(`🏷️  Type    : ${userType}`);
  console.log(`🕐 Time    : ${new Date().toLocaleString("th-TH")}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await AsyncStorage.multiRemove([
    "token",
    "steamId",
    "displayName",
    "avatar",
    "userType",
    "user", 
  ]);
}

// ✅ getStoredUser — รวม key ทุกตัวให้เป็น object เดียว
export async function getStoredUser() {
  try {
    const token = await AsyncStorage.getItem("token");
    if (!token) return null;

    const steamId = (await AsyncStorage.getItem("steamId")) || "";
    const displayName = (await AsyncStorage.getItem("displayName")) || "";
    const avatar = (await AsyncStorage.getItem("avatar")) || "";
    const userType = (await AsyncStorage.getItem("userType")) || "steam";

    return { token, steamId, displayName, avatar, userType };
  } catch {
    return null;
  }
}

export async function getStoredToken() {
  return await AsyncStorage.getItem("token");
}

// ====== ITEMS ======

export async function fetchItems({
  search = "",
  category = "",
  type = "",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append("search", search);

  const cat = category || type;
  if (cat && cat !== "All") params.append("category", cat);

  const url = `${BASE_URL}/items?${params}`;
  console.log("🌐 [API] fetchItems URL:", url);

  const res = await fetch(url);
  const data = await res.json();
  console.log(
    "🌐 [API] fetchItems response total:",
    data.total,
    "| items[0]:",
    data.items?.[0]?.weapon,
  );
  return data;
}

export async function fetchItemById(id) {
  const res = await fetch(`${BASE_URL}/items/${encodeURIComponent(id)}`);
  return res.json();
}

// ====== INVENTORY ======

export async function fetchInventory(steamId) {
  const token = await getStoredToken();
  
  const res = await fetch(`${BASE_URL}/inventory/sync`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  
  if (!res.ok) {
     const errorText = await res.text();
     console.log("❌ API Error text:", errorText);
     return { success: false, items: [] }; 
  }

  return res.json();
}

// ====== MARKET ======

// 🟢 ฟังก์ชันที่หายไป เพิ่มให้แล้วตรงนี้ครับ!
export async function fetchMarketTrends() {
  try {
    const res = await fetch(`${BASE_URL}/market/trends`);
    if (!res.ok) {
      console.log(`❌ Market Trends API Error [${res.status}]`);
      return { success: false, trends: [] };
    }
    return await res.json();
  } catch (error) {
    console.error("❌ Network Error (fetchMarketTrends):", error.message);
    return { success: false, trends: [] };
  }
}

export async function fetchListings() {
  const res = await fetch(`${BASE_URL}/market/listings`);
  return res.json();
}

export async function fetchMyListings() {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/my-listings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createListing(item, price) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ item, price }),
  });
  return res.json();
}

export async function buyItem(listingId) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/buy/${listingId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteListing(listingId) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/list/${listingId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ฟังก์ชันสำหรับวางขายไอเทม
export async function listItem(item, price) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ item, price }),
  });
  return res.json();
}

// ฟังก์ชันสำหรับถอนการวางขาย
export async function removeListing(listingId) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/list/${listingId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

// ====== BALANCE ======

export async function fetchBalance() {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function depositBalance(amount) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
  return res.json();
}

export async function withdrawBalance(payload) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

// ====== ORDERS (HISTORY) ======

export async function fetchBuyOrders() {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/orders/buy`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function fetchSellOrders() {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/orders/sell`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function confirmTradeOffer(orderId, tradeOfferId) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/confirm-trade/${orderId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ tradeOfferId }),
  });
  return res.json();
}