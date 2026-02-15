import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useAdForm } from '@/src/contexts/AdFormContext';

const BUILDING_DIRECTION_OPTIONS = ['شمال', 'جنوب', 'شرق', 'غرب', 'شمال شرقی', 'شمال غربی', 'جنوب شرقی', 'جنوب غربی'];
const FLOOR_TYPE_OPTIONS = ['سرامیک', 'موزاییک', 'پارکت', 'سنگ', 'سایر'];
const BATHROOM_COUNT_OPTIONS = ['یک', 'دو', 'سه', 'چهار یا بیشتر'];
const COOLING_SYSTEM_OPTIONS = ['کولر آبی', 'کولر گازی', 'اسپلیت', 'چیلر', 'سایر'];
const HEATING_SYSTEM_OPTIONS = ['بخاری', 'شوفاژ', 'پکیج', 'موتورخانه', 'سایر'];
const DOCUMENT_TYPE_OPTIONS = ['سند', 'قرارداد', 'سایر'];

export default function PostAdExtraFeaturesScreen() {
  const { formData, updateFormData } = useAdForm();
  
  const [buildingDirectionModalVisible, setBuildingDirectionModalVisible] = useState(false);
  const [floorTypeModalVisible, setFloorTypeModalVisible] = useState(false);
  const [bathroomCountModalVisible, setBathroomCountModalVisible] = useState(false);
  const [coolingSystemModalVisible, setCoolingSystemModalVisible] = useState(false);
  const [heatingSystemModalVisible, setHeatingSystemModalVisible] = useState(false);
  const [documentTypeModalVisible, setDocumentTypeModalVisible] = useState(false);

  const toggle = (key: 'has_yard' | 'has_pool' | 'has_jacuzzi' | 'has_sauna') => {
    updateFormData({ [key]: !formData[key] });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#F1F8F4" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerArrow}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>سایر ویژگی‌ها و امکانات</ThemedText>

        <View style={styles.headerArrowPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* جهت ساختمان */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setBuildingDirectionModalVisible(true)}
          >
            <ThemedText style={styles.rowLabel}>جهت ساختمان</ThemedText>
            <ThemedText style={styles.rowAction}>
              {formData.building_direction || 'انتخاب'}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* جنس کف */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setFloorTypeModalVisible(true)}
          >
            <ThemedText style={styles.rowLabel}>جنس کف</ThemedText>
            <ThemedText style={styles.rowAction}>
              {formData.floor_type || 'انتخاب'}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* سرویس بهداشتی */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setBathroomCountModalVisible(true)}
          >
            <ThemedText style={styles.rowLabel}>سرویس بهداشتی</ThemedText>
            <ThemedText style={styles.rowAction}>
              {formData.bathroom_count || 'انتخاب'}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* سرمایش */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setCoolingSystemModalVisible(true)}
          >
            <ThemedText style={styles.rowLabel}>سرمایش</ThemedText>
            <ThemedText style={styles.rowAction}>
              {formData.cooling_system || 'انتخاب'}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* گرمایش */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setHeatingSystemModalVisible(true)}
          >
            <ThemedText style={styles.rowLabel}>گرمایش</ThemedText>
            <ThemedText style={styles.rowAction}>
              {formData.heating_system || 'انتخاب'}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* سند */}
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => setDocumentTypeModalVisible(true)}
          >
            <ThemedText style={styles.rowLabel}>سند</ThemedText>
            <ThemedText style={styles.rowAction}>
              {formData.document_type || 'انتخاب'}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.rowDivider} />

          {/* چک‌باکس‌ها */}
          <View style={styles.checkboxRow}>
            <ThemedText style={styles.checkboxLabel}>حیاط</ThemedText>
            <TouchableOpacity
              style={styles.checkbox}
              activeOpacity={0.7}
              onPress={() => toggle('has_yard')}
            >
              {formData.has_yard && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.checkboxRow}>
            <ThemedText style={styles.checkboxLabel}>استخر</ThemedText>
            <TouchableOpacity
              style={styles.checkbox}
              activeOpacity={0.7}
              onPress={() => toggle('has_pool')}
            >
              {formData.has_pool && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.checkboxRow}>
            <ThemedText style={styles.checkboxLabel}>جکوزی</ThemedText>
            <TouchableOpacity
              style={styles.checkbox}
              activeOpacity={0.7}
              onPress={() => toggle('has_jacuzzi')}
            >
              {formData.has_jacuzzi && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
          </View>
          <View style={styles.rowDivider} />

          <View style={styles.checkboxRow}>
            <ThemedText style={styles.checkboxLabel}>سونا</ThemedText>
            <TouchableOpacity
              style={styles.checkbox}
              activeOpacity={0.7}
              onPress={() => toggle('has_sauna')}
            >
              {formData.has_sauna && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* دکمه‌های قبلی / بعدی */}
      <View style={styles.footerButtonsRow}>
        {/* بعدی */}
        <TouchableOpacity
          style={styles.nextButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.nextButtonText}>ذخیره</ThemedText>
        </TouchableOpacity>

        {/* قبلی */}
        <TouchableOpacity
          style={styles.prevButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.prevButtonText}>قبلی</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Modal برای جهت ساختمان */}
      <Modal
        visible={buildingDirectionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBuildingDirectionModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setBuildingDirectionModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>جهت ساختمان</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {BUILDING_DIRECTION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ building_direction: option });
                    setBuildingDirectionModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option}</ThemedText>
                  {formData.building_direction === option && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal برای جنس کف */}
      <Modal
        visible={floorTypeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFloorTypeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setFloorTypeModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>جنس کف</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {FLOOR_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ floor_type: option });
                    setFloorTypeModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option}</ThemedText>
                  {formData.floor_type === option && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal برای سرویس بهداشتی */}
      <Modal
        visible={bathroomCountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBathroomCountModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setBathroomCountModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>سرویس بهداشتی</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {BATHROOM_COUNT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ bathroom_count: option });
                    setBathroomCountModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option}</ThemedText>
                  {formData.bathroom_count === option && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal برای سرمایش */}
      <Modal
        visible={coolingSystemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCoolingSystemModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setCoolingSystemModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>سرمایش</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {COOLING_SYSTEM_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ cooling_system: option });
                    setCoolingSystemModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option}</ThemedText>
                  {formData.cooling_system === option && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal برای گرمایش */}
      <Modal
        visible={heatingSystemModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHeatingSystemModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setHeatingSystemModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>گرمایش</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {HEATING_SYSTEM_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ heating_system: option });
                    setHeatingSystemModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option}</ThemedText>
                  {formData.heating_system === option && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal برای سند */}
      <Modal
        visible={documentTypeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDocumentTypeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.modalHeaderArrow}
                activeOpacity={0.7}
                onPress={() => setDocumentTypeModalVisible(false)}
              >
                <MaterialIcons name="arrow-forward-ios" size={22} color="#111111" />
              </TouchableOpacity>
              <ThemedText style={styles.modalHeaderTitle}>سند</ThemedText>
              <View style={styles.modalHeaderPlaceholder} />
            </View>
            <View style={styles.modalDivider} />
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    updateFormData({ document_type: option });
                    setDocumentTypeModalVisible(false);
                  }}
                >
                  <ThemedText style={styles.modalOptionText}>{option}</ThemedText>
                  {formData.document_type === option && (
                    <MaterialIcons name="check" size={20} color="#00964E" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8F4',
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerArrow: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerArrowPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    fontFamily: 'Vazir-Bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
  },
  rowAction: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
    fontFamily: 'Vazir-Medium',
    textAlign: 'left',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#D3D3D3',
  },
  checkboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1.2,
    borderColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#E7002B',
  },
  footerButtonsRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#E7002B',
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  prevButton: {
    flex: 1,
    borderRadius: 34,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E7002B',
    backgroundColor: 'transparent',
  },
  prevButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E7002B',
    fontFamily: 'Vazir-Medium',
    textAlign: 'center',
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  modalHeaderArrow: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  modalHeaderPlaceholder: {
    width: 40,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    fontFamily: 'Vazir-Bold',
    textAlign: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalScrollContent: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  modalOptionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  modalOptionText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#212121',
    fontFamily: 'Vazir-Medium',
    textAlign: 'right',
  },
});


