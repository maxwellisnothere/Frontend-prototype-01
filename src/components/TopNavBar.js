import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export default function TopNavBar({ onRefresh, onProfile }) {
  return (
    <View style={styles.navBar}>
      <View style={styles.logoRow}>
        <View style={styles.logoBadge}><Text style={styles.logoLetter}>D</Text></View>
        <Text style={styles.logoText}>DEFUSE <Text style={styles.logoHL}>TH</Text></Text>
      </View>
      <View style={styles.navRight}>
        <TouchableOpacity style={styles.iconBtn} onPress={onRefresh} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onProfile} activeOpacity={0.85}>
          <Feather name="user" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoBadge: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: 12 },
  logoLetter: { color: "#000", fontFamily: 'Rajdhani_700Bold', fontSize: 18 },
  logoText: { color: colors.textPrimary, fontFamily: 'Rajdhani_700Bold', fontSize: 20, fontStyle: 'italic', letterSpacing: 1 },
  logoHL: { color: colors.primary },
  navRight: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});