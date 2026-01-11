import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAnalysis } from '../../contexts/AnalysisContext';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { CameraView } from '../../components/camera/CameraView';
import { useImagePicker } from '../../components/camera/ImagePicker';
import { TrafficLight } from '../../components/analysis/TrafficLight';
import { IngredientList } from '../../components/analysis/IngredientList';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { analyzing, currentResult, analyzeImage, saveProduct, clearResult } = useAnalysis();
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const { pickImage } = useImagePicker({
    onImageSelected: handleImageSelected,
  });

  async function handleImageSelected(uri: string) {
    setCapturedImage(uri);
    try {
      await analyzeImage(uri);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Analiz başarısız oldu');
      setCapturedImage('');
    }
  }

  const handleCameraCapture = async (uri: string) => {
    setShowCamera(false);
    await handleImageSelected(uri);
  };

  const handleSaveProduct = async () => {
    if (!user) {
      Alert.alert(
        'Giriş Gerekli',
        'Ürünleri kaydetmek için giriş yapmalısınız.',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Giriş Yap', onPress: () => router.push('/(auth)/login') },
        ]
      );
      return;
    }

    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (!productName.trim()) {
      Alert.alert('Hata', 'Lütfen ürün adını girin');
      return;
    }

    try {
      await saveProduct(productName.trim());
      setShowSaveModal(false);
      setProductName('');
      Alert.alert('Başarılı', 'Ürün kaydedildi!');
      handleNewScan();
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const handleNewScan = () => {
    clearResult();
    setCapturedImage('');
  };

  // If showing result
  if (currentResult && capturedImage) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Result Header */}
          <View style={styles.resultHeader}>
            <Text style={styles.title}>Analiz Sonucu</Text>
            <TrafficLight status={currentResult.status} size="large" />
          </View>

          {/* Scanned Image */}
          <Card style={styles.imageCard}>
            <Image source={{ uri: capturedImage }} style={styles.image} />
          </Card>

          {/* Analysis Summary */}
          <Card>
            <Text style={styles.summaryTitle}>Özet</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Toplam Katkı:</Text>
              <Text style={styles.summaryValue}>{currentResult.analysis.totalAdditives}</Text>
            </View>
            {currentResult.analysis.dangerousCount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: Colors.primary.red }]}>
                  Tehlikeli:
                </Text>
                <Text style={[styles.summaryValue, { color: Colors.primary.red }]}>
                  {currentResult.analysis.dangerousCount}
                </Text>
              </View>
            )}
          </Card>

          {/* Recommendations */}
          {currentResult.recommendations && currentResult.recommendations.length > 0 && (
            <Card>
              <Text style={styles.summaryTitle}>Öneriler</Text>
              {currentResult.recommendations.map((rec, index) => (
                <Text key={index} style={styles.recommendation}>
                  • {rec}
                </Text>
              ))}
            </Card>
          )}

          {/* Ingredients List */}
          <IngredientList
            additives={currentResult.additives}
            ingredients={currentResult.ingredients}
          />

          {/* Alternative Products */}
          {currentResult.status === 'red' && (
            <Card style={styles.alternativeCard}>
              <Text style={styles.alternativeTitle}>💡 Alternatif Ara</Text>
              <Text style={styles.alternativeText}>
                Bu ürün tehlikeli katkılar içeriyor. Yakınızdaki katkısız
                ürün satan yerlere göz atın.
              </Text>
              <Button
                title="Yakındaki Alternatifleri Gör"
                onPress={() => router.push('/(tabs)/map')}
                variant="outline"
                size="small"
              />
            </Card>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              title="Yeni Tarama"
              onPress={handleNewScan}
              variant="outline"
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Kaydet"
              onPress={handleSaveProduct}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // If analyzing
  if (analyzing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading
          message="Görüntü analiz ediliyor..."
          fullScreen
        />
      </SafeAreaView>
    );
  }

  // Default: Show scan options
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.appName}>Katkısız</Text>
          <Text style={styles.tagline}>
            Katkı maddelerini anında tespit edin
          </Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>📸</Text>
          <Text style={styles.heroTitle}>Etiket Tara</Text>
          <Text style={styles.heroSubtitle}>
            Ürünün "İçindekiler" kısmının fotoğrafını çekin,{'\n'}
            anında analiz edelim
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Kamera Aç"
            onPress={() => setShowCamera(true)}
            size="large"
            style={styles.primaryButton}
          />
          <Button
            title="Galeriden Seç"
            onPress={pickImage}
            variant="outline"
            size="large"
            style={styles.secondaryButton}
          />
        </View>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Nasıl Çalışır?</Text>
          <View style={styles.infoStep}>
            <Text style={styles.infoStepNumber}>1</Text>
            <Text style={styles.infoStepText}>Ürün etiketini tara</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.infoStepNumber}>2</Text>
            <Text style={styles.infoStepText}>Otomatik analiz</Text>
          </View>
          <View style={styles.infoStep}>
            <Text style={styles.infoStepNumber}>3</Text>
            <Text style={styles.infoStepText}>Trafik ışığı sonucu al</Text>
          </View>
        </Card>
      </View>

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <CameraView
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      </Modal>

      {/* Save Product Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ürünü Kaydet</Text>
            <Text style={styles.modalSubtitle}>
              Bu ürünün adını girin:
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Örn: Coca Cola"
              value={productName}
              onChangeText={setProductName}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="İptal"
                onPress={() => {
                  setShowSaveModal(false);
                  setProductName('');
                }}
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Kaydet"
                onPress={handleConfirmSave}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary.green,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heroEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {},
  infoCard: {
    backgroundColor: Colors.background.card,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoStepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.green,
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
    marginRight: 12,
  },
  infoStepText: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  scrollContent: {
    padding: 20,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 20,
  },
  imageCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  recommendation: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 40,
  },
  alternativeCard: {
    backgroundColor: Colors.primary.redLight + '20',
    marginBottom: 20,
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  alternativeText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
  },
});
