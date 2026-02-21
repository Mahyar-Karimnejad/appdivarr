// کامپوننت ورود کد OTP

import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  onChange?: (code: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 5, onComplete, onChange, disabled = false }: OTPInputProps) {
  const [codes, setCodes] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const completedRef = useRef(false); // جلوگیری از multiple calls

  const handleChange = (text: string, index: number) => {
    // اگر disabled است، هیچ کاری نکن
    if (disabled) return;
    
    // فقط اعداد مجاز
    const numericText = text.replace(/[^0-9]/g, '');
    
    if (numericText.length > 1) {
      // اگر چند عدد وارد شد، فقط اولی رو بگیر
      const newCodes = [...codes];
      newCodes[index] = numericText[0];
      setCodes(newCodes);
      
      // به input بعدی برو
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      const newCodes = [...codes];
      newCodes[index] = numericText;
      setCodes(newCodes);
      
      // اگر عدد وارد شد و input بعدی وجود داره، بهش برو
      if (numericText && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // اگر backspace زده شد و input خالی بود، به input قبلی برو
    if (e.nativeEvent.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    // وقتی focus می‌کنه، اگر قبلی‌ها پر نبودن، به اولی برو
    for (let i = 0; i < index; i++) {
      if (!codes[i]) {
        inputRefs.current[i]?.focus();
        return;
      }
    }
  };

  useEffect(() => {
    const code = codes.join('');
    onChange?.(code);
    
    if (code.length === length && !completedRef.current) {
      completedRef.current = true; // جلوگیری از multiple calls
      onComplete(code);
      
      // بعد از 1 ثانیه reset کن تا بتونه دوباره verify کنه
      setTimeout(() => {
        completedRef.current = false;
      }, 1000);
    } else if (code.length < length) {
      // اگر کد ناقص شد، reset کن
      completedRef.current = false;
    }
  }, [codes, length, onComplete, onChange]);

  return (
    <View style={styles.container}>
      {codes.map((code, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            styles.input,
            code && styles.inputFilled,
            disabled && styles.inputDisabled,
          ]}
          value={code}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
          textAlign="center"
          editable={!disabled}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12, // کاهش gap برای جلوگیری از بیرون زدن از چپ
    flexWrap: 'wrap',
    maxWidth: '100%',
  },
  input: {
    width: 44,
    height: 44,
    borderWidth: 0.5,
    borderColor: 'rgba(231, 0, 43, 0.5)',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Vazir-FD',
    color: '#333333',
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlign: 'center',
    includeFontPadding: false,
  },
  inputFilled: {
    borderColor: '#E7002B', // رنگ قرمز وقتی پر میشه
    borderWidth: 1,
  },
  inputDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
});

