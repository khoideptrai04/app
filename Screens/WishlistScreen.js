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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';const imageMap = {
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
};const categories = ['All', 'Jacket', 'Shirt', 'Pant', 'T-Shirt'];const WishlistScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const navigation = useNavigation();  useEffect(() => {
    const fetchFavoritesAndCart = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          Alert.alert('Error', 'Please sign in to view favorites.', [
            { text: 'OK', onPress: () => navigation.navigate('SignIn') },
          ]);
          setLoading(false);
          return;
        }

    const userId = sessionData.session.user.id;

    const { data: favoritesData, error: favoritesError } = await supabase
      .from('favorites')
      .select(`
        product_id,
        products (
          id,
          name,
          price,
          rating,
          image_url,
          category_id,
          categories (name)
        )
      `)
      .eq('user_id', userId);

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError);
      throw new Error(`Failed to fetch favorites: ${favoritesError.message}`);
    }

    const formattedFavorites = favoritesData.map((item) => {
      const imageUrl = item.products.image_url || 't-shirt.png';
      if (!item.products.image_url) {
        console.warn(`Missing image_url for product ID: ${item.products.id}`);
      }
      return {
        id: item.products.id.toString(),
        name: item.products.name,
        price: `$${item.products.price.toFixed(2)}`,
        rating: item.products.rating || 0,
        image: imageUrl,
        category: item.products.categories?.name || 'Other',
      };
    });

    setFavorites(formattedFavorites);

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
    console.error('Error in fetchFavoritesAndCart:', error.message);
    Alert.alert('Error', `Failed to load favorites: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

fetchFavoritesAndCart();

  }, [navigation]);  const removeFromFavorites = async (productId) => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        Alert.alert('Error', 'Please sign in to remove favorites.');
        return;
      }

  const userId = sessionData.session.user.id;

  const { error: deleteError } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', parseInt(productId));

  if (deleteError) {
    console.error('Error removing favorite:', deleteError);
    throw new Error(`Failed to remove favorite: ${deleteError.message}`);
  }

  setFavorites((prev) => prev.filter((item) => item.id !== productId));
  Alert.alert('Success', 'Removed from favorites.');
} catch (error) {
  console.error('Error in removeFromFavorites:', error.message);
  Alert.alert('Error', `Failed to remove favorite: ${error.message}`);
}

  };  const filteredData = selectedCategory === 'All'
    ? favorites
    : favorites.filter((item) => item.category === selectedCategory);  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity onPress={() => navigation.navigate('ProductDetails', { productId: item.id })}>
        <Image
          source={imageMap[item.image] || { uri: item.image }}
          style={styles.itemImage}
        />
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>{item.price}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.heartIcon}
        onPress={() => removeFromFavorites(item.id)}
      >
        <Ionicons name="heart" size={30} color="#8B4513" />
      </TouchableOpacity>
    </View>
  );  const renderCategory = (category, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.categoryButton,
        selectedCategory === category ? styles.selectedCategory : null,
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === category ? styles.selectedCategoryText : null,
        ]}
      >
        {category}
      </Text>
    </TouchableOpacity>
  );  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
      </View>

  <View style={styles.categoriesContainer}>
    {categories.map((category, index) => renderCategory(category, index))}
  </View>

  {loading ? (
    <View style={styles.loadingContainer}>
      <Text>Loading favorites...</Text>
    </View>
  ) : filteredData.length === 0 ? (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No favorites found.</Text>
    </View>
  ) : (
    <FlatList
      data={filteredData}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.list}
    />
  )}

  <View style={styles.bottomNav}>
    <TouchableOpacity onPress={() => navigation.navigate('Home')}>
      <Ionicons name="home-outline" size={24} color="#FFF" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
      <View style={styles.navIconContainer}>
        <Ionicons name="cart-outline" size={24} color="#FFF" />
        {cartCount > 0 && (
          <View style={styles.navCartBadge}>
            <Text style={styles.navCartBadgeText}>{cartCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
    <TouchableOpacity style={styles.centerIcon}>
      <Ionicons name="heart" size={24} color="#8B4513" />
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
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedCategory: {
    backgroundColor: '#8B4513',
  },
  categoryText: {
    fontSize: 14,
    color: '#888',
  },
  selectedCategoryText: {
    color: '#FFF',
  },
  list: {
    paddingHorizontal: 16,
  },
  itemContainer: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#888',
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 4,
  },
  heartIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
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
});export default WishlistScreen;

