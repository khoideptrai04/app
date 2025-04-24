import React, { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { FontAwesome } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const CompleteProfileScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarMimeType, setAvatarMimeType] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session in CompleteProfile:', sessionData, 'Session Error:', sessionError);

        if (sessionError || !sessionData.session) {
          Alert.alert('Lỗi', 'Vui lòng đăng nhập để tiếp tục.');
          navigation.navigate('SignIn');
          return;
        }

        const user = sessionData.session.user;
        setUserId(user.id);

        const storedUserId = await AsyncStorage.getItem('user_id');
        if (!storedUserId) {
          await AsyncStorage.setItem('user_id', user.id);
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('phone_number, gender, avatar_url')
          .eq('id', user.id)
          .single();

        if (userError && userError.code === 'PGRST116') {
          console.log('User record not found, creating new user record');
          const userName = user.user_metadata?.name || '';

          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert([
              {
                id: user.id,
                email: user.email,
                name: userName,
                created_at: new Date().toISOString(),
              },
            ])
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user record:', insertError);
            Alert.alert('Lỗi', 'Không thể tạo hồ sơ người dùng.');
            return;
          }
          console.log('New user record created:', newUser);
        } else if (userError) {
          console.error('Error fetching user data:', userError);
          Alert.alert('Lỗi', 'Không thể tải hồ sơ.');
          return;
        } else if (userData) {
          if (userData.phone_number && userData.gender) {
            console.log('Profile already complete, navigating to LocationPermission');
            navigation.navigate('LocationPermission');
            return;
          }
          setPhoneNumber(userData.phone_number || '');
          setGender(userData.gender || '');
          setAvatarUri(userData.avatar_url || null);
        }
      } catch (error) {
        console.error('Error checking session:', error.message);
        Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng đăng nhập lại.');
        navigation.navigate('SignIn');
      }
    };

    checkSession();
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
        Alert.alert('Quyền bị từ chối', 'Chúng tôi cần quyền truy cập thư viện ảnh!');
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
        setAvatarUri(asset.uri);
        setAvatarMimeType(asset.mimeType);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const convertToJpeg = async (uri) => {
    try {
      console.log('Converting image to JPEG:', uri);
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      console.log('Converted image URI:', result.uri);
      console.log('Converted image size:', fileInfo.size, 'bytes');
      if (!fileInfo.exists || fileInfo.size < 100) {
        throw new Error('Tệp ảnh sau khi chuyển đổi không hợp lệ hoặc quá nhỏ.');
      }
      return result.uri;
    } catch (error) {
      console.error('Error converting image to JPEG:', error);
      throw new Error(`Không thể chuyển đổi ảnh sang JPEG: ${error.message}`);
    }
  };

  const uploadAvatar = async (uri, mimeType, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const isConnected = await checkNetworkConnection();
        if (!isConnected) {
          throw new Error('Không có kết nối internet. Vui lòng kiểm tra lại.');
        }

        console.log(`Step 1: Starting avatar upload (Attempt ${attempt}) for URI:`, uri);

        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('Tệp ảnh không tồn tại.');
        }

        if (fileInfo.size < 100) {
          throw new Error('Tệp ảnh quá nhỏ, có thể bị hỏng.');
        }

        if (fileInfo.size > 5 * 1024 * 1024) {
          throw new Error('Kích thước ảnh quá lớn (tối đa 5MB).');
        }

        console.log('Step 1.5: File size:', fileInfo.size, 'bytes');

        let fileExt = mimeType?.split('/')[1]?.toLowerCase() || uri.split('.').pop().toLowerCase();
        let contentType = mimeType || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        let convertedUri = uri;

        if (mimeType === 'image/heic' || !['image/jpeg', 'image/png'].includes(mimeType)) {
          console.log('Step 1.6: Converting non-JPEG/PNG image to JPEG');
          convertedUri = await convertToJpeg(uri);
          fileExt = 'jpeg';
          contentType = 'image/jpeg';
        }

        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        console.log('Step 2: Reading file as binary');
        const fileData = await FileSystem.readAsStringAsync(convertedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const arrayBuffer = Uint8Array.from(atob(fileData), (c) => c.charCodeAt(0)).buffer;

        console.log('Step 2.5: File data size:', arrayBuffer.byteLength, 'bytes');
        if (arrayBuffer.byteLength < 100) {
          throw new Error('Dữ liệu ảnh sau khi đọc quá nhỏ, có thể bị hỏng.');
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
          throw new Error(`Không thể tải ảnh lên: ${uploadError.message}`);
        }

        console.log('Step 3 Success: Upload response:', uploadData);

        const { data: listData, error: listError } = await supabase.storage
          .from('avatars')
          .list('public', { limit: 1, search: fileName });

        if (listError) {
          console.error('Step 3.5 Error: Failed to verify uploaded file:', listError);
          throw new Error(`Không thể xác minh tệp đã tải lên: ${listError.message}`);
        }

        if (!listData || listData.length === 0) {
          console.error('Step 3.5 Error: Uploaded file not found in bucket');
          throw new Error('Tệp ảnh không được tìm thấy trong bucket sau khi tải lên.');
        }

        console.log('Step 3.5 Success: File verified in bucket:', listData);

        console.log('Step 4: Getting public URL for filePath:', filePath);
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        if (!urlData?.publicUrl) {
          console.error('Step 4 Error: No public URL returned');
          throw new Error('Không thể lấy URL công khai cho ảnh đại diện.');
        }

        console.log('Step 4 Success: Avatar public URL:', urlData.publicUrl);

        const responseCheck = await fetch(urlData.publicUrl);
        if (!responseCheck.ok) {
          console.error('Step 4.5 Error: Public URL is not accessible:', responseCheck.status);
          throw new Error('URL công khai không thể truy cập được.');
        }

        const contentTypeHeader = responseCheck.headers.get('Content-Type');
        if (!contentTypeHeader?.startsWith('image/')) {
          console.error('Step 4.5 Error: Invalid Content-Type:', contentTypeHeader);
          throw new Error('Tệp tải lên không phải là ảnh hợp lệ.');
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

  const updateProfile = async (avatarUrl) => {
    try {
      const updates = {
        phone_number: phoneNumber,
        gender,
      };

      if (avatarUrl) {
        updates.avatar_url = avatarUrl;
      }

      console.log('Step 5: Updating user profile with:', updates);
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Step 5 Error: Update failed:', updateError);
        throw new Error(`Không thể cập nhật hồ sơ: ${updateError.message}`);
      }

      console.log('Step 6: Profile updated successfully, data:', data);
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật thành công!', [
        { text: 'OK', onPress: () => navigation.navigate('LocationPermission') },
      ]);

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const handleCompleteProfile = async () => {
    if (!phoneNumber || !gender) {
      Alert.alert('Lỗi', 'Vui lòng điền số điện thoại và giới tính.');
      return;
    }

    if (!['Men', 'Female'].includes(gender)) {
      Alert.alert('Lỗi', 'Giới tính phải là Nam hoặc Nữ.');
      return;
    }

    if (!userId) {
      Alert.alert('Lỗi', 'Người dùng chưa được xác thực. Vui lòng đăng nhập lại.');
      navigation.navigate('SignIn');
      return;
    }

    setIsSubmitting(true);
    try {
      let avatarUrl = null;

      if (avatarUri && avatarUri.startsWith('file://')) {
        avatarUrl = await uploadAvatar(avatarUri, avatarMimeType);
      }

      await updateProfile(avatarUrl);
      return true;
    } catch (error) {
      console.error('Error in handleCompleteProfile:', error.message);
      Alert.alert(
        'Lỗi Tải Ảnh',
        `Không thể tải ảnh lên: ${error.message}. Bạn có muốn tiếp tục mà không cập nhật ảnh không?`,
        [
          { text: 'Hủy', style: 'cancel', onPress: () => setIsSubmitting(false) },
          {
            text: 'Tiếp tục',
            onPress: async () => {
              try {
                await updateProfile(null);
              } catch (updateError) {
                console.error('Error updating profile without avatar:', updateError);
                Alert.alert('Lỗi', `Không thể cập nhật hồ sơ: ${updateError.message}`);
              } finally {
                setIsSubmitting(false);
              }
            },
          },
        ]
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <Image
            source={avatarUri ? { uri: avatarUri } : require('../assets/Frogg.png')}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editIcon} onPress={pickImage}>
            <FontAwesome name="pencil" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Hoàn tất hồ sơ của bạn</Text>
        <Text style={styles.subtitle}>Vui lòng cung cấp thêm thông tin</Text>

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập số điện thoại của bạn"
          placeholderTextColor="#999"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Giới tính</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'Men' && styles.genderButtonSelected]}
            onPress={() => setGender('Men')}
          >
            <Text style={[styles.genderText, gender === 'Men' && styles.genderTextSelected]}>Nam</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'Female' && styles.genderButtonSelected]}
            onPress={() => setGender('Female')}
          >
            <Text style={[styles.genderText, gender === 'Female' && styles.genderTextSelected]}>Nữ</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleCompleteProfile}
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 20,
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
  title: {
    fontSize: 30,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#333',
    marginBottom: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    fontFamily: 'Poppins-Light',
    color: '#333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  genderButtonSelected: {
    backgroundColor: '#704F38',
    borderColor: '#704F38',
  },
  genderText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#333',
  },
  genderTextSelected: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#704F38',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a68b76',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    fontWeight: 'bold',
  },
});

export default CompleteProfileScreen;