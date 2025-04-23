import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Đăng ký người dùng
export const signUp = async (email, password, name) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116: Không tìm thấy dữ liệu
    if (data) throw new Error('Email already exists');

    const { error: insertError } = await supabase
      .from('users')
      .insert({ email, password, name }); // Lưu ý: Nên mã hóa mật khẩu trong thực tế
    if (insertError) throw insertError;

    return { success: true, message: 'User registered successfully' };
  } catch (error) {
    console.error('Error signing up:', error.message);
    return { success: false, message: error.message };
  }
};

// Đăng nhập người dùng
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password) // Lưu ý: Nên mã hóa mật khẩu trong thực tế
      .single();
    if (error) throw error;
    if (!data) throw new Error('Invalid credentials');

    // Tạo session_id
    const sessionId = `session_${Date.now()}_${Math.random()}`;
    
    // Lưu session_id vào bảng users
    const { error: updateError } = await supabase
      .from('users')
      .update({ session_id: sessionId })
      .eq('id', data.id);
    if (updateError) throw updateError;

    // Lưu session_id và user_id vào AsyncStorage
    await AsyncStorage.setItem('session_id', sessionId);
    await AsyncStorage.setItem('user_id', data.id.toString());

    return { success: true, user: data };
  } catch (error) {
    console.error('Error signing in:', error.message);
    return { success: false, message: error.message };
  }
};

// Đăng xuất người dùng
export const signOut = async () => {
  try {
    const sessionId = await AsyncStorage.getItem('session_id');
    if (sessionId) {
      // Xóa session_id trong bảng users
      const userId = await AsyncStorage.getItem('user_id');
      await supabase
        .from('users')
        .update({ session_id: null })
        .eq('id', userId);
    }

    // Xóa AsyncStorage
    await AsyncStorage.removeItem('session_id');
    await AsyncStorage.removeItem('user_id');

    return { success: true, message: 'Signed out successfully' };
  } catch (error) {
    console.error('Error signing out:', error.message);
    return { success: false, message: error.message };
  }
};

// Kiểm tra trạng thái đăng nhập
export const isSignedIn = async () => {
  const sessionId = await AsyncStorage.getItem('session_id');
  return !!sessionId;
};