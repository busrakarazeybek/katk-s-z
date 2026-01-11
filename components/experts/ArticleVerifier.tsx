import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface ArticleVerifierProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (articleUrl: string) => Promise<VerificationResult>;
}

export interface VerificationResult {
  valid: boolean;
  title?: string;
  authors?: string[];
  journal?: string;
  year?: number;
  doi?: string;
  error?: string;
}

export const ArticleVerifier: React.FC<ArticleVerifierProps> = ({
  visible,
  onClose,
  onVerify,
}) => {
  const [articleUrl, setArticleUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    if (!articleUrl.trim()) {
      Alert.alert('Hata', 'Lütfen makale URL\'si girin.');
      return;
    }

    // Basic URL validation
    if (!articleUrl.startsWith('http')) {
      Alert.alert('Hata', 'Geçerli bir URL girin (http:// veya https://)');
      return;
    }

    try {
      setVerifying(true);
      setResult(null);

      const verification = await onVerify(articleUrl);
      setResult(verification);

      if (verification.valid) {
        Alert.alert(
          'Doğrulandı ✓',
          'Makale başarıyla doğrulandı!',
          [{ text: 'Tamam', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Doğrulanamadı',
          verification.error || 'Makale doğrulanamadı. Lütfen geçerli bir akademik kaynak URL\'si girin.'
        );
      }
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Doğrulama sırasında bir hata oluştu.');
    } finally {
      setVerifying(false);
    }
  };

  const getSupportedSources = () => [
    { name: 'PubMed', example: 'pubmed.ncbi.nlm.nih.gov' },
    { name: 'Google Scholar', example: 'scholar.google.com' },
    { name: 'ResearchGate', example: 'researchgate.net' },
    { name: 'ScienceDirect', example: 'sciencedirect.com' },
    { name: 'Nature', example: 'nature.com' },
    { name: 'PubMed Central', example: 'ncbi.nlm.nih.gov/pmc' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Makale Doğrulama</Text>
          <Button title="Kapat" onPress={onClose} variant="outline" size="small" />
        </View>

        <View style={styles.content}>
          {/* Info */}
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>📚 Bilimsel Kaynak Doğrulama</Text>
            <Text style={styles.infoText}>
              Uzman hesabı oluşturmak için yayınlanmış bir bilimsel makale gereklidir.
              Makalenin beslenme, biyokimya veya tıp alanında olması beklenir.
            </Text>
          </Card>

          {/* Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Makale URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
              placeholderTextColor={Colors.text.disabled}
              value={articleUrl}
              onChangeText={setArticleUrl}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!verifying}
            />
            <Text style={styles.helperText}>
              PubMed, Google Scholar veya diğer akademik veritabanlarından alınan makale linki
            </Text>
          </View>

          {/* Verify button */}
          <Button
            title="Doğrula"
            onPress={handleVerify}
            loading={verifying}
            disabled={!articleUrl.trim() || verifying}
            style={{ marginBottom: 20 }}
          />

          {/* Result */}
          {result && (
            <Card
              style={[
                styles.resultCard,
                result.valid ? styles.resultSuccess : styles.resultError,
              ]}
            >
              <Text style={styles.resultIcon}>
                {result.valid ? '✓' : '✗'}
              </Text>
              <Text style={styles.resultTitle}>
                {result.valid ? 'Doğrulandı' : 'Doğrulanamadı'}
              </Text>
              {result.title && (
                <Text style={styles.resultDetail}>
                  📄 {result.title}
                </Text>
              )}
              {result.authors && result.authors.length > 0 && (
                <Text style={styles.resultDetail}>
                  👤 {result.authors.join(', ')}
                </Text>
              )}
              {result.journal && (
                <Text style={styles.resultDetail}>
                  📖 {result.journal}
                </Text>
              )}
              {result.year && (
                <Text style={styles.resultDetail}>
                  📅 {result.year}
                </Text>
              )}
              {result.error && (
                <Text style={styles.errorText}>
                  {result.error}
                </Text>
              )}
            </Card>
          )}

          {/* Supported sources */}
          <View style={styles.sourcesSection}>
            <Text style={styles.sourcesTitle}>Desteklenen Kaynaklar:</Text>
            {getSupportedSources().map((source, index) => (
              <View key={index} style={styles.sourceItem}>
                <Text style={styles.sourceDot}>•</Text>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceExample}>({source.example})</Text>
              </View>
            ))}
          </View>
        </View>
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
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: Colors.primary.greenLight + '20',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
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
    marginBottom: 6,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  resultCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  resultSuccess: {
    backgroundColor: Colors.primary.greenLight + '20',
    borderWidth: 2,
    borderColor: Colors.primary.green,
  },
  resultError: {
    backgroundColor: Colors.primary.redLight + '20',
    borderWidth: 2,
    borderColor: Colors.primary.red,
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  resultDetail: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 6,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 13,
    color: Colors.primary.red,
    textAlign: 'center',
    marginTop: 8,
  },
  sourcesSection: {
    marginTop: 'auto',
  },
  sourcesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceDot: {
    fontSize: 16,
    color: Colors.primary.green,
    marginRight: 8,
  },
  sourceName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 4,
  },
  sourceExample: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
});
