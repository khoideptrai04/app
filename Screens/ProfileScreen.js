import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState({
    phone_number: '',
    location: '',
    avatar_url: null,
  });
  const [cartCount, setCartCount] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          Alert.alert('Error', 'Please sign in.', [
            { text: 'OK', onPress: () => navigation.navigate('SignIn') },
          ]);
          return;
        }

        const user = sessionData.session.user;
        setUserId(user.id);

        // Fetch user information
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('phone_number, location, avatar_url')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          throw userError;
        }

        setUserData({
          phone_number: userProfile.phone_number || 'Not set',
          location: userProfile.location || 'Not set',
          avatar_url: userProfile.avatar_url ? { uri: userProfile.avatar_url } : require('../assets/Frogg.png'),
        });

        // Count items in the cart
        const { data: cartData, error: cartError } = await supabase
          .from('cart')
          .select('id')
          .eq('user_id', user.id);

        if (cartError) {
          console.error('Error fetching cart data:', cartError);
          throw cartError;
        }
        setCartCount(cartData.length);
      } catch (error) {
        console.error('Error in fetchUserData:', error.message);
        Alert.alert('Error', `Failed to load profile: ${error.message}`);
      }
    };

    fetchUserData();
  }, [navigation]);

  const checkNetworkConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      console.log('Network state:', state);
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photo library!');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected image URI:', asset.uri);
        console.log('Selected image mimeType:', asset.mimeType);
        if (!['image/jpeg', 'image/png'].includes(asset.mimeType)) {
          Alert.alert('Error', 'Please select a JPEG or PNG image.');
          return;
        }
        return { uri: asset.uri, mimeType: asset.mimeType };
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Unable to select image. Please try again.');
      return null;
    }
  };

  const uploadAvatar = async (uri, mimeType, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) {
          throw new Error('No internet connection. Please check your connection.');
        }

        console.log(`Step 1: Starting avatar upload (Attempt ${attempt}) for URI:`, uri);

        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('Image file does not exist.');
        }

        if (fileInfo.size < 100) {
          throw new Error('Image file is too small and may be corrupted.');
        }

        if (fileInfo.size > 5 * 1024 * 1024) {
          throw new Error('Image size is too large (maximum 5MB).');
        }

        console.log('Step 1.5: File size:', fileInfo.size, 'bytes');

        // Determine format and contentType
        const fileExt = mimeType?.split('/')[1]?.toLowerCase() || uri.split('.').pop().toLowerCase();
        const contentType = mimeType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        // Read file as ArrayBuffer
        console.log('Step 2: Reading file as binary');
        const fileData = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const arrayBuffer = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0)).buffer;

        console.log('Step 2.5: File data size:', arrayBuffer.byteLength, 'bytes');
        if (arrayBuffer.byteLength < 100) {
          throw new Error('Image data after reading is too small and may be corrupted.');
        }

        console.log(`Step 3: Uploading to Supabase Storage (Attempt ${attempt}), filePath:`, filePath);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType,
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error(`Step 3 Error: Upload failed (Attempt ${attempt}):`, uploadError);
          throw new Error(`Unable to upload image: ${uploadError.message}`);
        }

        console.log('Step 3 Success: Upload response:', uploadData);

        // Verify the file was uploaded successfully
        const { data: listData, error: listError } = await supabase.storage
          .from('avatars')
          .list('public', { limit: 1, search: fileName });

        if (listError) {
          console.error('Step 3.5 Error: Failed to verify uploaded file:', listError);
          throw new Error(`Unable to verify uploaded file: ${listError.message}`);
        }

        if (!listData || listData.length === 0) {
          console.error('Step 3.5 Error: Uploaded file not found in bucket');
          throw new Error('Image file not found in bucket after upload.');
        }

        console.log('Step 3.5 Success: File verified in bucket:', listData);

        console.log('Step 4: Getting public URL for filePath:', filePath);
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!urlData?.publicUrl) {
          console.error('Step 4 Error: No public URL returned');
          throw new Error('Unable to retrieve public URL for avatar.');
        }

        console.log('Step 4 Success: Avatar public URL:', urlData.publicUrl);

        // Check if the public URL is accessible
        const responseCheck = await fetch(urlData.publicUrl);
        if (!responseCheck.ok) {
          console.error('Step 4.5 Error: Public URL is not accessible:', responseCheck.status);
          throw new Error('Public URL is not accessible.');
        }

        // Check Content-Type of the URL
        const contentTypeHeader = responseCheck.headers.get('Content-Type');
        if (!contentTypeHeader?.startsWith('image/')) {
          console.error('Step 4.5 Error: Invalid Content-Type:', contentTypeHeader);
          throw new Error('Uploaded file is not a valid image.');
        }

        console.log('Step 4.5 Success: Public URL is accessible, Content-Type:', contentTypeHeader);
        return urlData.publicUrl;
      } catch (error) {
        console.error(`Avatar upload error (Attempt ${attempt}):`, error);
        if (attempt === retries) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  };

  const updateAvatar = async () => {
    try {
      const image = await pickImage();
      if (!image) {
        return; // User canceled image selection
      }

      const { uri, mimeType } = image;
      const avatarUrl = await uploadAvatar(uri, mimeType);

      // Update avatar_url in the users table
      const { data, error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating avatar:', updateError);
        throw new Error(`Unable to update avatar: ${updateError.message}`);
      }

      // Update state to display the new image
      setUserData((prev) => ({
        ...prev,
        avatar_url: { uri: avatarUrl },
      }));

      Alert.alert('Success', 'Avatar updated successfully!');
    } catch (error) {
      console.error('Error in updateAvatar:', error.message);
      Alert.alert('Error', `Unable to update avatar: ${error.message}`);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }

      await AsyncStorage.removeItem('user_id');
      Alert.alert('Success', 'You have been signed out.');
      navigation.navigate('Welcome');
    } catch (error) {
      console.error('Error in handleSignOut:', error.message);
      Alert.alert('Error', `Failed to sign out: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
          <Image
            source={userData.avatar_url || require('../assets/Frogg.png')}
            style={styles.avatar}
            onError={(e) => console.log('Error loading avatar:', e.nativeEvent.error)}
          />
          <TouchableOpacity style={styles.editIcon} onPress={updateAvatar}>
            <FontAwesome name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Phone Number:</Text>
          <Text style={styles.value}>{userData.phone_number}</Text>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{userData.location}</Text>
        </View>
        {/* New button to navigate to OrderHistory screen */}
        <TouchableOpacity
          style={styles.orderHistoryButton}
          onPress={() => navigation.navigate('OrderHistory')}
        >
          <Text style={styles.orderHistoryButtonText}>View Order History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom navigation bar */}
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
        <TouchableOpacity onPress={() => navigation.navigate('Wishlist')}>
          <Ionicons name="heart-outline" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.centerIcon}>
          <Ionicons name="person" size={24} color="#8B4513" />
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
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#704F38',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#888',
    fontFamily: 'Poppins-Regular',
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    marginBottom: 8,
  },
  orderHistoryButton: {
    backgroundColor: '#704F38',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '80%',
    marginBottom: 12, // Add spacing between buttons
  },
  orderHistoryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Medium',
  },
  signOutButton: {
    backgroundColor: '#A0522D',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    width: '80%',
  },
  signOutButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Medium',
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

export default ProfileScreen;