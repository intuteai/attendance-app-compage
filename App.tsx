import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { RootStackParamList } from './navigation/types';

// Screens
// import SignupScreen from './src/screens/Signupscreen/signupscreen';
// import OTPVerificationScreen from './src/screens/OTPscreen/otpscreen';
import HomeScreen from './src/screens/Homescreen/homescreen';
// import LoginScreen from './src/screens/Loginscreen/loginscreen';
import DashboardScreen from './src/screens/Dashboard/dashboard';
import AddEmployeeScreen from './src/screens/AddEmployee/AddEmployeeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Optional: dark nav theme to match your app colors (prevents white flash)
const DarkNavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0B1220',
    card: '#0B1220',
    text: '#F8FAFC',
    border: '#0B1220',
    primary: '#0EA5E9',
  },
};

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Hide OS status bar for a true full-screen look */}
      <StatusBar
        hidden
        animated
        translucent
        backgroundColor="transparent"
        barStyle={Platform.OS === 'ios' ? 'light-content' : 'light-content'}
      />

      <NavigationContainer theme={DarkNavTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,      // hide React Navigation header
            contentStyle: { backgroundColor: '#0B1220' },
          }}
        >
          {/* <Stack.Screen name="Signup" component={SignupScreen} /> */}
          {/* <Stack.Screen name="OTP" component={OTPVerificationScreen} /> */}
          <Stack.Screen name="Home" component={HomeScreen} />
          {/* <Stack.Screen name="Login" component={LoginScreen} /> */}
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;