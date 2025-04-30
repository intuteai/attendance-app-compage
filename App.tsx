import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SignupScreen from './src/screens/Signupscreen/signupscreen';
import OTPVerificationScreen from './src/screens/OTPscreen/otpscreen';
import HomeScreen from './src/screens/Homescreen/homescreen';
import LoginScreen from './src/screens/Loginscreen/loginscreen';
import DashboardScreen from './src/screens/Dashboard/dashboard';

// Define the type for the navigation stack
type RootStackParamList = {
  Signup: undefined;
  OTP: undefined;
  Home: undefined;
  Login: undefined;
  Dashboard: { videoPaths?: string[] }; // Match the params expected by DashboardScreen
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTP" component={OTPVerificationScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;