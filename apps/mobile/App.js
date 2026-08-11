import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import FarmerScreen from './src/screens/FarmerScreen';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />
      <FarmerScreen />
    </SafeAreaView>
  );
}