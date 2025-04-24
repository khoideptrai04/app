import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const SignInScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase Auth error:', error);
        throw error;
      }

      const user = data.user;
      console.log('User ID:', user.id);

      await AsyncStorage.setItem('user_id', user.id);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session after signin:', sessionData, 'Session Error:', sessionError);

      if (!sessionData.session) {
        throw new Error('No session found after signin');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('phone_number, gender')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        if (userError.code === 'PGRST116') {
          navigation.navigate('CompleteProfile');
          return;
        }
        throw userError;
      }

      if (!userData.phone_number || !userData.gender) {
        console.log('Profile incomplete, navigating to CompleteProfile');
        navigation.navigate('CompleteProfile');
      } else {
        console.log('Profile complete, navigating to Home');
        Alert.alert('Success', 'Signed in successfully!');
        navigation.navigate('Home');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to sign in: ${error.message}`);
      console.error('Error signing in:', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@gmail.com"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="************"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.signUpPrompt}>
          <Text style={styles.signUpPromptText}>
            Don’t have an account?{' '}
            <Text
              style={styles.signUpLink}
              onPress={() => navigation.navigate('SignUp')}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    color: '#333',
  },
  signInButton: {
    backgroundColor: '#704F38',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
  signUpPrompt: {
    alignItems: 'center',
  },
  signUpPromptText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  signUpLink: {
    color: '#704F38',
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
});

export default SignInScreen;