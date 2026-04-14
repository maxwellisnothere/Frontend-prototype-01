import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screens/LoginScreen';
import VerificationScreen from '../screens/VerificationScreen';
import PaymentScreen from '../screens/PaymentScreen';
import QRPaymentScreen from '../screens/QRPaymentScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import SellScreen from '../screens/SellScreen';
import BuyHistoryScreen from '../screens/BuyHistoryScreen';
import BuyHistoryDetailScreen from '../screens/BuyHistoryDetailScreen';
import SecurityScreen from '../screens/SecurityScreen'; 

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0A0A0F' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Main" component={BottomTabNavigator} />
      <Stack.Screen name="Verification" component={VerificationScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
      <Stack.Screen name="QRPayment" component={QRPaymentScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="Sell" component={SellScreen} />
      <Stack.Screen name="BuyHistory" component={BuyHistoryScreen} />
      <Stack.Screen name="BuyHistoryDetail" component={BuyHistoryDetailScreen} />
      
      
      {/* --- 2. เพิ่มหน้า Security ลงใน Stack --- */}
      <Stack.Screen name="Security" component={SecurityScreen} />
    </Stack.Navigator>
  );
}