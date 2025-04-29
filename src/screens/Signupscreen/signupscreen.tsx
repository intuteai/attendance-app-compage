import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import CountryPicker, { CountryCode } from 'react-native-country-picker-modal';
import { styles } from './signupscreen.styles'; 
import { getAuth, createUserWithEmailAndPassword, signInWithPhoneNumber } from '@react-native-firebase/auth';

// Define navigation and route parameter types for better TypeScript support
interface SignupScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const [phoneNumber, setPhoneNumber] = useState(''); // Use '5550100001' for testing
  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91'); // Use '+1' for testing
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null); // For phone OTP
  const [loading, setLoading] = useState(false); // Add loading state

  const auth = getAuth(); // Initialize auth instance

  const handleSelectCountry = (country: any) => {
    setCountryCode(country.cca2 as CountryCode);
    setCallingCode(country.callingCode[0]);
  };

  const handleSendOtp = async () => {
    if (phoneNumber.length < 6) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number.');
      return;
    }
    if (!email.includes('@') || email.length < 5) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
  
    // Clean the phone number to remove spaces and non-digit characters
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    const fullPhoneNumber = `+${callingCode}${cleanedPhoneNumber}`;
  
    // Log the exact value for debugging
    console.log('Full phone number being sent:', fullPhoneNumber);
  
    // Validate E.164 format
    const e164Pattern = /^\+[1-9]\d{1,14}$/;
    if (!e164Pattern.test(fullPhoneNumber)) {
      Alert.alert('Invalid Format', 'Phone number must be in E.164 format (e.g., +919896379181).');
      return;
    }
  
    setLoading(true);
  
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created with email and password:', userCredential.user.uid);
  
      // Send OTP using the cleaned phone number
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber);
      setConfirmationResult(confirmation);
      console.log('Phone OTP sent to:', fullPhoneNumber);
  
      // Navigate to OTP screen
      navigation.navigate('OtpScreen', {
        phoneNumber: fullPhoneNumber,
        email,
        password,
        fullName,
        confirmationResult: confirmation,
        userId: userCredential.user.uid,
      });
    } catch (error: any) {
      console.error('Error during signup:', error);
      if (error.code === 'auth/invalid-phone-number') {
        Alert.alert(
          'Invalid Phone Number',
          'Please enter a valid phone number in E.164 format (e.g., +919896379181).'
        );
      } else if (error.code === 'auth/billing-not') {
        Alert.alert(
          'Billing Issue',
          'Phone authentication requires billing to be enabled. Use a test number (e.g., +15550100001, OTP: 123456) or enable billing in Firebase.'
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to sign up. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    console.log('Navigate to Login Screen');
    navigation.navigate('LoginScreen');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Create an Account</Text>

      {/* Username Input */}
      <View style={styles.singleInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#6B7280"
          autoCapitalize="words" 
          value={fullName}
          onChangeText={setFullName}
          editable={!loading}
        />
      </View>

      {/* Country Code Picker + Phone Number */}
      <View style={styles.inputContainer}>
        <CountryPicker
          countryCode={countryCode}
          withCallingCodeButton
          withFlag
          withEmoji
          withFilter
          onSelect={handleSelectCountry}
          containerButtonStyle={styles.countryPicker}
        />
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          placeholderTextColor="#6B7280"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          editable={!loading}
        />
      </View>

      {/* Email Input */}
      <View style={styles.singleInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#6B7280"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />
      </View>

      {/* Password Input */}
      <View style={styles.singleInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />
      </View>

      {/* Send OTP Button */}
      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.6 }]} 
        onPress={handleSendOtp} 
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>

      {/* Login redirect */}
      <TouchableOpacity onPress={handleLoginRedirect} style={{ marginTop: 20 }} disabled={loading}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ color: '#6B7280', fontSize: 16 }}>
            Already have an account?{' '}
          </Text>
          <Text style={{ fontWeight: 'bold', color: '#2563EB', fontSize: 16 }}>
            Login
          </Text>
        </View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;