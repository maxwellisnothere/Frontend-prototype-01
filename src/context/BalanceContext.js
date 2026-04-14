import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchBalance } from '../data/api'; // ✅ นำเข้า API ดึงยอดเงินจาก Database

const BalanceContext = createContext();

export const BalanceProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);

  // 🟢 ฟังก์ชันไปดึงยอดเงินจาก Backend (MongoDB)
  const loadBalance = async () => {
    try {
      const data = await fetchBalance();
      
      // ถ้า Backend ส่งข้อมูล balance กลับมา ให้เอามาอัปเดต State
      if (data && data.balance !== undefined) {
        setBalance(data.balance); 
      }
    } catch (error) {
      console.log("Error loading balance:", error);
    }
  };

  // (ถอนเงิน ตอนนี้เอาเป็นตัวจำลองไว้ก่อน ถ้าทำ API ถอนเงินเสร็จค่อยมาแก้ให้ยิง API แบบ loadBalance ครับ)
  const withdraw = async (amount) => {
    // อนาคตใส่ API ถอนเงินตรงนี้ เช่น: await withdrawBalanceAPI(amount);
    // จากนั้นสั่งโหลดเงินใหม่: await loadBalance();
    
    // แบบชั่วคราว (Local) เพื่อไม่ให้หน้า Profile พังเวลาเผลอกด
    if (balance >= amount) {
        setBalance(prev => prev - amount);
    }
  };

  // ให้มันโหลดข้อมูลเงินทันทีที่เปิดแอปหรือล็อกอินเข้ามา
  useEffect(() => {
    loadBalance();
  }, []);

  return (
    <BalanceContext.Provider value={{ balance, loadBalance, withdraw }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => useContext(BalanceContext);