import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

const imageMap = {
  't-shirt.png': require('../assets/t-shirt.png'),
  'pant.png': require('../assets/pant.png'),
  'dress.png': require('../assets/dress.png'),
  'jacket.png': require('../assets/jacket.png'),
  'brown-jacket.jpg': require('../assets/brown-jacket.jpg'),
  'brown-suite.jpg': require('../assets/brown-suite.jpg'),
  'yellow-shirt.jpg': require('../assets/yellow-shirt.jpg'),
  't-shirt-white.jpg': require('../assets/t-shirt-white.jpg'),
  't-shirt-black.jpg': require('../assets/t-shirt-black.jpg'),
  'pant-jeans.jpg': require('../assets/pant-jeans.jpg'),
  'pant-chinos.jpg': require('../assets/pant-chinos.jpg'),
  'dress-floral.jpg': require('../assets/dress-floral.jpg'),
  'dress-red.jpg': require('../assets/dress-red.jpg'),
  'brown-jacket-2.jpg': require('../assets/brown-jacket-2.jpg'),
};

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          Alert.alert('Error', 'Please sign in to continue checkout.', [
            { text: 'OK', onPress: () => navigation.navigate('SignIn') },
          ]);
          setLoading(false);
          return;
        }

        const userId = sessionData.session.user.id;

        const { data: cartData, error: cartError } = await supabase
          .from('cart')
          .select(`
            id,
            product_id,
            size,
            color,
            quantity,
            products (
              id,
              name,
              price,
              image_url
            )
          `)
          .eq('user_id', userId);

        if (cartError) {
          console.error('Error fetching cart:', cartError);
          throw new Error(`Could not fetch cart: ${cartError.message}`);
        }

        const formattedCartItems = cartData.map((item) => {
          const imageUrl = item.products.image_url || 't-shirt.png';
          if (!item.products.image_url) {
            console.warn(`Missing image_url for product ID: ${item.products.id}`);
          }
          return {
            id: item.id.toString(),
            productId: item.product_id.toString(),
            name: item.products.name,
            price: item.products.price,
            size: item.size,
            quantity: item.quantity,
            image: imageUrl,
          };
        });

        setCartItems(formattedCartItems);
        setCartCount(formattedCartItems.length);
      } catch (error) {
        console.error('fetchCartItems error:', error.message);
        Alert.alert('Error', `Could not load cart: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [navigation]);

  const calculateSubTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const subTotal = calculateSubTotal();
  const deliveryFee = 25.0;
  const totalCost = subTotal + deliveryFee - discount;

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image
        source={imageMap[item.image] || { uri: item.image }}
        style={styles.itemImage}
        onError={(e) => console.log(`Error loading image for ${item.name}:`, e.nativeEvent.error)}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSize}>Size: {item.size}</Text>
        <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading cart...</Text>
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shipping Address</Text>
              <View style={styles.addressContainer}>
                <Ionicons name="location-outline" size={20} color="#8B4513" />
                <View style={styles.addressDetails}>
                  <Text style={styles.addressLabel}>Home</Text>
                  <Text style={styles.addressText}>
                    1901 Thornridge Cir. Shiloh, Hawaii 81063
                  </Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shipping Method</Text>
              <View style={styles.shippingContainer}>
                <Ionicons name="cube-outline" size={20} color="#8B4513" />
                <View style={styles.shippingDetails}>
                  <Text style={styles.shippingLabel}>Economy</Text>
                  <Text style={styles.shippingText}>Estimated delivery: 08/25/2023</Text>
                </View>
                <TouchableOpacity>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Summary</Text>
              <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                scrollEnabled={false}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Summary</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Subtotal</Text>
                <Text style={styles.priceValue}>${subTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Delivery Fee</Text>
                <Text style={styles.priceValue}>${deliveryFee.toFixed(2)}</Text>
              </View>
              {discount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Discount</Text>
                  <Text style={styles.priceValue}>-${discount.toFixed(2)}</Text>
                </View>
              )}
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total</Text>
                <Text style={styles.priceValue}>${totalCost.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => navigation.navigate('AddCard')}
              disabled={cartItems.length === 0}
            >
              <Text style={styles.paymentButtonText}>Continue to Payment</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.centerIcon}>
          <View style={styles.navIconContainer}>
            <Ionicons name="cart" size={24} color="#8B4513" />
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
    marginTop: 20,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    flex: 1,
    textAlign: 'center',
    color: '#111827',
  },
  scrollContent: {
    paddingBottom: 150,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    color: '#111827',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressDetails: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#888',
    marginTop: 4,
  },
  shippingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingDetails: {
    flex: 1,
    marginLeft: 12,
  },
  shippingLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  shippingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#888',
    marginTop: 4,
  },
  changeText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#8B4513',
    textTransform: 'uppercase',
  },
  list: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: 8,
  },
  itemImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
    color: '#111827',
  },
  itemSize: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#888',
    marginVertical: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#888',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  paymentButton: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#888',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
});

export default CheckoutScreen;