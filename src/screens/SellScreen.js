import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  TextInput, Alert, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { listItem, removeListing, fetchInventory, getStoredUser } from '../data/api'; // ✅ นำเข้าฟังก์ชันดึงของจริง

const WEAR_SHORT = {
  'Factory New': 'FN', 'Minimal Wear': 'MW',
  'Field-Tested': 'FT', 'Well-Worn': 'WW', 'Battle-Scarred': 'BS',
};

const SellItemCard = ({ item, onList, onRemove }) => {
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const receiveAmount = price ? Math.round(Number(price) * 0.95) : 0;

  // ใช้ราคาที่ Backend ดึงมาล่าสุด
  const marketPrice = item.marketPriceTHB || item.price || 0;

  const handleList = async () => {
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('❌ กรอกราคา', 'กรุณากรอกราคาที่ต้องการขาย');
      return;
    }
    Alert.alert(
      'ยืนยันการวางขาย',
      `${item.name}\nราคา: ฿${Number(price).toLocaleString()}\nรับจริง: ฿${receiveAmount.toLocaleString()}`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'วางขาย ✅',
          onPress: () => onList(item, Number(price), setLoading),
        },
      ]
    );
  };

  return (
    <View style={ss.card}>
      <View style={[ss.rarityBar, { backgroundColor: item.rarityColor || '#8847FF' }]} />
      <View style={ss.cardBody}>
        <View style={ss.imageBox}>
          <Image source={{ uri: item.image }} style={ss.image} resizeMode="contain" />
          {item.stattrak && <View style={ss.stBadge}><Text style={ss.stText}>ST</Text></View>}
          {item.tradeLock && <View style={[ss.stBadge, { backgroundColor: colors.accentRed }]}><Text style={ss.stText}>🔒</Text></View>}
        </View>

        <View style={ss.infoBox}>
          <Text style={ss.weapon}>{item.weapon}</Text>
          <Text style={ss.skin} numberOfLines={1}>{item.skin}</Text>
          {item.wear && (
            <View style={ss.wearRow}>
              <View style={[ss.wearDot, { backgroundColor: item.rarityColor || '#8847FF' }]} />
              <Text style={ss.wearText}>{WEAR_SHORT[item.wear] || item.wear}</Text>
              {item.float != null && <Text style={ss.floatText}>  {item.float.toFixed(4)}</Text>}
            </View>
          )}
          <Text style={ss.marketPrice}>ราคาตลาด: ฿{marketPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</Text>
        </View>

        <View style={ss.actionBox}>
          {item.listed ? (
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={ss.listedText}>✅ วางขายแล้ว</Text>
              <TouchableOpacity onPress={() => onRemove(item)} style={ss.removeBtn}>
                <Text style={ss.removeBtnText}>ถอน</Text>
              </TouchableOpacity>
            </View>
          ) : item.tradeLock ? (
            <View style={ss.lockedBadge}>
              <Text style={ss.lockedText}>🔒 ล็อค</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[ss.sellBtn, loading && { opacity: 0.6 }]}
              onPress={handleList}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator size="small" color="#000" />
                : <Text style={ss.sellBtnText}>วางขาย</Text>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!item.listed && !item.tradeLock && (
        <View style={ss.priceSection}>
          <View style={ss.priceInputRow}>
            <Text style={ss.priceInputLabel}>ราคาขาย (฿)</Text>
            {/* ✅ พอกด 'ใช้ราคาตลาด' จะเอา marketPrice มาเติมให้อัตโนมัติ */}
            <TouchableOpacity onPress={() => setPrice(String(Math.floor(marketPrice)))}>
              <Text style={ss.suggestBtn}>ใช้ราคาตลาด</Text>
            </TouchableOpacity>
          </View>
          <View style={ss.inputRow}>
            <Text style={ss.currencySymbol}>฿</Text>
            <TextInput
              style={ss.priceInput}
              value={price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.textMuted}
            />
            {price.length > 0 && (
              <View style={ss.receiveBox}>
                <Text style={ss.receiveLabel}>รับจริง</Text>
                <Text style={ss.receiveAmount}>฿{receiveAmount.toLocaleString()}</Text>
              </View>
            )}
          </View>
          {price.length > 0 && (
            <Text style={ss.feeNote}>หักค่าธรรมเนียม 5%</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default function SellScreen({ route, navigation }) {
  // ✅ รับไอเทมที่กดมาจากหน้า Inventory (ถ้ามี)
  const targetItem = route.params?.item;

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loadingItems, setLoadingItems] = useState(true);

  // ✅ โหลดคลังแสงของจริง
  useEffect(() => {
    loadRealInventory();
  }, []);

  const loadRealInventory = async () => {
    setLoadingItems(true);
    try {
      const user = await getStoredUser();
      if (!user?.steamId) return;

      const data = await fetchInventory(user.steamId);
      if (data.success && data.items) {
        // จัดระเบียบข้อมูลให้เข้ากับ UI ของคุณ
        let mappedItems = data.items.map(item => ({
          ...item,
          id: item.assetId || item.id || Math.random().toString(),
          image: item.image || (item.icon_url ? `https://steamcommunity-a.akamaihd.net/economy/image/${item.icon_url}` : null),
        }));

        // ✅ จุดสำคัญ: ถ้าส่ง targetItem มา ให้ดันมันขึ้นไปอยู่บนสุดของลิสต์!
        if (targetItem) {
          const targetId = targetItem.assetId || targetItem.id;
          mappedItems.sort((a, b) => {
            if (a.assetId === targetId || a.id === targetId) return -1;
            if (b.assetId === targetId || b.id === targetId) return 1;
            return 0;
          });
        }

        setItems(mappedItems);
      }
    } catch (err) {
      console.log('Load Inventory Error:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleList = async (item, price, setLoading) => {
    setLoading(true);
    try {
      const data = await listItem(item, price);
      if (data.success) {
        setItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, listed: true, listingId: data.listing.listingId }
            : i
        ));
        Alert.alert(
          '✅ วางขายสำเร็จ!',
          `${item.name}\nราคา: ฿${price.toLocaleString()}\n\nของปรากฏในหน้าร้านค้าแล้วครับ คนอื่นสามารถซื้อได้`
        );
      } else {
        Alert.alert('❌ Error', data.error || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      Alert.alert('❌ Connection Error', 'ไม่สามารถเชื่อมต่อ Backend ได้\n' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (item) => {
    Alert.alert('ถอนรายการ', `ถอน ${item.name} ออกจากการขาย?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ถอน', style: 'destructive',
        onPress: async () => {
          try {
            if (item.listingId) {
              await removeListing(item.listingId);
            }
            setItems(prev => prev.map(i =>
              i.id === item.id ? { ...i, listed: false, listingId: null } : i
            ));
            Alert.alert('✅ ถอนสำเร็จ', 'ของถูกถอนออกจากการขายแล้ว');
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const filtered = items.filter(item => {
    if (activeTab === 'listed')    return item.listed;
    if (activeTab === 'available') return !item.listed && !item.tradeLock;
    return true;
  });

  const listedCount   = items.filter(i => i.listed).length;
  // ใช้ราคาที่ตั้งขาย (ถ้ามี) หรือราคาตลาดในการคำนวณมูลค่ารวม
  const listedValue   = items.filter(i => i.listed).reduce((s, i) => s + (i.listingPrice || i.price || 0), 0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>วางขาย Skins</Text>
        <View style={{ width: 40 }} />
      </View>

      {listedCount > 0 && (
        <View style={s.summaryBanner}>
          <View>
            <Text style={s.summaryLabel}>วางขายอยู่</Text>
            <Text style={s.summaryValue}>{listedCount} ชิ้น</Text>
          </View>
          <View style={s.summaryDivider} />
          <View>
            <Text style={s.summaryLabel}>มูลค่ารวม</Text>
            <Text style={[s.summaryValue, { color: colors.primary }]}>฿{listedValue.toLocaleString()}</Text>
          </View>
          <View style={s.summaryDivider} />
          <View>
            <Text style={s.summaryLabel}>รับจริง (~95%)</Text>
            <Text style={[s.summaryValue, { color: colors.accentGreen }]}>฿{Math.round(listedValue * 0.95).toLocaleString()}</Text>
          </View>
        </View>
      )}

      <View style={s.tabRow}>
        {[
          { key: 'all',       label: `ทั้งหมด (${items.length})` },
          { key: 'available', label: `ขายได้ (${items.filter(i => !i.listed && !i.tradeLock).length})` },
          { key: 'listed',    label: `วางขาย (${listedCount})` },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, activeTab === t.key && s.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingItems ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textMuted, marginTop: 10 }}>กำลังดึงข้อมูลคลังแสง...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SellItemCard item={item} onList={handleList} onRemove={handleRemove} />
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>📦</Text>
              <Text style={s.emptyText}>ไม่มีไอเทมในหมวดนี้</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: colors.textPrimary, fontSize: 22, fontWeight: '600' },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '800' },
  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 3 },
  summaryValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.border },
  tabRow: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
  list: { padding: 12, paddingBottom: 30 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 12, opacity: 0.4 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});

const ss = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg, borderRadius: 12,
    marginBottom: 10, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  rarityBar: { height: 3 },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  imageBox: {
    width: 80, height: 56, backgroundColor: colors.surfaceElevated,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  image: { width: 76, height: 52 },
  stBadge: {
    position: 'absolute', top: 2, left: 2, backgroundColor: '#CF6A32',
    borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1,
  },
  stText: { color: '#fff', fontSize: 7, fontWeight: '800' },
  infoBox: { flex: 1 },
  weapon: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginBottom: 1 },
  skin: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 3 },
  wearRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  wearDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
  wearText: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  floatText: { color: colors.textMuted, fontSize: 9 },
  marketPrice: { color: colors.textMuted, fontSize: 10 },
  actionBox: { alignItems: 'flex-end', minWidth: 70 },
  sellBtn: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, minWidth: 70, alignItems: 'center',
  },
  sellBtnText: { color: '#000', fontSize: 12, fontWeight: '800' },
  listedText: { color: colors.accentGreen, fontSize: 11, fontWeight: '700' },
  removeBtn: {
    borderWidth: 1, borderColor: colors.accentRed, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 3, marginTop: 4,
  },
  removeBtnText: { color: colors.accentRed, fontSize: 10, fontWeight: '700' },
  lockedBadge: {
    backgroundColor: colors.accentRed + '22', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.accentRed + '44',
  },
  lockedText: { color: colors.accentRed, fontSize: 11, fontWeight: '600' },
  priceSection: {
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: colors.surfaceElevated,
  },
  priceInputRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  priceInputLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  suggestBtn: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.cardBg, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 10, gap: 6,
  },
  currencySymbol: { color: colors.primary, fontSize: 16, fontWeight: '800' },
  priceInput: {
    flex: 1, color: colors.textPrimary,
    fontSize: 16, fontWeight: '700', paddingVertical: 10,
  },
  receiveBox: { alignItems: 'flex-end' },
  receiveLabel: { color: colors.textMuted, fontSize: 9 },
  receiveAmount: { color: colors.accentGreen, fontSize: 13, fontWeight: '800' },
  feeNote: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
});