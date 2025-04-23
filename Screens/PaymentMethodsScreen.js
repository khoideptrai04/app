import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

const paymentMethods = [
  { id: 'paypal', name: 'Paypal', icon: 'logo-paypal' },
  { id: 'applepay', name: 'Apple Pay', icon: 'logo-apple' },
  { id: 'googlepay', name: 'Google Pay', icon: 'logo-google' },
];

const PaymentMethodsScreen = () => {
  const navigation = useNavigation();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          Alert.alert('Error', 'Please sign in to view payment methods.', [
            { text: 'OK', onPress: () => navigation.navigate('SignIn') },
          ]);
          setLoading(false);
          return;
        }

        const userId = sessionData.session.user.id;

        const { data: cartData, error: cartError } = await supabase
          .from('cart')
          .select('id')
          .eq('user_id', userId);

        if (cartError) {
          console.error('Error fetching cart data:', cartError);
          throw cartError;
        }

        setCartCount(cartData.length);
      } catch (error) {
        console.error('Error in fetchCartCount:', error.message);
        Alert.alert('Error', `Failed to load cart data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCartCount();
  }, [navigation]);

  const handleSelectMethod = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Please select a payment method.');
      return;
    }
    navigation.navigate('PaymentSuccessful');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment Methods</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading...</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Credit & Debit Card</Text>
              <TouchableOpacity
                style={styles.cardOption}
                onPress={() => navigation.navigate('AddCard')}
              >
                <Ionicons name="card-outline" size={24} color="#8B4513" />
                <Text style={styles.optionText}>Add Card</Text>
                <Ionicons name="chevron-forward" size={24} color="#8B4513" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>More Payment Options</Text>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={styles.optionContainer}
                  onPress={() => handleSelectMethod(method.id)}
                >
                  <Ionicons name={method.icon} size={24} color="#8B4513" style={styles.optionIcon} />
                  <Text style={styles.optionText}>{method.name}</Text>
                  <View style={styles.radioButton}>
                    {selectedMethod === method.id && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !selectedMethod && styles.confirmButtonDisabled]}
        onPress={handleConfirmPayment}
        disabled={!selectedMethod}
      >
        <Text style={styles.confirmButtonText}>Confirm Payment</Text>
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.centerIcon} onPress={() => navigation.navigate('Cart')}>
          <View style={styles.navIconContainer}>
            <Ionicons name="cart-outline" size={24} color="#8B4513" />
            {cartCount > 0 && (
              <View style={styles.navCartBadge}>
                <Text style={styles.navCartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Wishlist')}>
          <Ionicons name="heart-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    backgroundColor: '#FFF',
  },
  contentWrapper: {
    flex: 1,
    paddingBottom: 100, // Đảm bảo không bị che bởi Confirm Payment và bottomNav
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  cardOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B4513',
  },
  confirmButton: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 80, // Nhường chỗ cho bottomNav
  },
  confirmButtonDisabled: {
    backgroundColor: '#D3D3D3',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#fff',
    backgroundColor: 'black',
    borderRadius: 50,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  centerIcon: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 10,
  },
  navIconContainer: {
    position: 'relative',
  },
  navCartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#A0522D',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCartBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PaymentMethodsScreen;