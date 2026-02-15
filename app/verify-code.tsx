import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/src/components/common/Button';
import { OTPInput } from '@/src/components/common/OTPInput';
import { sendVerificationCode, verifyCode } from '@/src/services/auth';
import { saveToken, saveUser } from '@/src/utils/storage';
import { Alert } from 'react-native';

export default function VerifyCodeScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || 'example@email.com';
  const redirect = (params.redirect as string) || undefined;
  const adId = (params.id as string) || undefined;
  const action = (params.action as string) || undefined;
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(120); // تایمر 2 دقیقه (120 ثانیه)
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // جلوگیری از multiple calls
  const [isLoggedIn, setIsLoggedIn] = useState(false); // جلوگیری از تایید دوباره بعد از لاگین موفق
  const [isDisabled, setIsDisabled] = useState(false); // غیرفعال کردن کامل input و دکمه

  // تایمر برای درخواست مجدد کد
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleCodeComplete = async (completeCode: string) => {
    // جلوگیری از multiple calls
    if (isVerifying || isLoading) {
      console.log('Already verifying, skipping...');
      return;
    }
    
    // جلوگیری از تایید دوباره بعد از لاگین موفق
    if (isLoggedIn) {
      console.log('Already logged in, skipping...');
      return;
    }
    
    // چک کردن طول کد
    if (completeCode.length !== 6) {
      console.log('Code length is not 6, skipping...');
      return;
    }
    
    setCode(completeCode);
    setIsVerifying(true);
    setIsLoading(true);
    
    try {
      const response = await verifyCode(email, completeCode);
      console.log('📦 Full Verify Response:', JSON.stringify(response, null, 2));
      
      // همیشه loading رو متوقف کن
      setIsLoading(false);
      setIsVerifying(false);
      
      if (response && response.success && response.token && response.user) {
        // علامت‌گذاری که لاگین موفق انجام شده - جلوگیری از هرگونه درخواست بعدی
        setIsLoggedIn(true);
        setIsDisabled(true);
        
        // لاگ اطلاعات کاربر
        console.log('✅ Login Successful!');
        console.log('👤 User Info:', {
          id: response.user.id,
          email: response.user.email,
          display_name: response.user.display_name,
          role: response.user.role,
          is_admin: response.user.is_admin,
        });
        console.log('🔑 Token:', response.token.substring(0, 20) + '...');
        console.log('📍 Navigation:', response.user.is_admin ? '→ Admin Panel' : '→ Home');
        
        try {
          // ذخیره user در یک متغیر محلی برای استفاده در callback
          const user = response.user;
          const userIsAdmin = user.is_admin;
          
          // ذخیره token و اطلاعات کاربر
          await saveToken(response.token);
          await saveUser(user);
          console.log('💾 Token and user saved successfully');
          
          // نمایش پیام موفقیت
          Alert.alert('موفق', 'ورود با موفقیت انجام شد', [
            {
              text: 'باشه',
              onPress: () => {
                // اگر redirect مشخص شده، کاربر را به همان صفحه (مثلاً ad-detail) برگردان
                if (redirect) {
                  let target = redirect;
                  const query: string[] = [];
                  if (adId) {
                    query.push(`id=${encodeURIComponent(adId)}`);
                  }
                  if (action) {
                    query.push(`action=${encodeURIComponent(action)}`);
                  }
                  if (query.length > 0) {
                    target += `?${query.join('&')}`;
                  }
                  console.log('🚀 Navigating to redirect target:', target);
                  router.replace(target as any);
                  return;
                }

                // در غیر این صورت هدایت بر اساس role
                if (userIsAdmin) {
                  console.log('🚀 Navigating to /admin');
                  router.replace('/admin');
                } else {
                  console.log('🚀 Navigating to /home');
                  router.replace('/home');
                }
              }
            }
          ]);
        } catch (saveError) {
          console.error('❌ Error saving token/user:', saveError);
          Alert.alert('خطا', 'خطا در ذخیره اطلاعات');
          // اگر خطا در save بود، flag را reset کن تا کاربر بتواند دوباره تلاش کند
          setIsLoggedIn(false);
          setIsDisabled(false);
        }
      } else {
        // برای تست: اگر کد تست (111111) باشه، حتی اگر API fail بشه، برو به صفحه بعد
        if (completeCode === '111111' && __DEV__) {
          console.log('⚠️ Using test code fallback (API failed but continuing for testing)');
          // برای تست، یک user mock بساز
          const mockUser = {
            id: 1,
            email: email,
            display_name: 'Test User',
            registered_date: new Date().toISOString(),
            role: 'subscriber',
            is_admin: false,
          };
          
          try {
            await saveToken('test_token_' + Date.now());
            await saveUser(mockUser);
            router.replace('/home');
          } catch (saveError) {
            console.error('Error saving mock data:', saveError);
          }
          return;
        }
        
        // نمایش خطا
        const errorMessage = response?.message || 'کد تأیید نامعتبر است';
        console.log('Verify error:', errorMessage);
        console.log('Full error response:', response);
        
        // فقط یک بار alert نشون بده
        Alert.alert('خطا', errorMessage);
        
        // پاک کردن کد برای تلاش مجدد
        setCode('');
        // بعد از نمایش خطا، دوباره فعال کن (اما فقط بعد از 1 ثانیه)
        setTimeout(() => {
          setIsDisabled(false);
        }, 1000);
      }
    } catch (error: any) {
      // مطمئن شو که loading همیشه متوقف میشه
      setIsLoading(false);
      setIsVerifying(false);
      console.error('Verify error (catch):', error);
      
      // جلوگیری از crash
      const errorMessage = error?.message || 'خطا در اتصال به سرور';
      Alert.alert('خطا', errorMessage + '\n\nلطفاً دوباره تلاش کنید.');
      
      // پاک کردن کد برای تلاش مجدد
      setCode('');
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;
    
    // جلوگیری از multiple calls
    if (isVerifying || isLoading) {
      console.log('Already verifying, skipping...');
      return;
    }
    
    // جلوگیری از تایید دوباره بعد از لاگین موفق
    if (isLoggedIn) {
      console.log('Already logged in, skipping...');
      return;
    }
    
    setIsVerifying(true);
    setIsLoading(true);
    console.log('Verifying code:', code);
    
    try {
      const response = await verifyCode(email, code);
      console.log('📦 Full Verify Response:', JSON.stringify(response, null, 2));
      
      // همیشه loading رو متوقف کن
      setIsLoading(false);
      setIsVerifying(false);
      
      if (response && response.success && response.token && response.user) {
        // علامت‌گذاری که لاگین موفق انجام شده - جلوگیری از هرگونه درخواست بعدی
        setIsLoggedIn(true);
        setIsDisabled(true);
        
        // لاگ اطلاعات کاربر
        console.log('✅ Login Successful!');
        console.log('👤 User Info:', {
          id: response.user.id,
          email: response.user.email,
          display_name: response.user.display_name,
          role: response.user.role,
          is_admin: response.user.is_admin,
        });
        console.log('🔑 Token:', response.token.substring(0, 20) + '...');
        console.log('📍 Navigation:', response.user.is_admin ? '→ Admin Panel' : '→ Home');
        
        try {
          // ذخیره user در یک متغیر محلی برای استفاده در callback
          const user = response.user;
          const userIsAdmin = user.is_admin;
          
          // ذخیره token و اطلاعات کاربر
          await saveToken(response.token);
          await saveUser(user);
          console.log('💾 Token and user saved successfully');
          
          // نمایش پیام موفقیت
          Alert.alert('موفق', 'ورود با موفقیت انجام شد', [
            {
              text: 'باشه',
              onPress: () => {
                // اگر redirect مشخص شده، کاربر را به همان صفحه (مثلاً ad-detail) برگردان
                if (redirect) {
                  let target = redirect;
                  const query: string[] = [];
                  if (adId) {
                    query.push(`id=${encodeURIComponent(adId)}`);
                  }
                  if (action) {
                    query.push(`action=${encodeURIComponent(action)}`);
                  }
                  if (query.length > 0) {
                    target += `?${query.join('&')}`;
                  }
                  console.log('🚀 Navigating to redirect target:', target);
                  router.replace(target as any);
                  return;
                }

                // در غیر این صورت هدایت بر اساس role
                if (userIsAdmin) {
                  console.log('🚀 Navigating to /admin');
                  router.replace('/admin');
                } else {
                  console.log('🚀 Navigating to /home');
                  router.replace('/home');
                }
              }
            }
          ]);
        } catch (saveError) {
          console.error('❌ Error saving token/user:', saveError);
          Alert.alert('خطا', 'خطا در ذخیره اطلاعات');
          // اگر خطا در save بود، flag را reset کن تا کاربر بتواند دوباره تلاش کند
          setIsLoggedIn(false);
          setIsDisabled(false);
        }
      } else {
        // برای تست: اگر کد تست (111111) باشه، حتی اگر API fail بشه، برو به صفحه بعد
        if (code === '111111' && __DEV__) {
          console.log('⚠️ Using test code fallback (API failed but continuing for testing)');
          // برای تست، یک user mock بساز
          const mockUser = {
            id: 1,
            email: email,
            display_name: 'Test User',
            registered_date: new Date().toISOString(),
            role: 'subscriber',
            is_admin: false,
          };
          
          try {
            await saveToken('test_token_' + Date.now());
            await saveUser(mockUser);
            router.replace('/home');
          } catch (saveError) {
            console.error('Error saving mock data:', saveError);
          }
          return;
        }
        
        // نمایش خطا
        const errorMessage = response?.message || 'کد تأیید نامعتبر است';
        console.log('Verify error:', errorMessage);
        console.log('Full error response:', response);
        Alert.alert('خطا', errorMessage);
        // پاک کردن کد
        setCode('');
        // بعد از نمایش خطا، دوباره فعال کن (اما فقط بعد از 1 ثانیه)
        setTimeout(() => {
          setIsDisabled(false);
        }, 1000);
      }
    } catch (error: any) {
      // مطمئن شو که loading همیشه متوقف میشه
      setIsLoading(false);
      setIsVerifying(false);
      console.error('Verify error (catch):', error);
      
      // جلوگیری از crash
      const errorMessage = error?.message || 'خطا در اتصال به سرور';
      Alert.alert('خطا', errorMessage + '\n\nلطفاً دوباره تلاش کنید.');
      
      // پاک کردن کد برای تلاش مجدد
      setCode('');
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    
    try {
      const response = await sendVerificationCode(email);
      
      setIsLoading(false);
      
      if (response.success) {
        // ریست کردن تایمر به 2 دقیقه
        setTimer(120);
        setCanResend(false);
        setCode('');
        Alert.alert('موفق', 'کد تأیید مجدداً ارسال شد');
      } else {
        Alert.alert('خطا', response.message || 'خطا در ارسال مجدد کد');
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('خطا', 'خطا در اتصال به سرور');
      console.error('Resend code error:', error);
    }
  };

  const handleEditEmail = () => {
    // چون از router.replace استفاده شده، router.back() کار نمی‌کند
    // باید مستقیماً به صفحه login برگردیم
    router.replace('/login');
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isButtonDisabled = code.length !== 6 || isLoading || isDisabled || isLoggedIn;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor="#F1F8F4" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
            <ThemedText style={styles.title}>کد تأیید را وارد کنید</ThemedText>
            
            {/* Subtitle with Edit Link */}
            <View style={styles.subtitleContainer}>
              <TouchableOpacity onPress={handleEditEmail} style={styles.editButton}>
                <ThemedText style={styles.editText}>ویرایش ایمیل</ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.subtitle}>
                کد 6 رقمی به ایمیل {email} ارسال شد.
              </ThemedText>
            </View>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              <OTPInput
                length={6}
                onComplete={handleCodeComplete}
                onChange={handleCodeChange}
                disabled={isDisabled || isLoggedIn}
              />
            </View>

            {/* Timer / Resend Button - در وسط */}
            <View style={styles.timerContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode} style={styles.resendButton}>
                  <ThemedText style={styles.resendText}>درخواست مجدد کد</ThemedText>
                </TouchableOpacity>
              ) : (
                <ThemedText style={styles.timerText}>
                  {formatTimer(timer)} تا درخواست مجدد کد
                </ThemedText>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Verify Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="تأیید و ادامه"
            onPress={handleVerify}
            loading={isLoading}
            disabled={isButtonDisabled}
            variant={isButtonDisabled ? 'secondary' : 'primary'}
            size="large"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F4',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    maxWidth: 430,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333333',
    marginBottom: 16,
    fontFamily: 'Vazir-Bold',
    marginTop: 40,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  subtitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    color: '#333333',
    fontFamily: 'Vazir-FD',
    marginRight: 8,
  },
  editButton: {
    padding: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E7002B',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  otpContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 0, // حذف padding برای جلوگیری از بیرون زدن از چپ
    width: '100%',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',
  },
  timerText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    color: '#757575',
    fontFamily: 'Vazir-FD',
  },
  resendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#E7002B',
    fontFamily: 'Vazir-FD',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    marginTop: 'auto',
  },
});

