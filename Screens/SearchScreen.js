import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
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

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          Alert.alert('Error', 'Please sign in.', [
            { text: 'OK', onPress: () => navigation.navigate('SignIn') },
          ]);
          return;
        }

        const userId = sessionData.session.user.id;

        const { data: searchData, error: searchError } = await supabase
          .from('search_history')
          .select('query')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (searchError) {
          console.error('Error fetching search history:', searchError);
        } else {
          setRecentSearches(searchData.map((item) => item.query));
        }
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };

    fetchData();
  }, [navigation]);

  const handleSearch = async (text) => {
    setSearchQuery(text);
    setShowResults(text.length > 0);

    if (text.length > 0) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return;

        const userId = sessionData.session.user.id;

        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, name, price, rating, image_url')
          .ilike('name', `%${text}%`);

        if (productsError) {
          console.error('Error searching products:', productsError);
          Alert.alert('Error', 'Failed to search products.');
          return;
        }

        const { data: favoritesData, error: favoritesError } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', userId);

        if (favoritesError) {
          console.error('Error fetching favorites:', favoritesError);
        }

        const favoriteIds = favoritesData
          ? favoritesData.map((fav) => fav.product_id.toString())
          : [];

        const formattedResults = productsData.map((item) => ({
          id: item.id.toString(),
          name: item.name,
          price: item.price,
          rating: item.rating || 0,
          image: item.image_url || 't-shirt.png',
          favorited: favoriteIds.includes(item.id.toString()),
        }));

        setSearchResults(formattedResults);

        const { error: insertError } = await supabase
          .from('search_history')
          .upsert({ user_id: userId, query: text }, { onConflict: ['user_id', 'query'] });

        if (insertError) {
          console.error('Error saving search history:', insertError);
        } else {
          setRecentSearches((prev) => {
            const newSearches = [text, ...prev.filter((q) => q !== text)].slice(0, 10);
            return newSearches;
          });
        }
      } catch (error) {
        console.error('Error in handleSearch:', error.message);
        Alert.alert('Error', 'Failed to search products.');
      }
    }
  };

  const handleClearAll = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const userId = sessionData.session.user.id;

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing search history:', error);
        Alert.alert('Error', 'Failed to clear search history.');
        return;
      }

      setRecentSearches([]);
      Alert.alert('Success', 'Search history cleared.');
    } catch (error) {
      console.error('Error in handleClearAll:', error.message);
      Alert.alert('Error', 'Failed to clear search history.');
    }
  };

  const handleGoBack = () => {
    navigation.navigate('Home');
  };

  const toggleFavorite = async (id) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        Alert.alert('Error', 'Please sign in to add favorites.');
        return;
      }

      const userId = sessionData.session.user.id;
      const item = searchResults.find((item) => item.id === id);

      if (item.favorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', parseInt(id));

        if (error) {
          console.error('Error removing favorite:', error);
          Alert.alert('Error', 'Failed to remove favorite.');
          return;
        }
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: userId, product_id: parseInt(id) }]);

        if (error) {
          console.error('Error adding favorite:', error);
          Alert.alert('Error', 'Failed to add favorite.');
          return;
        }
      }

      setSearchResults((prevResults) =>
        prevResults.map((item) =>
          item.id === id ? { ...item, favorited: !item.favorited } : item
        )
      );
    } catch (error) {
      console.error('Error in toggleFavorite:', error.message);
      Alert.alert('Error', 'Failed to update favorite.');
    }
  };

  const handleProductPress = (item) => {
    navigation.navigate('ProductDetails', { productId: item.id });
  };

  const renderRecentSearch = ({ item }) => (
    <TouchableOpacity
      style={styles.recentSearchItem}
      onPress={() => handleSearch(item)}
    >
      <Text style={styles.recentSearchText}>{item}</Text>
      <Ionicons name="close" size={20} color="#888" />
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleProductPress(item)}
    >
      <Image
        source={imageMap[item.image] || { uri: item.image }}
        style={styles.resultImage}
        onError={(e) =>
          console.log(`Error loading image for ${item.name}:`, e.nativeEvent.error)
        }
      />
      <TouchableOpacity
        style={styles.favoriteIcon}
        onPress={() => toggleFavorite(item.id)}
      >
        <Ionicons
          name={item.favorited ? 'heart' : 'heart-outline'}
          size={20}
          color="#FF0000"
        />
      </TouchableOpacity>
      <Text style={styles.resultName}>{item.name}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>
      <Text style={styles.resultPrice}>${item.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search products..."
          placeholderTextColor="#888"
          autoFocus={true}
        />
      </View>

      {showResults ? (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            Result for '{searchQuery}'{' '}
            <Text style={styles.resultsCount}>({searchResults.length} found)</Text>
          </Text>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.resultsList}
            key="results"
          />
        </View>
      ) : (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentSearch}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.recentSearchesList}
            key="recent"
          />
        </View>
      )}
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
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Poppins-Regular',
  },
  recentSearchesContainer: {
    paddingHorizontal: 16,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
  },
  clearAllText: {
    fontSize: 14,
    color: '#8B4513',
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
  },
  recentSearchesList: {
    paddingBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  recentSearchText: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Poppins-Regular',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Poppins-Regular',
  },
  resultsList: {
    paddingBottom: 16,
  },
  resultItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#FFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: 8,
  },
  resultImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  resultName: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  resultPrice: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
});

export default SearchScreen;