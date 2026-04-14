import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import StackNavigator from "./src/navigation/StackNavigator";
import { BalanceProvider } from "./src/context/BalanceContext";
import { HistoryProvider } from "./src/context/HistoryContext";

export default function App() {
  return (
    <BalanceProvider>
      <HistoryProvider>
        <NavigationContainer>
          <StackNavigator />
        </NavigationContainer>
      </HistoryProvider>
    </BalanceProvider>
  );
}