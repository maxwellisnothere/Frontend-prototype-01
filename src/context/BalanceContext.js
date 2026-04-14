import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BalanceContext = createContext(null);

export function BalanceProvider({ children }) {
  const [balance, setBalance] = useState(0);

  // 🔥 โหลด balance จากเครื่อง
  const loadBalance = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem("balance");
      if (saved !== null) {
        setBalance(parseInt(saved));
      }
    } catch (e) {
      console.log("❌ loadBalance error:", e);
    }
  }, []);

  // 🔥 โหลดตอนเปิดแอป
  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  // 🔥 deposit (เพิ่มเงิน + save)
  const deposit = useCallback(async (amount) => {
    try {
      const newBalance = balance + amount;
      setBalance(newBalance);
      await AsyncStorage.setItem("balance", String(newBalance));
      return { success: true };
    } catch (e) {
      console.log("❌ deposit error:", e);
      return { success: false };
    }
  }, [balance]);

  // 🔥 withdraw (หักเงิน + save)
  const withdraw = useCallback(async (amount) => {
    try {
      if (amount > balance) return;

      const newBalance = balance - amount;
      setBalance(newBalance);
      await AsyncStorage.setItem("balance", String(newBalance));
    } catch (e) {
      console.log("❌ withdraw error:", e);
    }
  }, [balance]);

  return (
    <BalanceContext.Provider
      value={{ balance, setBalance, loadBalance, deposit, withdraw }}
    >
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error("useBalance must be used within BalanceProvider");
  return ctx;
}