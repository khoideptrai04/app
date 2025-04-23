import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();

  const handleGetStarted = async () => {
    try {
      // Kiểm tra phiên đăng nhập hiện tại
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error checking session:', sessionError);
        throw new Error(`Failed to check session: ${sessionError.message}`);
      }

      // Nếu có phiên hợp lệ, chuyển hướng đến Home
      if (sessionData.session) {
        navigation.navigate('Home');
      } else {
        // Nếu không có phiên, chuyển hướng đến SignIn
        navigation.navigate('SignIn');
      }
    } catch (error) {
      console.error('Error in handleGetStarted:', error.message);
      Alert.alert('Error', `Failed to proceed: ${error.message}`);
      navigation.navigate('SignIn'); // Fallback đến SignIn nếu có lỗi
    }
  };

  return (
    <View style={styles.container}>
      {/* PHẦN ẢNH */}
      <View style={styles.imageSection}>
        <View style={styles.imageRow}>
          <Image 
            source={require('../assets/image1.png')} 
            style={styles.leftImage} 
          />
          <View style={styles.rightImages}>
            <Image 
              source={require('../assets/image2.png')} 
              style={styles.largeRightImage} 
            />
            <Image 
              source={require('../assets/image3m.png')} 
              style={styles.smallCircle} 
            />
          </View>
        </View>
      </View>

      {/* PHẦN CHỮ SÁT DƯỚI */}
      <View style={styles.textSection}>
        <Text style={styles.subtitle}>
          The <Text style={styles.highlight}>Fashion App</Text> That Makes You Look Your Best
        </Text>

        <Text style={styles.description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Let's Get Started</Text>
        </TouchableOpacity>

        <Text style={styles.signInText}>
          Already have an account?{' '}
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  imageSection: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 30,
  },
  textSection: {
    flex: 0.8,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins-Bold',
    marginBottom: 20,
    color: '#704F38',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  leftImage: {
    width: width * 0.38,
    height: width * 0.6,
    borderRadius: width * 0.19,
    resizeMode: 'cover',
    marginRight: 12,
  },
  rightImages: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeRightImage: {
    width: width * 0.26,
    height: width * 0.35,
    borderRadius: width * 0.13,
    resizeMode: 'cover',
    marginBottom: 12,
  },
  smallCircle: {
    width: width * 0.26,
    height: width * 0.26,
    borderRadius: width * 0.13,
    resizeMode: 'cover',
  },
  subtitle: {
    fontSize: 20,
    textAlign: 'center',
    fontFamily: 'Poppins-Bold',
    marginBottom: 12,
    color: '#000',
  },
  highlight: {
    color: '#704F38',
  },
  description: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#704F38',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  signInText: {
    fontFamily: 'Poppins-Regular',
    color: '#666',
    fontSize: 14,
  },
  signInLink: {
    color: '#704F38',
    fontFamily: 'Poppins-Bold',
  },
});

export default WelcomeScreen;