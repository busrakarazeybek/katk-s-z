import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Button } from '../common/Button';
import { PlaceType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface AddPlaceSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: AddPlaceData) => Promise<void>;
  initialLocation?: {
    latitude: number;
    longitude: number;
  };
}

export interface AddPlaceData {
  name: string;
  type: PlaceType;
  description?: string;
  phone?: string;
  website?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const PLACE_TYPES: { value: PlaceType; label: string; emoji: string }[] = [
  { value: 'market', label: 'Market', emoji: '🏪' },
  { value: 'bakkal', label: 'Bakkal', emoji: '🏬' },
  { value: 'manav', label: 'Manav', emoji: '🥬' },
  { value: 'restoran', label: 'Restoran', emoji: '🍽️' },
  { value: 'sarkuteri', label: 'Şarküteri', emoji: '🥖' },
  { value: 'organik', label: 'Organik Dükkan', emoji: '🌿' },
];

export const AddPlaceSheet: React.FC<AddPlaceSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  initialLocation,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<PlaceType>('market');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'Mekan eklemek için giriş yapmalısınız.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen mekan adını girin.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Hata', 'Lütfen adres bilgisi girin.');
      return;
    }

    if (!initialLocation) {
      Alert.alert('Hata', 'Konum bilgisi alınamadı.');
      return;
    }

    try {
      setSubmitting(true);
      const data: AddPlaceData = {
        name: name.trim(),
        type: selectedType,
        description: description.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        location: {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          address: address.trim(),
        },
      };

      await onSubmit(data);

      // Reset form
      setName('');
      setSelectedType('market');
      setDescription('');
      setPhone('');
      setWebsite('');
      setAddress('');

      onClose();
      Alert.alert('Başarılı', 'Mekan eklendi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Mekan eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loginContainer}>
            <Text style={styles.loginEmoji}>🔒</Text>
            <Text style={styles.loginTitle}>Giriş Gerekli</Text>
            <Text style={styles.loginText}>
              Mekan eklemek için giriş yapmalısınız
            </Text>
            <Button
              title="Kapat"
              onPress={onClose}
              variant="outline"
              style={{ marginTop: 20 }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Yeni Mekan Ekle</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mekan Adı *</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Organik Market"
                placeholderTextColor={Colors.text.disabled}
                value={name}
                onChangeText={setName}
                maxLength={100}
              />
            </View>

            {/* Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mekan Tipi *</Text>
              <View style={styles.typeGrid}>
                {PLACE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={[
                      styles.typeCard,
                      selectedType === type.value && styles.typeCardSelected,
                    ]}
                    onPress={() => setSelectedType(type.value)}
                  >
                    <Text style={styles.typeEmoji}>{type.emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        selectedType === type.value && styles.typeLabelSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Adres *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Sokak, mahalle, ilçe, il"
                placeholderTextColor={Colors.text.disabled}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Bu mekan hakkında bilgi verin..."
                placeholderTextColor={Colors.text.disabled}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={300}
              />
            </View>

            {/* Phone */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Telefon (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                placeholder="0xxx xxx xx xx"
                placeholderTextColor={Colors.text.disabled}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            {/* Website */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Website (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://example.com"
                placeholderTextColor={Colors.text.disabled}
                value={website}
                onChangeText={setWebsite}
                keyboardType="url"
                autoCapitalize="none"
                maxLength={200}
              />
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Mekan bilgileri diğer kullanıcılar tarafından doğrulanacaktır.
              </Text>
            </View>
          </ScrollView>

          {/* Submit button */}
          <View style={styles.footer}>
            <Button
              title="Mekan Ekle"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!name.trim() || !address.trim()}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 20,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  typeCard: {
    width: '31%',
    margin: 6,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ui.border,
  },
  typeCardSelected: {
    borderColor: Colors.primary.green,
    backgroundColor: Colors.primary.greenLight + '20',
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: Colors.primary.green,
  },
  infoBox: {
    backgroundColor: Colors.primary.greenLight + '20',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    backgroundColor: Colors.background.card,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  loginText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
