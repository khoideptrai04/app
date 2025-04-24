import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

const AddCardScreen = () => {
  const navigation = useNavigation();
  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(true);
  const [cartItems, setCartItems] = useState([]);
  const [shippingType] = useState('Economy');

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          Alert.alert('Error', 'Unable to authenticate user.');
          return;
        }

        const userId = userData.user.id;

        const { data, error } = await supabase
          .from('cart')
          .select(`
            *,
            products (
              id,
              name,
              price
            )
          `)
          .eq('user_id', userId);

        if (error) {
          console.error('Error fetching cart:', error);
          Alert.alert('Error', 'Unable to fetch cart information.');
          return;
        }

        setCartItems(data || []);
      } catch (error) {
        console.error('Unknown error:', error);
        Alert.alert('Error', 'An unknown error occurred.');
      }
    };

    fetchCartItems();
  }, []);

  const saveCardInfo = async () => {
    try {
      if (!cardHolder || !cardNumber || !expiryDate || !cvv) {
        Alert.alert('Error', 'Please fill in all card information.');
        return;
      }

      const cleanCardNumber = cardNumber.replace(/\s/g, '');
      if (!/^\d{16}$/.test(cleanCardNumber)) {
        Alert.alert('Error', 'Card number must be 16 digits.');
        return;
      }

      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
        Alert.alert('Error', 'Expiry date must be in MM/YY format.');
        return;
      }

      if (!/^\d{3}$/.test(cvv)) {
        Alert.alert('Error', 'CVV must be 3 digits.');
        return;
      }

      if (saveCard) {
        const cardInfo = {
          cardHolder,
          cardNumber: cleanCardNumber,
          expiryDate,
          cvv,
        };
        await AsyncStorage.setItem('cardInfo', JSON.stringify(cardInfo));
        console.log('Card information saved:', cardInfo);
      }

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.products.price * item.quantity,
        0
      );

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        Alert.alert('Error', 'Unable to authenticate user.');
        return;
      }
      const userId = userData.user.id;

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            user_id: userId,
            total_amount: totalAmount,
            shipping_type: shippingType,
          },
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        Alert.alert('Error', 'Unable to create order.');
        return;
      }

      const orderId = orderData.id;

      const orderItems = cartItems.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.products.price,
        size: item.size,
        color: item.color,
      }));

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) {
        console.error('Error creating order details:', orderItemsError);
        Alert.alert('Error', 'Unable to save order details.');
        return;
      }

      const { error: deleteCartError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId);

      if (deleteCartError) {
        console.error('Error clearing cart:', deleteCartError);
        Alert.alert('Error', 'Unable to clear cart.');
        return;
      }

      navigation.navigate('PaymentSuccess');
    } catch (error) {
      console.error('Error saving card or creating order:', error);
      Alert.alert('Error', `An error occurred: ${error.message}`);
    }
  };

  const formatCardNumber = (number) => {
    return number.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessible
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#4B5563" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Card</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <Text style={styles.visaLogo}>VISA</Text>
            <Text style={styles.cardNumber}>
              {cardNumber ? formatCardNumber(cardNumber) : '4716 9627 1635 8047'}
            </Text>
            <View style={styles.cardDetails}>
              <View>
                <Text style={styles.cardLabel}>Cardholder Name</Text>
                <Text style={styles.cardHolder}>
                  {cardHolder ? cardHolder.toUpperCase() : 'ESTHER HOWARD'}
                </Text>
              </View>
              <View>
                <Text style={styles.cardLabel}>Expiry Date</Text>
                <Text style={styles.expiryDate}>
                  {expiryDate || '02/30'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Cardholder Name</Text>
          <TextInput
            style={styles.input}
            value={cardHolder}
            onChangeText={setCardHolder}
            placeholder="Cardholder Name"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Enter cardholder name"
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Card Number</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="Card Number"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Enter card number"
          />
        </View>
        <View style={[styles.formGroup, styles.row]}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.label}>Expiry Date</Text>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="MM/YY"
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Enter expiry date"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={styles.input}
              value={cvv}
              onChangeText={setCvv}
              placeholder="CVV"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              secureTextEntry={true}
              accessibilityLabel="Enter CVV code"
            />
          </View>
        </View>
        <View style={[styles.row, { alignItems: 'center', marginBottom: 20 }]}>
          {Platform.OS === 'ios' ? (
            <CheckBox value={saveCard} onValueChange={setSaveCard} />
          ) : (
            <TouchableOpacity
              onPress={() => setSaveCard(!saveCard)}
              style={[
                styles.checkbox,
                saveCard && { backgroundColor: '#7a5a3c', borderColor: '#7a5a3c' },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: saveCard }}
            >
              {saveCard && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
          )}
          <Text style={styles.checkboxLabel}>Save Card</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={saveCardInfo}
          accessibilityRole="button"
          accessibilityLabel="Add card"
        >
          <Text style={styles.addButtonText}>Add Card</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  cardContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#7a5a3c',
    width: 320,
    height: 160,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
  },
  visaLogo: {
    fontSize: 24,
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    textAlign: 'right',
  },
  cardNumber: {
    fontSize: 20,
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    letterSpacing: 2,
    marginVertical: 16,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Poppins-Regular',
    opacity: 0.7,
  },
  cardHolder: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    marginTop: 4,
  },
  expiryDate: {
    fontSize: 14,
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#111827',
    fontFamily: 'Poppins-Regular',
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#7a5a3c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
  },
  addButton: {
    backgroundColor: '#7a5a3c',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
});

export default AddCardScreen;