import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const GlowBackground = ({ color }) => {
  return (
    <Svg 
      height="100%" 
      width="100%" 
      viewBox="0 0 200 200" 
      style={StyleSheet.absoluteFill}
      preserveAspectRatio="none"
    >
      <Defs>
        <RadialGradient id="rarityGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          {/* 🟢 เร่งความเข้มตรงกลางให้เป็น 0.85 (จากเดิม 0.5) แสงจะพุ่งและชัดขึ้นมาก */}
          <Stop offset="0%" stopColor={color} stopOpacity="0.85" />
          {/* 🟢 ปรับรัศมีวงกลางให้กว้างขึ้นและเข้มขึ้น */}
          <Stop offset="50%" stopColor={color} stopOpacity="0.35" />
          {/* ขอบนอกสุดค่อยๆ เฟดออกเนียนๆ */}
          <Stop offset="100%" stopColor={color} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      
      <Rect x="0" y="0" width="200" height="200" fill="url(#rarityGrad)" />
    </Svg>
  );
};

export default GlowBackground;