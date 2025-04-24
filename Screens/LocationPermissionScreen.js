import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

const LocationPermissionScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const requestLocation = async () => {
    setIsLoading(true);
    try {
      // Kiểm tra session qua Supabase Auth
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setIsLoading(false);
        Alert.alert('Error', 'Please sign in first.', [
          { text: 'OK', onPress: () => navigation.navigate('SignIn') },
        ]);
        return;
      }

      const userId = sessionData.session.user.id;

      // Lưu user_id vào AsyncStorage nếu chưa có
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) {
        await AsyncStorage.setItem('user_id', userId);
      }

      // Yêu cầu quyền vị trí
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoading(false);
        Alert.alert('Permission Denied', 'Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

      const address = await Location.reverseGeocodeAsync(location.coords);
      const formattedAddress = address[0]
        ? [
            address[0].street || '',
            address[0].subregion || '',
            address[0].region || '',
            address[0].city || '',
          ]
            .filter(Boolean)
            .join(', ')
        : 'Unknown Location';

      // Cập nhật vị trí vào bảng users
      const { error } = await supabase
        .from('users')
        .update({ location: formattedAddress })
        .eq('id', userId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      // Lưu vào AsyncStorage
      await AsyncStorage.setItem('user_location', formattedAddress);

      Alert.alert('Location Acquired', `Address: ${formattedAddress}`, [
        {
          text: 'Continue',
          onPress: () => navigation.navigate('Home', { location: formattedAddress }),
        },
      ]);
    } catch (error) {
      console.error('Error getting location:', error.message);
      Alert.alert('Error', `Failed to get location: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      // Kiểm tra session qua Supabase Auth
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        Alert.alert('Error', 'Please sign in first.', [
          { text: 'OK', onPress: () => navigation.navigate('SignIn') },
        ]);
        return;
      }

      const userId = sessionData.session.user.id;

      // Lưu user_id vào AsyncStorage nếu chưa có
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) {
        await AsyncStorage.setItem('user_id', userId);
      }

      // Cập nhật location thành null
      const { error } = await supabase
        .from('users')
        .update({ location: null })
        .eq('id', userId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      // Lưu vào AsyncStorage
      await AsyncStorage.setItem('user_location', 'Unknown Location');
      navigation.navigate('Home', { location: 'Unknown Location' });
    } catch (error) {
      console.error('Error skipping location:', error.message);
      Alert.alert('Error', `Failed to skip location: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
       <Image source={require('../assets/location-logo.png')} style={styles.logo} />
      <Text style={styles.title}>What is Your Location?</Text>
      <Text style={styles.subtitle}>
        We need to know your location in order to suggest nearby services.
      </Text>

      {isLoading ? (
        <ActivityIndicator size="large" color="#704F38" />
      ) : (
        <>
          <TouchableOpacity style={styles.button} onPress={requestLocation}>
            <Text style={styles.buttonText}>Allow Location Access</Text>
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.skipButton}
            onPress={() =>
              Alert.alert('Skip Location?', 'Some features may not work without location.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Skip', onPress: handleSkip },
              ])
            }
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 64,
    height: 84,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  button: {
    backgroundColor: '#704F38',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  linkButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#704F38',
    fontSize: 16,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
});

export default LocationPermissionScreen;