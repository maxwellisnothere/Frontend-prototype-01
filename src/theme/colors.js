export const colors = {
  // --- พื้นหลังและพื้นผิว (Background & Surfaces) ---
  background: '#070B14',        // สีน้ำเงินเข้มเกือบดำ (Abyss Blue) ให้มิติความลึก
  surface: '#101623',           // สีพื้นผิวหลักสำหรับการ์ดหรือคอนเทนเนอร์
  surfaceElevated: '#1A2235',   // สีพื้นผิวที่ยกระดับขึ้นมา สำหรับไฮไลต์ข้อมูลสำคัญ
  border: 'rgba(0, 229, 255, 0.2)',   // ขอบสี Electric Blue แบบโปร่งใส
  borderLight: 'rgba(0, 229, 255, 0.4)', // ขอบสีสว่างสำหรับเน้น (Focus State)

  // --- สีหลัก (Primary Colors) ---
  primary: '#00E5FF',           // สีฟ้า Electric Blue (Neon Cyan)
  primaryDark: '#00B3CC',       // สีฟ้าเข้ม สำหรับสถานะการกด (Active/Pressed)
  primaryLight: '#66FFFF',      // สีฟ้าสว่าง สำหรับเอฟเฟกต์เรืองแสง (Glow Effect)

  // --- สีรองและสถานะ (Accents & Status) ---
  accent: '#FF0055',            // สีชมพูอมแดง (Neon Pink/Red) ตัดกับสีฟ้าได้อย่างลงตัว
  accentGreen: '#00FF66',       // สีเขียวสะท้อนแสง สำหรับสถานะออนไลน์/สำเร็จ
  accentRed: '#FF0055',         // แจ้งเตือนข้อผิดพลาด
  accentPurple: '#D500F9',      // สีม่วง Neon
  accentBlue: '#2979FF',

  // --- สีข้อความ (Typography) ---
  textPrimary: '#FFFFFF',       // ขาวบริสุทธิ์ สำหรับหัวข้อและตัวเลขราคา
  textSecondary: '#A0AABF',     // สีเทาอมฟ้าสว่าง สำหรับข้อความรายละเอียด
  textMuted: '#5C677D',         // สีเทาเข้ม สำหรับข้อมูลรองหรือปุ่มที่ไม่ได้ใช้งาน

  // --- สีระดับความหายากของไอเทม (ปรับความสว่างให้เข้ากับ Dark Theme) ---
  rarityConsumer: '#828C9E',    
  rarityIndustrial: '#4A90E2',  
  rarityMilSpec: '#00E5FF',     
  rarityRestricted: '#B142F5',  
  rarityClassified: '#E53935',  
  rarityCovert: '#FF0055',      
  rarityGold: '#FFD700',        

  // --- UI Elements Specifics ---
  liveBadge: '#FF0055',         
  tabActive: '#00E5FF',         
  tabInactive: '#5C677D',       

  // --- เลเยอร์ซ้อนทับ (Overlays) ---
  cardBg: 'rgba(16, 22, 35, 0.8)',       // พื้นหลังการ์ดโปร่งแสงเล็กน้อย
  overlayDark: 'rgba(7, 11, 20, 0.85)',  // พื้นหลังเวลาเปิด Modal (Dim Background)
  overlayLight: 'rgba(0, 229, 255, 0.1)', // ไฮไลต์แสงตกกระทบ
};