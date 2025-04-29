import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import SignupScreen from './src/screens/Signupscreen/signupscreen';
import OTPVerificationScreen from './src/screens/OTPscreen/otpscreen';
import HomeScreen from './src/screens/Homescreen/homescreen';
import LoginScreen from './src/screens/Loginscreen/loginscreen';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator 
        // initialRouteName="Signup" screenOptions={{ headerShown: false }}
        >
          {/* <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="OTP" component={OTPVerificationScreen} /> */}
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;
