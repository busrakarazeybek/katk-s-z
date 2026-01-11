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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PostCategory } from '../../types';
import { Colors } from '../../constants/colors';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';

interface CreatePostSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData) => Promise<void>;
}

export interface CreatePostData {
  title: string;
  content: string;
  excerpt: string;
  category: PostCategory;
  tags: string[];
  imageUri?: string;
  sources: { title: string; url: string; type: string }[];
  published: boolean;
}

const POST_CATEGORIES: { value: PostCategory; label: string; emoji: string }[] = [
  { value: 'research', label: 'Araştırma', emoji: '🔬' },
  { value: 'news', label: 'Haber', emoji: '📰' },
  { value: 'guide', label: 'Rehber', emoji: '📖' },
  { value: 'warning', label: 'Uyarı', emoji: '⚠️' },
  { value: 'myth', label: 'Mit Çürütme', emoji: '❌' },
];

export const CreatePostSheet: React.FC<CreatePostSheetProps> = ({
  visible,
  onClose,
  onSubmit,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState<PostCategory>('research');
  const [tags, setTags] = useState('');
  const [imageUri, setImageUri] = useState<string>('');
  const [sources, setSources] = useState<{ title: string; url: string }[]>([
    { title: '', url: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [isDraft, setIsDraft] = useState(true);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addSource = () => {
    setSources([...sources, { title: '', url: '' }]);
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const updateSource = (index: number, field: 'title' | 'url', value: string) => {
    const newSources = [...sources];
    newSources[index][field] = value;
    setSources(newSources);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen başlık girin.');
      return false;
    }

    if (!content.trim()) {
      Alert.alert('Hata', 'Lütfen içerik girin.');
      return false;
    }

    if (!excerpt.trim()) {
      Alert.alert('Hata', 'Lütfen özet girin.');
      return false;
    }

    // Check if at least one valid source
    const validSources = sources.filter((s) => s.url.trim().length > 0);
    if (validSources.length === 0 && !isDraft) {
      Alert.alert('Hata', 'Yayınlamak için en az bir kaynak eklemelisiniz.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (publish: boolean) => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const validSources = sources
        .filter((s) => s.url.trim().length > 0)
        .map((s) => ({
          title: s.title.trim() || 'Kaynak',
          url: s.url.trim(),
          type: detectSourceType(s.url),
        }));

      const data: CreatePostData = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim(),
        category,
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        imageUri: imageUri || undefined,
        sources: validSources,
        published: publish,
      };

      await onSubmit(data);

      // Reset form
      setTitle('');
      setContent('');
      setExcerpt('');
      setCategory('research');
      setTags('');
      setImageUri('');
      setSources([{ title: '', url: '' }]);

      onClose();
      Alert.alert('Başarılı', publish ? 'Post yayınlandı!' : 'Taslak kaydedildi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Post oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const detectSourceType = (url: string): string => {
    if (url.includes('pubmed')) return 'pubmed';
    if (url.includes('scholar.google')) return 'scholar';
    if (url.includes('.gov')) return 'official';
    return 'other';
  };

  if (!user || user.role !== 'expert') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>🔒</Text>
            <Text style={styles.errorTitle}>Uzman Erişimi</Text>
            <Text style={styles.errorText}>
              Bu özellik sadece doğrulanmış uzmanlar için geçerlidir.
            </Text>
            <Button title="Kapat" onPress={onClose} style={{ marginTop: 20 }} />
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelButton}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Yeni Post</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Title */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Başlık *</Text>
              <TextInput
                style={styles.input}
                placeholder="Post başlığı..."
                placeholderTextColor={Colors.text.disabled}
                value={title}
                onChangeText={setTitle}
                maxLength={200}
              />
              <Text style={styles.charCount}>{title.length}/200</Text>
            </View>

            {/* Category */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kategori *</Text>
              <View style={styles.categoryGrid}>
                {POST_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryCard,
                      category === cat.value && styles.categoryCardSelected,
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        category === cat.value && styles.categoryLabelSelected,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Excerpt */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Özet *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Kısa özet (feed'de görünecek)..."
                placeholderTextColor={Colors.text.disabled}
                value={excerpt}
                onChangeText={setExcerpt}
                multiline
                numberOfLines={3}
                maxLength={300}
              />
              <Text style={styles.charCount}>{excerpt.length}/300</Text>
            </View>

            {/* Content */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>İçerik *</Text>
              <TextInput
                style={[styles.input, styles.contentArea]}
                placeholder="Post içeriğini yazın... (Markdown destekli)"
                placeholderTextColor={Colors.text.disabled}
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={10}
                maxLength={5000}
              />
              <Text style={styles.charCount}>{content.length}/5000</Text>
            </View>

            {/* Image */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Görsel (Opsiyonel)</Text>
              {imageUri ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImageUri('')}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Button
                  title="Görsel Ekle"
                  onPress={pickImage}
                  variant="outline"
                  size="small"
                />
              )}
            </View>

            {/* Sources */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kaynaklar (Zorunlu) *</Text>
              <Text style={styles.helperText}>
                Bilimsel makaleler, resmi kaynaklar ekleyin
              </Text>
              {sources.map((source, index) => (
                <View key={index} style={styles.sourceRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.input, styles.sourceInput]}
                      placeholder="Kaynak başlığı"
                      placeholderTextColor={Colors.text.disabled}
                      value={source.title}
                      onChangeText={(value) => updateSource(index, 'title', value)}
                      maxLength={100}
                    />
                    <TextInput
                      style={[styles.input, styles.sourceInput]}
                      placeholder="https://..."
                      placeholderTextColor={Colors.text.disabled}
                      value={source.url}
                      onChangeText={(value) => updateSource(index, 'url', value)}
                      keyboardType="url"
                      autoCapitalize="none"
                      maxLength={500}
                    />
                  </View>
                  {sources.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeSourceButton}
                      onPress={() => removeSource(index)}
                    >
                      <Text style={styles.removeSourceText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <Button
                title="+ Kaynak Ekle"
                onPress={addSource}
                variant="outline"
                size="small"
                style={{ marginTop: 8 }}
              />
            </View>

            {/* Tags */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Etiketler (Opsiyonel)</Text>
              <TextInput
                style={styles.input}
                placeholder="katkı maddesi, e621, msg (virgülle ayırın)"
                placeholderTextColor={Colors.text.disabled}
                value={tags}
                onChangeText={setTags}
                maxLength={200}
              />
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Postlar yayınlanmadan önce taslak olarak kaydedilir.
                Bilimsel kaynaklar zorunludur.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            <Button
              title="Taslak Kaydet"
              onPress={() => handleSubmit(false)}
              variant="outline"
              loading={submitting && isDraft}
              style={{ flex: 1, marginRight: 8 }}
            />
            <Button
              title="Yayınla"
              onPress={() => {
                setIsDraft(false);
                handleSubmit(true);
              }}
              loading={submitting && !isDraft}
              style={{ flex: 1, marginLeft: 8 }}
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
  cancelButton: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.secondary,
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
  contentArea: {
    minHeight: 200,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  charCount: {
    fontSize: 11,
    color: Colors.text.disabled,
    textAlign: 'right',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  categoryCard: {
    width: '30%',
    margin: 6,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.ui.border,
  },
  categoryCardSelected: {
    borderColor: Colors.primary.green,
    backgroundColor: Colors.primary.greenLight + '20',
  },
  categoryEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: Colors.primary.green,
  },
  imagePreview: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.background.secondary,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 18,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sourceInput: {
    marginBottom: 8,
  },
  removeSourceButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 6,
  },
  removeSourceText: {
    color: '#fff',
    fontSize: 18,
  },
  infoBox: {
    backgroundColor: Colors.primary.greenLight + '20',
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    backgroundColor: Colors.background.card,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
