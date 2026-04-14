// csgoApp/src/data/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';

// ====== CONFIG ======
// เปลี่ยน IP ให้ตรงกับเครื่องคุณ
const BASE_URL = 'https://defuse-th-backend.onrender.com';

// ====== AUTH ======

// Steam Login จริง — คืน URL ให้ไปเปิด browser
export function getSteamLoginURL() {
  return `${BASE_URL}/auth/steam`;
}

// Mock Login — กรอก SteamID ตรงๆ
export async function mockLogin(steamId, username = '') {
  const res = await fetch(`${BASE_URL}/auth/mock-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steamId, username }),
  });
  const data = await res.json();
  if (data.token) {
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

// Admin Login — ใช้ password
export async function adminLogin(password) {
  const res = await fetch(`${BASE_URL}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (data.token) {
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
  }
  return data;
}

// Verify token ที่ได้จาก Steam callback
export async function verifySteamCallback(token, steamId, username, avatar) {
  // บันทึก token + สร้าง user object จาก callback params
  const user = { steamId, username, avatar, balance: 0 };
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  // ดึงข้อมูลจริงจาก server
  return await verifyToken(token);
}

// Verify Token
export async function verifyToken(token) {
  try {
    const t = token || await AsyncStorage.getItem('token');
    if (!t) return null;
    const res = await fetch(`${BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (data.valid) {
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
}

// Logout
export async function logout() {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
}

// ดึง user ที่ login อยู่
export async function getStoredUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function getStoredToken() {
  return await AsyncStorage.getItem('token');
}

// ====== ITEMS ======

export async function fetchItems({ search = '', type = '', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append('search', search);
  if (type && type !== 'All') params.append('type', type);

  const res = await fetch(`${BASE_URL}/items?${params}`);
  return res.json();
}

export async function fetchItemById(id) {
  const res = await fetch(`${BASE_URL}/items/${encodeURIComponent(id)}`);
  return res.json();
}

// ====== INVENTORY ======

export async function fetchInventory(steamId) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/inventory/${steamId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ====== MARKET ======

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
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ item, price }),
  });
  return res.json();
}

export async function buyItem(listingId) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/buy/${listingId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function deleteListing(listingId) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/list/${listingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ====== BALANCE ======

export async function fetchBalance() {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  // อัปเดต balance ใน storage ด้วย
  const user = await getStoredUser();
  if (user && data.balance !== undefined) {
    user.balance = data.balance;
    await AsyncStorage.setItem('user', JSON.stringify(user));
  }
  return data;
}

export async function depositBalance(amount) {
  const token = await getStoredToken();
  const res = await fetch(`${BASE_URL}/market/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
  return res.json();
}