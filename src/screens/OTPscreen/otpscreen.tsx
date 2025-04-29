import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { styles } from './otpscreen.styles';
import { getAuth, signInWithPhoneNumber, updateProfile } from '@react-native-firebase/auth';

const OTPVerificationScreen = ({ navigation, route }: any) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP for phone auth
  const [timer, setTimer] = useState(30);
  const [confirmationResult, setConfirmationResult] = useState<any>(route.params.confirmationResult); // State for confirmation result
  const { phoneNumber, email, password, fullName, userId } = route.params;

  const auth = getAuth(); // Initialize auth instance

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
  }, [timer]);

  const handleChangeText = (text: string, index: number) => {
    if (text.length > 1) return; // Only allow 1 digit

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    console.log('Entered OTP:', otpCode);
    if (otpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    try {
      // Verify the phone OTP
      const credential = await confirmationResult.confirm(otpCode);
      console.log('Phone number verified:', credential.user.uid);

      // Update user profile with display name only (phone number is linked via verification)
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateProfile(currentUser, {
          displayName: fullName,
        });
        console.log('User profile updated with display name:', fullName);
      }

      // Optionally update additional user data in Firestore or elsewhere
      navigation.navigate('HomeScreen', { userId, email, phoneNumber, fullName });
    } catch (error: any) {
      console.error('OTP Verification Error:', error);
      Alert.alert('Verification Failed', error.message || 'Invalid OTP. Please try again.');
    }
  };

  const handleResend = async () => {
    setTimer(30);
    try {
      const newConfirmation = await signInWithPhoneNumber(auth, phoneNumber);
      setConfirmationResult(newConfirmation); // Update confirmation result
      console.log('Resent OTP to:', phoneNumber);
      Alert.alert('OTP Resent', 'A new OTP has been sent to your phone.');
    } catch (error: any) {
      console.error('Error resending OTP:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text>Enter the 6-digit code sent to {phoneNumber}</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={inputRefs[index]}
            style={styles.otpInput}
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChangeText(text, index)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Verify OTP</Text>
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        {timer > 0 ? (
          <Text style={styles.resendText}>Resend OTP in {timer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={[styles.resendText, { color: '#2563EB' }]}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default OTPVerificationScreen;