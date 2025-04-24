import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const SignUpScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const navigation = useNavigation();

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!agree) {
      Alert.alert('Error', 'You must agree to the Terms and Conditions');
      return;
    }

    try {
      await supabase.auth.signOut();
      console.log('Signed out any existing session');

      console.log('Attempting to sign up:', { email, name });
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        console.error('Supabase Auth error:', error);
        throw error;
      }

      const user = data.user;
      console.log('User ID:', user.id);

      console.log('Attempting to insert user:', { id: user.id, email, name });
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: user.id, email, name });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      await AsyncStorage.setItem('user_id', user.id);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session after signup:', sessionData, 'Session Error:', sessionError);

      if (!sessionData.session) {
        throw new Error('No session found after signup');
      }

      Alert.alert('Success', 'Account created successfully! Please complete your profile.');
      navigation.navigate('CompleteProfile');
    } catch (error) {
      Alert.alert('Error', `Failed to create account: ${error.message}`);
      console.error('Error signing up:', error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Create your account to get started</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

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

        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={[styles.checkbox, agree && styles.checkboxChecked]}
            onPress={() => setAgree(!agree)}
          >
            {agree && <Text style={styles.checkmark}>✔</Text>}
          </TouchableOpacity>
          <Text style={styles.checkboxText}> Agree with Terms and Conditions</Text>
        </View>

        <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton}>
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <View style={styles.signInPrompt}>
          <Text style={styles.signInPromptText}>
            Already have an account?{' '}
            <Text
              style={styles.signInLink}
              onPress={() => navigation.navigate('SignIn')}
            >
              Sign In
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#704F38',
    borderColor: '#704F38',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  checkboxText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  signUpButton: {
    backgroundColor: '#704F38',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
  signInPrompt: {
    alignItems: 'center',
  },
  signInPromptText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  signInLink: {
    color: '#704F38',
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;