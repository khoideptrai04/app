import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.circle}>
        <Text style={styles.logo}>f</Text>
      </View>
      <Text style={styles.brandName}>fashion.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B5B29', // Giữ màu này như thiết kế ban đầu
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    fontSize: 48,
    color: '#FFFFFF',
    fontFamily: 'Poppins-Bold', // Font Poppins Bold cho logo
  },
  brandName: {
    fontSize: 24,
    color: '#000000',
    fontFamily: 'Poppins-Regular', // Font Poppins Regular cho brand name
  },
});

export default SplashScreen;