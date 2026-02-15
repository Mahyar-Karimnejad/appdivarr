import { InfoIcon } from '@/src/components/common/InfoIcon';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/src/components/common/Button';
import { TextInput } from '@/src/components/common/TextInput';
import { sendVerificationCode } from '@/src/services/auth';
import { Alert } from 'react-native';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps = {}) {
  const params = useLocalSearchParams();
  const redirect = (params.redirect as string) || undefined;
  const adId = (params.id as string) || undefined;
  const action = (params.action as string) || undefined;
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('خطا', 'لطفاً ایمیل خود را وارد کنید');
      return;
    }
    
    setIsLoading(true);
    console.log('Sending verification code to:', email);
    
    try {
      const response = await sendVerificationCode(email);
      console.log('Response received:', response);
      
      // همیشه loading رو متوقف کن
      setIsLoading(false);
      
      console.log('Full response:', JSON.stringify(response, null, 2));
      
      // برای تست: همیشه به صفحه verify-code برو (حتی اگر API fail بشه)
      // این اجازه میده که بتونی کد رو تست کنی
      console.log('✅ Navigating to verify-code page (for testing)');
      
      // Navigation با replace (بدون back button)
      // پارامترهای redirect/id/action را برای ادامه‌ی مسیر بعد از لاگین عبور می‌دهیم
      router.replace({
        pathname: '/verify-code',
        params: {
          email,
          redirect,
          id: adId,
          action,
        },
      });
      
      console.log('✅ Navigation command sent');
      
      // اگر API موفق بود، به صفحه verify-code می‌رویم (بدون alert اضافی)
      // اگر خطا بود، در verify-code صفحه می‌تواند با کد تست (111111) ادامه دهد
      if (!response?.success) {
        // فقط در صورت خطا، یک alert نمایش بده
        setTimeout(() => {
          Alert.alert('خطا', response?.message || 'خطا در ارسال کد تأیید');
        }, 500);
      }
    } catch (error: any) {
      // مطمئن شو که loading همیشه متوقف میشه
      setIsLoading(false);
      console.error('Login error:', error);
      const errorMessage = error?.message || 'خطا در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
      Alert.alert('خطا', errorMessage);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isButtonDisabled = !email.trim() || !isValidEmail(email) || isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#F1F8F4" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image 
                source={require('./Ellipse 1.png')} 
                style={styles.logo}
                resizeMode="cover"
              />
            </View>

            {/* Title */}
            <ThemedText style={styles.title}>ورود / ثبت‌نام</ThemedText>
            
            {/* Subtitle */}
            <ThemedText style={styles.subtitle}>
              ایمیل خود را وارد کنید.
            </ThemedText>

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.emailInput}
              />
            </View>

            {/* Terms Text */}
            <View style={styles.termsContainer}>
              <ThemedText style={styles.termsText}>
                با ورود یا ثبت‌نام در پاتوق، شرایط و قوانین استفاده از سرویس‌های پاتوق و قوانین حریم خصوصی آن را می‌پذیرید.
              </ThemedText>
              <InfoIcon size={16} color="#757575" />
            </View>
          </View>

          {/* Login Button - داخل ScrollView */}
          <View style={styles.buttonContainer}>
            <Button
              title="تأیید و دریافت کد"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isButtonDisabled}
              variant={isButtonDisabled ? 'secondary' : 'primary'}
              size="large"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F4', // مطابق Figma
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 16, // حداقل padding
    paddingTop: 20,
    maxWidth: 430, // حداکثر عرض مطابق Figma
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 48,
  },
  logo: {
    width: 80, // مطابق Figma
    height: 80, // مطابق Figma
    borderRadius: 40,
  },
  title: {
    fontSize: 14, // مطابق Figma
    fontWeight: '700', // مطابق Figma
    textAlign: 'center',
    color: '#333333', // مطابق Figma
    marginBottom: 16, // فاصله تا زیرنویس
    fontFamily: 'Vazir-Bold', // استفاده از فونت Vazir
    marginTop: 40,
  },
  subtitle: {
    fontSize: 12, // مطابق Figma
    fontWeight: '500', // مطابق Figma
    textAlign: 'right',
    color: '#757575', // مطابق Figma
    fontFamily: 'Vazir-Medium', // استفاده از فونت Vazir
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16, // فاصله 16 پیکسل با متن قوانین
    paddingHorizontal: 0,
  },
  emailInput: {
    textAlign: 'left',
    fontSize: 12,
    fontFamily: 'IRANSansMobile(FaNum)',
    color: '#757575',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 40,
    paddingHorizontal: 16,
    gap: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 10, // مطابق Figma
    fontWeight: '500', // مطابق Figma
    lineHeight: 16, // محاسبه شده از Figma
    textAlign: 'right',
    color: '#757575', // مطابق Figma
    fontFamily: 'Vazir-Medium', // استفاده از فونت Vazir
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 0,
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },
});
