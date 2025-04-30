import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { styles } from './signupscreen.styles';
import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth';

// Define navigation params to match RootStackParamList
interface SignupScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
  };
}

const SignupScreen = ({ navigation }: SignupScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const auth = getAuth();

  const handleSignup = async () => {
    if (!email.includes('@') || email.length < 5) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created with email and password:', userCredential.user.uid);

      // Navigate to HomeScreen with necessary params (excluding password)
      navigation.navigate('Home', {
        email,
        fullName,
        userId: userCredential.user.uid,
      });
    } catch (error: any) {
      console.error('Error during signup:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      if (error.code === 'auth/email-already-in-use') {
        Alert.alert('Email in Use', 'This email is already registered.');
      } else if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        Alert.alert('Weak Password', 'Password must be at least 6 characters.');
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

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleSignup}
        activeOpacity={0.8}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

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