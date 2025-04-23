import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';// Đồng bộ imageMap với WishlistScreen
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
};const CartScreen = () => {
  const navigation = useNavigation();
  const [cartItems, setCartItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          Alert.alert('Error', 'Please sign in to view cart.', [
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
      throw new Error(`Failed to fetch cart: ${cartError.message}`);
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
        color: item.color,
        quantity: item.quantity,
        image: imageUrl,
      };
    });

    setCartItems(formattedCartItems);
    setCartCount(formattedCartItems.length);
  } catch (error) {
    console.error('Error in fetchCartItems:', error.message);
    Alert.alert('Error', `Failed to load cart: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

fetchCartItems();

  }, [navigation]);  const updateQuantity = async (id, delta) => {
    try {
      const item = cartItems.find((item) => item.id === id);
      const newQuantity = Math.max(1, item.quantity + delta);

  const { error } = await supabase
    .from('cart')
    .update({ quantity: newQuantity })
    .eq('id', parseInt(id));

  if (error) {
    console.error('Error updating quantity:', error);
    throw error;
  }

  setCartItems((prevItems) =>
    prevItems.map((item) =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    )
  );
} catch (error) {
  console.error('Error in updateQuantity:', error.message);
  Alert.alert('Error', `Failed to update quantity: ${error.message}`);
}

  };  const openRemoveModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };  const removeItem = async () => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', parseInt(selectedItem.id));

  if (error) {
    console.error('Error removing item:', error);
    throw error;
  }

  setCartItems((prevItems) =>
    prevItems.filter((item) => item.id !== selectedItem.id)
  );
  setCartCount((prev) => prev - 1);
  setModalVisible(false);
  Alert.alert('Success', `${selectedItem.name} removed from cart.`);
} catch (error) {
  console.error('Error in removeItem:', error.message);
  Alert.alert('Error', `Failed to remove item: ${error.message}`);
}

  };  const applyPromoCode = async () => {
    if (!promoCode) {
      Alert.alert('Error', 'Please enter a promo code.');
      return;
    }

try {
  const { data: promoData, error: promoError } = await supabase
    .from('promos')
    .select('discount_amount, valid_until')
    .eq('code', promoCode.toUpperCase())
    .single();

  if (promoError || !promoData) {
    console.error('Invalid promo code:', promoError);
    Alert.alert('Error', 'Invalid or expired promo code.');
    return;
  }

  const currentDate = new Date();
  const validUntil = new Date(promoData.valid_until);
  if (currentDate > validUntil) {
    Alert.alert('Error', 'Promo code has expired.');
    return;
  }

  setDiscount(promoData.discount_amount);
  Alert.alert('Success', `Promo code applied! Discount: $${promoData.discount_amount.toFixed(2)}`);
} catch (error) {
  console.error('Error in applyPromoCode:', error.message);
  Alert.alert('Error', `Failed to apply promo code: ${error.message}`);
}

  };  const calculateSubTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };  const subTotal = calculateSubTotal();
  const deliveryFee = 25.0;
  const totalCost = subTotal + deliveryFee - discount;  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image
        source={imageMap[item.image] || { uri: item.image }}
        style={styles.itemImage}
        
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSize}>Size: {item.size}</Text>
        <Text style={styles.itemColor}>Color: {item.color}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity onPress={() => updateQuantity(item.id, -1)}>
            <Ionicons name="remove" size={24} color="#8B4513" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity onPress={() => updateQuantity(item.id, 1)}>
            <Ionicons name="add" size={24} color="#8B4513" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        style={styles.trashIcon}
        onPress={() => openRemoveModal(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart ({cartItems.length})</Text>
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
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <View style={styles.summaryContainer}>
        <View style={styles.promoContainer}>
          <TextInput
            style={styles.promoInput}
            placeholder="Promo Code"
            placeholderTextColor="#888"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={styles.applyButton} onPress={applyPromoCode}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Sub-Total</Text>
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
          <Text style={styles.priceLabel}>Total Cost</Text>
          <Text style={styles.priceValue}>${totalCost.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </>
  )}

  <Modal
    animationType="slide"
    transparent={true}
    visible={modalVisible}
    onRequestClose={() => setModalVisible(false)}
  >
    <View style={styles.modalWrapper}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Remove from Cart?</Text>
        {selectedItem && (
          <View style={styles.modalItem}>
            <Image
              source={imageMap[selectedItem.image] || { uri: selectedItem.image }}
              style={styles.modalItemImage}
            />
            <View style={styles.modalItemDetails}>
              <Text style={styles.modalItemName}>{selectedItem.name}</Text>
              <Text style={styles.modalItemSize}>Size: {selectedItem.size}</Text>
              <Text style={styles.modalItemColor}>Color: {selectedItem.color}</Text>
              <Text style={styles.modalItemPrice}>
                ${selectedItem.price.toFixed(2)}
              </Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  onPress={() => updateQuantity(selectedItem.id, -1)}
                >
                  <Ionicons name="remove" size={24} color="#8B4513" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{selectedItem.quantity}</Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(selectedItem.id, 1)}
                >
                  <Ionicons name="add" size={24} color="#8B4513" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeButton} onPress={removeItem}>
            <Text style={styles.removeButtonText}>Yes, Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>

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
};const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    backgroundColor: '#FFF',
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
  list: {
    paddingHorizontal: 16,
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
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  itemSize: {
    fontSize: 14,
    color: '#888',
    marginVertical: 2,
  },
  itemColor: {
    fontSize: 14,
    color: '#888',
    marginVertical: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityText: {
    fontSize: 16,
    marginHorizontal: 12,
  },
  trashIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  summaryContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  promoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  promoInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    textTransform: 'uppercase',
    paddingVertical: 0,
  },
  applyButton: {
    backgroundColor: '#8B4513',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  applyButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: '#888',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#8B4513',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: -2 },
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalItemImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
  },
  modalItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  modalItemSize: {
    fontSize: 14,
    color: '#888',
    marginVertical: 2,
  },
  modalItemColor: {
    fontSize: 14,
    color: '#888',
    marginVertical: 2,
  },
  modalItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#888',
    textTransform: 'uppercase',
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FFF',
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
    color: '#666',
  },
});export default CartScreen;

