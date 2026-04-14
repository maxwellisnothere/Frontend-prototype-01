import React, { createContext, useContext, useState } from "react";

const HistoryContext = createContext();

export function HistoryProvider({ children }) {
  const [history, setHistory] = useState([]);

  // items ที่รับเข้ามาควรมี field เต็ม จาก PaymentScreen
  // { weapon, skin, price, image, rarityColor, rarity, paymentMethod, serviceFee, total }
  const addHistory = (items) => {
    const timestamp = Date.now();

    const newItems = items.map((item, idx) => ({
      id: `${timestamp}_${idx}_${Math.random()}`,

      // ชื่อสำหรับแสดงในลิสต์
      name:
        item?.weapon && item?.skin
          ? `${item.weapon} | ${item.skin}`
          : item?.name || "Unknown Item",

      // ข้อมูลดิบสำหรับหน้า Detail
      weapon: item?.weapon || "",
      skin: item?.skin || "",
      price: typeof item?.price === "number" ? item.price : parseInt(item?.price) || 0,
      serviceFee: typeof item?.serviceFee === "number" ? item.serviceFee : 0,
      total: typeof item?.total === "number" ? item.total : 0,
      image: item?.image || null,
      rarityColor: item?.rarityColor || "#888",
      rarity: item?.rarity || "",
      float:     item?.float     ?? null,
      wear:      item?.wear      || "",
      wearColor: item?.wearColor || "#888",
      stattrak:  item?.stattrak === true,
      paymentMethod: item?.paymentMethod || "Unknown",

      date: new Date().toLocaleDateString("th-TH"),
      timestamp,
    }));

    setHistory((prev) => [...newItems, ...prev]);
  };

  return (
    <HistoryContext.Provider value={{ history, addHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export function useHistory() {
  return useContext(HistoryContext);
}