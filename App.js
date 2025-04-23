import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import SplashScreen from './Screens/SplashScreen';
import WelcomeScreen from './Screens/WelcomeScreen';
import SignInScreen from './Screens/SignInScreen';
import SignUpScreen from './Screens/SignUpScreen';
import CompleteProfileScreen from './Screens/CompleteProfileScreen';
import HomeScreen from './Screens/HomeScreen';
import ProductDetailsScreen from './Screens/ProductDetailsScreen';
import LocationPermissionScreen from './Screens/LocationPermissionScreen';
import WishlistScreen from './Screens/WishlistScreen';
import CartScreen from './Screens/CartScreen';
import ProfileScreen from './Screens/ProfileScreen';
import CheckoutScreen from './Screens/CheckoutScreen';
import PaymentMethodsScreen from './Screens/PaymentMethodsScreen';
import SearchScreen from './Screens/SearchScreen';
import AddCardScreen from './Screens/AddCardScreen';
import PaymentSuccessScreen from './Screens/PaymentSuccessScreen';
import OrderHistoryScreen from './Screens/OrderHistoryScreen';
import TShirtScreen from './Screens/TShirtScreen';
import PantScreen from './Screens/PantScreen';
import DressScreen from './Screens/DressScreen';
import JacketScreen from './Screens/JacketScreen';
import AllProductsScreen from './Screens/AllProductsScreen';
const Stack = createStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState('Splash');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Kiểm tra session từ Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('App.js - Session check:', sessionData, 'Error:', sessionError);

        if (sessionError || !sessionData.session) {
          setInitialRoute('Welcome');
          return;
        }

        const userId = sessionData.session.user.id;
        // Kiểm tra hồ sơ người dùng
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('phone_number, gender, location')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('App.js - Error fetching user data:', userError);
          setInitialRoute('CompleteProfile');
          return;
        }

        // Lưu user_id vào AsyncStorage
        await AsyncStorage.setItem('user_id', userId);

        // Nếu chưa có phone_number hoặc gender → CompleteProfile
        if (!userData.phone_number || !userData.gender) {
          setInitialRoute('CompleteProfile');
          return;
        }

        // Nếu chưa có location → LocationPermission
        if (!userData.location) {
          setInitialRoute('LocationPermission');
          return;
        }

        // Nếu đầy đủ → Home
        setInitialRoute('Home');
      } catch (error) {
        console.error('App.js - Error checking auth:', error.message);
        setInitialRoute('Welcome');
      }
    };

    checkAuth();

    // Theo dõi thay đổi session
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('App.js - Auth state changed:', event, session);
      checkAuth();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
        <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Wishlist" component={WishlistScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="AddCard" component={AddCardScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="PaymentSuccess"
          component={PaymentSuccessScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
        <Stack.Screen name="TShirt" component={TShirtScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Pant" component={PantScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dress" component={DressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Jacket" component={JacketScreen} options={{ headerShown: false }} />
        <Stack.Screen name="AllProducts" component={AllProductsScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}