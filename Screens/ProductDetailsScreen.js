import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { FontAwesome, AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';// Ánh xạ tên file ảnh thành require() từ thư mục assets
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
  'brown-jacket-2.jpg': require('../assets/brown-jacket-2.jpg'),};const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = route.params || {};
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#A0522D');
  const [isFavorite, setIsFavorite] = useState(false);  useEffect(() => {
    const fetchProductAndFavorite = async () => {
      if (!productId) {
        Alert.alert('Error', 'Product not found.');
        navigation.goBack();
        return;
      }

  try {
    // Lấy thông tin sản phẩm
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    if (productError) throw productError;
    setProduct(productData);

    // Kiểm tra session và trạng thái yêu thích
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      setIsFavorite(false);
      return;
    }

    const userId = sessionData.session.user.id;
    await AsyncStorage.setItem('user_id', userId);

    const { data: favoriteData, error: favoriteError } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (favoriteError && favoriteError.code !== 'PGRST116') {
      console.error('Error checking favorite:', favoriteError);
      throw favoriteError;
    }

    setIsFavorite(!!favoriteData);
    console.log('Favorite status:', !!favoriteData);
  } catch (error) {
    console.error('Error fetching product/favorite:', error.message);
    Alert.alert('Error', 'Failed to load product. Please try again.');
    navigation.goBack();
  }
};

fetchProductAndFavorite();

  }, [productId, navigation]);  const toggleFavorite = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        Alert.alert('Error', 'Please sign in to manage favorites.', [
          { text: 'OK', onPress: () => navigation.navigate('SignIn') },
        ]);
        return;
      }

  const userId = sessionData.session.user.id;
  console.log('Toggling favorite:', { userId, productId, isFavorite });

  if (isFavorite) {
    // Xóa khỏi favorites
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Error removing favorite:', deleteError);
      throw deleteError;
    }

    setIsFavorite(false);
    Alert.alert('Success', `${product.name} removed from favorites.`);
  } else {
    // Thêm vào favorites
    const { error: insertError } = await supabase.from('favorites').insert({
      user_id: userId,
      product_id: productId,
    });

    if (insertError) {
      console.error('Error adding favorite:', insertError);
      throw insertError;
    }

    setIsFavorite(true);
    Alert.alert('Success', `${product.name} added to favorites!`);
  }
} catch (error) {
  console.error('Error toggling favorite:', error.message);
  Alert.alert('Error', `Failed to update favorites: ${error.message}`);
}

  };  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert('Error', 'Please select a size.');
      return;
    }

try {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    Alert.alert('Error', 'Please sign in first.', [
      { text: 'OK', onPress: () => navigation.navigate('SignIn') },
    ]);
    return;
  }

  const userId = sessionData.session.user.id;
  await AsyncStorage.setItem('user_id', userId);

  const { error } = await supabase.from('cart').insert({
    user_id: userId,
    product_id: productId,
    size: selectedSize,
    color: selectedColor,
    quantity: 1,
  });

  if (error) {
    console.error('Insert cart error:', error);
    throw error;
  }

  Alert.alert('Success', `${product.name} (${selectedSize}) added to cart!`);
} catch (error) {
  console.error('Error adding to cart:', error.message);
  Alert.alert('Error', `Failed to add to cart: ${error.message}`);
}

  };  if (!product) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }  return (
    <View style={styles.container  }>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.headerIcon} onPress={toggleFavorite}>
          <FontAwesome
            name={isFavorite ? 'heart' : 'heart-o'}
            size={24}
            color={isFavorite ? '#A0522D' : '#333'}
          />
        </TouchableOpacity>
      </View>

  <ScrollView>
    {/* Main Image */}
    <Image
      source={
        product.image_url && imageMap[product.image_url]
          ? imageMap[product.image_url]
          : require('../assets/pant.png')
      }
      style={styles.mainImage}
      onError={(e) => console.log('Error loading main image:', e.nativeEvent.error)}
    />

    {/* Thumbnail Container */}
    <View style={styles.thumbnailContainer}>
      {[1, 2, 3].map((index) => (
        <Image
          key={index}
          source={
            product.image_url && imageMap[product.image_url]
              ? imageMap[product.image_url]
              : require('../assets/pant.png')
          }
          style={styles.thumbnail}
        />
      ))}
    </View>

    {/* Details Container */}
    <View style={styles.detailsContainer}>
      <View style={styles.row}>
        <Text style={styles.subTitle}>Female's Style</Text>
        <View style={styles.rating}>
          <FontAwesome name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>{product.rating}</Text>
        </View>
      </View>
      <Text style={styles.title}>{product.name}</Text>

      {/* Description */}
      <Text style={styles.sectionTitle}>Product Details</Text>
      <Text style={styles.description} numberOfLines={3}>
        {product.description || 'No description available.'}
      </Text>
      <TouchableOpacity>
        <Text style={styles.readMore}>Read more</Text>
      </TouchableOpacity>

      {/* Select Size */}
      <Text style={styles.sectionTitle}>Select Size</Text>
      <View style={styles.sizeContainer}>
        {['S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.sizeButton,
              selectedSize === size && styles.sizeButtonSelected,
            ]}
            onPress={() => setSelectedSize(size)}
          >
            <Text
              style={[
                styles.sizeButtonText,
                selectedSize === size && styles.sizeButtonTextSelected,
              ]}
            >
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Select Color */}
      <Text style={styles.sectionTitle}>
        Select Color: {selectedColor === '#A0522D' ? 'Brown' : 'Other'}
      </Text>
      <View style={styles.colorContainer}>
        {['#A0522D', '#D2691E', '#F4A460', '#DEB887', '#000000'].map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selectedColor === color && styles.colorButtonSelected,
            ]}
            onPress={() => setSelectedColor(color)}
          />
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <FontAwesome name="shopping-bag" size={20} color="white" />
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  </ScrollView>
</View>

  );
};const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: '#333',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: 440,
    resizeMode: 'cover',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTitle: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    marginVertical: 8,
  },
  description: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  readMore: {
    color: '#A0522D',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginVertical: 4,
  },
  sizeContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  sizeButtonSelected: {
    backgroundColor: '#A0522D',
    borderColor: '#A0522D',
  },
  sizeButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  sizeButtonTextSelected: {
    color: '#fff',
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 8,
  },
  colorButtonSelected: {
    borderWidth: 2,
    borderColor: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  price: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#333',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A0522D',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  addToCartButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginLeft: 8,
  },
});export default ProductDetailsScreen;

