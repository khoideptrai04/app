import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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

const HomeScreen = () => {
  const [userLocation, setUserLocation] = useState('Unknown Location');
  const [userLocationFull, setUserLocationFull] = useState('');
  const [userAvatar, setUserAvatar] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const navigation = useNavigation();

  const shortenAddress = (address) => {
    if (!address) return 'Unknown Location';
    const parts = address.split(',').map((part) => part.trim());
    if (parts.length > 2) {
      return parts.slice(-2).join(', ');
    }
    return address;
  };

  const fetchUserData = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        Alert.alert('Error', 'Please sign in first.', [
          { text: 'OK', onPress: () => navigation.navigate('SignIn') },
        ]);
        return;
      }

      const userId = sessionData.session.user.id;

      const storedUserId = await AsyncStorage.getItem('user_id');
      if (!storedUserId) {
        await AsyncStorage.setItem('user_id', userId);
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('location, avatar_url')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw userError;
      }

      const location = userData.location || 'Unknown Location';
      setUserLocationFull(location);
      setUserLocation(shortenAddress(location));
      setUserAvatar(
        userData.avatar_url ? { uri: userData.avatar_url } : require('../assets/Frogg.png')
      );

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
      console.error('Error fetching user data:', error.message);
      Alert.alert('Error', 'Failed to load user data. Please try again.');
    }
  };

  const fetchCategoriesAndProducts = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      let query = supabase.from('products').select('*');
      if (activeTab !== 'All') {
        if (activeTab === 'Man' || activeTab === 'Woman') {
          query = query.ilike('description', `%${activeTab}%`);
        } else if (activeTab === 'Newest') {
          query = query.order('created_at', { ascending: false });
        } else if (activeTab === 'Popular') {
          query = query.order('rating', { ascending: false });
        }
      }

      const { data: productsData, error: productsError } = await query;
      if (productsError) throw productsError;
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching categories and products:', error.message);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchCategoriesAndProducts();
    }, [activeTab])
  );

  const showFullAddress = () => {
    if (userLocationFull) {
      Alert.alert('Full Address', userLocationFull);
    }
  };

  // Hàm xử lý khi bấm vào danh mục
  const handleCategoryPress = (categoryName) => {
    switch (categoryName) {
      case 'T-Shirt':
        navigation.navigate('TShirt');
        break;
      case 'Pant':
        navigation.navigate('Pant');
        break;
      case 'Dress':
        navigation.navigate('Dress');
        break;
      case 'Jacket':
        navigation.navigate('Jacket');
        break;
      default:
        Alert.alert('Info', 'This category is not yet supported.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Image
                source={userAvatar || require('../assets/Frogg.png')}
                style={styles.avatarImage}
                onError={(e) =>
                  console.log('Error loading avatar image:', e.nativeEvent.error)
                }
              />
            </View>
            <TouchableOpacity onPress={showFullAddress}>
              <View style={styles.locationContainer}>
                <Text style={styles.locationText}>Location</Text>
                <Text style={styles.location} numberOfLines={1} ellipsizeMode="tail">
                  {userLocation}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity>
              <Icon name="bell" size={20} color="#888" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cartIcon}
              onPress={() => navigation.navigate('Cart')}
            >
              <Icon name="shopping-cart" size={20} color="#888" />
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <Icon name="search" size={18} color="#888" />
          <Text style={styles.searchPlaceholder}>Search products...</Text>
        </TouchableOpacity>

        <View style={styles.bannerContainer}>
          <Image
            source={require('../assets/banner.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
            onError={(e) =>
              console.log('Error loading banner image:', e.nativeEvent.error)
            }
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>New Collection 2025</Text>
            <Text style={styles.bannerSubtitle}>
              Get 50% OFF Your First Purchase!
            </Text>
            <TouchableOpacity style={styles.shopNowButton}>
              <Text style={styles.shopNowText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.categoryContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>Category</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllProducts')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoryIcons}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(item.name)}
              >
                <Image
                  source={
                    item.image_url && imageMap[item.image_url]
                      ? imageMap[item.image_url]
                      : require('../assets/t-shirt.png')
                  }
                  style={styles.categoryIcon}
                  onError={(e) =>
                    console.log(
                      `Error loading ${item.name.toLowerCase()} image:`,
                      e.nativeEvent.error
                    )
                  }
                />
                <Text style={styles.categoryText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.flashSaleContainer}>
          <View style={styles.flashSaleHeader}>
            <Text style={styles.flashSaleTitle}>Flash Sale</Text>
            <Text style={styles.closingInText}>
              Closing in: <Text style={styles.closingInTime}>02:12:56</Text>
            </Text>
          </View>

          <View style={styles.flashSaleTabs}>
            {['All', 'Newest', 'Popular', 'Man', 'Woman'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.flashSaleTab,
                  activeTab === tab && styles.flashSaleTabActive,
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.flashSaleTabText,
                    activeTab === tab && styles.flashSaleTabTextActive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.productsContainer}>
            {products.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.product}
                onPress={() =>
                  navigation.navigate('ProductDetails', { productId: item.id })
                }
              >
                <Image
                  source={
                    item.image_url && imageMap[item.image_url]
                      ? imageMap[item.image_url]
                      : require('../assets/pant.png')
                  }
                  style={styles.productImage}
                  onError={(e) =>
                    console.log(
                      `Error loading product image (${item.name}):`,
                      e.nativeEvent.error
                    )
                  }
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
            ))}
          </View>
        </View>

        <View style={styles.footer}></View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.centerIcon}>
          <Ionicons name="home" size={24} color="#8B4513" />
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
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  container: { flex: 1, marginTop: 30, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    maxWidth: '70%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  locationContainer: {
    flex: 1,
  },
  locationText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  location: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    flexShrink: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  cartIcon: {
    marginLeft: 16,
    position: 'relative',
  },
  cartBadge: {
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
  cartBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    borderRadius: 24,
    padding: 8,
    margin: 16,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#888',
  },
  bannerContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#A0522D',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shopNowButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#A0522D',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  shopNowText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  categoryContainer: { padding: 16 },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  seeAllText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  categoryIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryItem: {
    alignItems: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'contain',
  },
  categoryText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  flashSaleContainer: { padding: 16 },
  flashSaleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  flashSaleTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  closingInText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  closingInTime: {
    fontFamily: 'Poppins-Medium',
  },
  flashSaleTabs: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  flashSaleTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    marginRight: 8,
  },
  flashSaleTabActive: {
    backgroundColor: '#A0522D',
  },
  flashSaleTabText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins-Regular',
  },
  flashSaleTabTextActive: {
    color: '#FFF',
    fontFamily: 'Poppins-Medium',
  },
  productsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  product: {
    width: '48%',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
});

export default HomeScreen;