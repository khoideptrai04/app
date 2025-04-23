import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const PaymentSuccessScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          accessible
          accessibilityLabel="Back Home"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh Toán</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.paymentContent}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={36} color="white" />
        </View>
        <Text style={styles.paymentTitle}>Payment Successful!</Text>
        <Text style={styles.paymentSubtitle}>Thank you for your purchase.</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.viewOrderButton}
          onPress={() => navigation.navigate('OrderHistory')} // Điều hướng đến màn OrderHistory
          accessibilityRole="button"
        >
          <Text style={styles.viewOrderButtonText}>View Oder</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backHomeButton}
          onPress={() => navigation.navigate('Home')} // Trở về màn Home
          accessibilityRole="button"
        >
          <Text style={styles.backHomeButtonText}>Back Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingRight: 16,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  paymentContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  checkCircle: {
    backgroundColor: '#8B4513',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: 8,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  viewOrderButton: {
    backgroundColor: '#8B4513',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  viewOrderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  backHomeButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  backHomeButtonText: {
    color: '#8B4513',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
});

export default PaymentSuccessScreen;