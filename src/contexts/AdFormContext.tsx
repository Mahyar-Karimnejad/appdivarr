import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AdFormData {
  // تصاویر
  images: Array<{ uri: string; url?: string; alt_text?: string }>;
  video_url: string | null;
  
  // اطلاعات اصلی
  title: string;
  description: string;
  category_id: number | null;
  location: string | null;
  images_belong_to_property: boolean | null; // true/false/null
  
  // قیمت و متراژ
  price: string; // به صورت string برای input
  land_area: string; // متراژ زمین
  
  // امکانات
  room_count: string | null;
  build_year: string | null;
  has_parking: string | null; // 'yes' | 'no' | null
  has_storage: string | null; // 'yes' | 'no' | null
  has_elevator: string | null; // 'yes' | 'no' | null
  
  // سایر ویژگی‌ها
  other_features: string; // JSON string یا comma-separated
  building_direction?: string | null;
  floor_type?: string | null;
  bathroom_count?: string | null;
  cooling_system?: string | null;
  heating_system?: string | null;
  document_type?: string | null;
  has_yard?: boolean;
  has_pool?: boolean;
  has_jacuzzi?: boolean;
  has_sauna?: boolean;
}

interface AdFormContextType {
  formData: AdFormData;
  updateFormData: (data: Partial<AdFormData>) => void;
  resetFormData: () => void;
}

const initialFormData: AdFormData = {
  images: [],
  video_url: null,
  title: '',
  description: '',
  category_id: null,
  location: null,
  images_belong_to_property: null,
  price: '',
  land_area: '',
  room_count: null,
  build_year: null,
  has_parking: null,
  has_storage: null,
  has_elevator: null,
  other_features: '',
  building_direction: null,
  floor_type: null,
  bathroom_count: null,
  cooling_system: null,
  heating_system: null,
  document_type: null,
  has_yard: false,
  has_pool: false,
  has_jacuzzi: false,
  has_sauna: false,
};

const AdFormContext = createContext<AdFormContextType | undefined>(undefined);

export function AdFormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<AdFormData>(initialFormData);

  const updateFormData = (data: Partial<AdFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const resetFormData = () => {
    setFormData(initialFormData);
  };

  return (
    <AdFormContext.Provider value={{ formData, updateFormData, resetFormData }}>
      {children}
    </AdFormContext.Provider>
  );
}

export function useAdForm() {
  const context = useContext(AdFormContext);
  if (context === undefined) {
    throw new Error('useAdForm must be used within AdFormProvider');
  }
  return context;
}

