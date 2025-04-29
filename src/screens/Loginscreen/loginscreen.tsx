import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { styles } from './loginscreen.styles';

const LoginScreen = ({ navigation }: any) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    console.log('Logging in with:', emailOrPhone, password);
    // navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Email or Mobile Number"
        placeholderTextColor="#6B7280"
        value={emailOrPhone}
        onChangeText={setEmailOrPhone}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#6B7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? 'eye' : 'eye-off'} size={22} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      {/* Not registered yet? Sign up */}
      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate('Signup')}>
        <View style={{ flexDirection: 'row' }}>
          <Text style={{ color: '#6B7280', fontSize: 16 }}>
            Not registered yet?{' '}
          </Text>
          <Text style={{ fontWeight: 'bold', color: '#2563EB', fontSize: 16 }}>
            Sign up
          </Text>
        </View>
      </TouchableOpacity>

    </View>
  );
};

export default LoginScreen;
