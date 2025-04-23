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

const OrderHistoryScreen = () => {
  const navigation = useNavigation();
  const [orderItems, setOrderItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderItems = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          Alert.alert('Error', 'Please login to view order history.', [
            { text: 'OK', onPress: () => navigation.navigate('SignIn') },
          ]);
          setLoading(false);
          return;
        }

        const userId = sessionData.session.user.id;

        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            order_items (
              id,
              product_id,
              quantity,
              price_at_purchase,
              size,
              color,
              products (
                id,
                name,
                image_url
              )
            )
          `)
          .eq('user_id', userId);

        if (orderError) {
          console.error('Error when retrieving order history:', orderError);
          throw new Error(`Unable to get order history: ${orderError.message}`);
        }

        const formattedOrderItems = orderData
          .flatMap((order) => order.order_items)
          .map((item) => {
            const imageUrl = item.products.image_url || 't-shirt.png';
            if (!item.products.image_url) {
              console.warn(`Missing image_url for product ID: ${item.products.id}`);
            }
            return {
              id: item.id.toString(),
              productId: item.product_id.toString(),
              name: item.products.name,
              price: item.price_at_purchase,
              size: item.size,
              color: item.color,
              quantity: item.quantity,
              image: imageUrl,
            };
          });

        setOrderItems(formattedOrderItems);
      } catch (error) {
        console.error('Error in fetchOrderItems:', error.message);
        Alert.alert('Error', `Unable to load order history: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderItems();
  }, [navigation]);

  const openRemoveModal = (item) => {
    setModalVisible(true);
    setSelectedItem(item);
  };

  const removeItem = async () => {
    try {
      const { error } = await supabase
        .from('order_items')
        .delete()
        .eq('id', parseInt(selectedItem.id));

      if (error) {
        console.error('Error while deleting product:', error);
        throw error;
      }

      setOrderItems((prevItems) =>
        prevItems.filter((item) => item.id !== selectedItem.id)
      );
      setModalVisible(false);
      Alert.alert('Thành công', `${selectedItem.name} has been removed from order history.`);
    } catch (error) {
      console.error('Error in removeItem:', error.message);
      Alert.alert('Error', `Cannot delete product: ${error.message}`);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image
        source={imageMap[item.image] || { uri: item.image }}
        style={styles.itemImage}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemSize}>Size: {item.size}</Text>
        <Text style={styles.itemColor}>Color: {item.color}</Text>
        <Text style={styles.itemPrice}>{item.price.toFixed(2)}đ</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
      </View>
      <TouchableOpacity
        style={styles.trashIcon}
        onPress={() => openRemoveModal(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order History ({orderItems.length})</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading order history...</Text>
        </View>
      ) : orderItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You have no orders yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orderItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalWrapper}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Delete from Order History?</Text>
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
                    {selectedItem.price.toFixed(2)}đ
                  </Text>
                  <Text style={styles.modalItemQuantity}>Quantity: {selectedItem.quantity}</Text>
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
                <Text style={styles.removeButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  itemQuantity: {
    fontSize: 14,
    color: '#888',
    marginVertical: 2,
  },
  trashIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  modalItemQuantity: {
    fontSize: 14,
    color: '#888',
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
});

export default OrderHistoryScreen;
