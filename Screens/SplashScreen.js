import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Welcome'); // Chuyển sang WelcomeScreen sau 3s
    }, 3000); // 3000ms = 3 giây
    return () => clearTimeout(timer); // Dọn dẹp timer
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ứng dụng ghi chú</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3498db', // Màu nền xanh dương
  },
  text: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
  },
});