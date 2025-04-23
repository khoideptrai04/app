import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';

// Image mapping for product images
const imageMap = {
  'pant.png': require('../assets/pant.png'),
  'pant-jeans.jpg': require('../assets/pant-jeans.jpg'),
  'pant-chinos.jpg': require('../assets/pant-chinos.jpg'),
};

const PantScreen = () => {
  const navigation = useNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user session to get user ID
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          Alert.alert('Error', 'Please sign in to view products.', [
            { text: 'OK', onPress: () => navigation.navigate('SignIn') },
          ]);
          setLoading(false);
          return;
        }

        // Fetch the category_id for 'Pant'
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .eq('name', 'Pant')
          .single();

        if (categoryError || !categoryData) {
          console.error('Error fetching Pant category:', categoryError);
          throw new Error('Pant category not found');
        }

        const categoryId = categoryData.id;

        // Fetch products with the matching category_id
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('id, name, price, image_url, rating')
          .eq('category_id', categoryId);

        if (productError) {
          console.error('Error fetching Pants:', productError);
          throw new Error(`Failed to fetch Pants: ${productError.message}`);
        }

        const formattedProducts = productData.map((item) => ({
          id: item.id.toString(),
          name: item.name,
          price: item.price,
          image: item.image_url || 'pant.png',
          rating: item.rating || 0,
        }));

        setProducts(formattedProducts);
      } catch (error) {
        console.error('Error in fetchData:', error.message);
        Alert.alert('Error', `Failed to load Pants: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.product}
      onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}
    >
      <Image
        source={imageMap[item.image] || { uri: item.image }}
        style={styles.productImage}
      />
      <Text style={styles.productName}>{item.name}</Text>
      <View style={styles.productInfo}>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
        <View style={styles.productRating}>
          <Icon name="star" size={12} color="#FFD700" />
          <Text style={styles.productRatingText}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pants</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Loading Pants...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Pants available.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  productsContainer: {
    padding: 16,
  },
  product: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    marginHorizontal: '1%',
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  productName: {
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productRatingText: {
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
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

export default PantScreen;