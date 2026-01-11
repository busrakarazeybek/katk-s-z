import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { ArticleVerifier } from '../../components/experts/ArticleVerifier';
import { useAuth } from '../../contexts/AuthContext';
import { applyForExpertRole, verifyAcademicArticle } from '../../services/firebase/expert';

export default function ExpertRegisterScreen() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();

  const [step, setStep] = useState<'account' | 'expert'>('account');
  const [showArticleVerifier, setShowArticleVerifier] = useState(false);

  // Account step fields
  const [accountData, setAccountData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Expert step fields
  const [expertData, setExpertData] = useState({
    fullName: '',
    specialization: '',
    institution: '',
    articleUrl: '',
    additionalInfo: '',
  });

  const [articleVerified, setArticleVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const updateAccountField = (field: string, value: string) => {
    setAccountData((prev) => ({ ...prev, [field]: value }));
  };

  const updateExpertField = (field: string, value: string) => {
    setExpertData((prev) => ({ ...prev, [field]: value }));
  };

  const validateAccountStep = (): boolean => {
    if (!accountData.displayName.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin.');
      return false;
    }

    if (!accountData.email.trim() || !accountData.email.includes('@')) {
      Alert.alert('Hata', 'Geçerli bir e-posta adresi girin.');
      return false;
    }

    if (accountData.password.length < 6) {
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalıdır.');
      return false;
    }

    if (accountData.password !== accountData.confirmPassword) {
      Alert.alert('Hata', 'Şifreler eşleşmiyor.');
      return false;
    }

    if (!agreedToTerms) {
      Alert.alert('Hata', 'Kullanım koşullarını kabul etmelisiniz.');
      return false;
    }

    return true;
  };

  const validateExpertStep = (): boolean => {
    if (!expertData.fullName.trim()) {
      Alert.alert('Hata', 'Lütfen tam adınızı girin.');
      return false;
    }

    if (!expertData.specialization.trim()) {
      Alert.alert('Hata', 'Lütfen uzmanlık alanınızı girin.');
      return false;
    }

    if (!expertData.institution.trim()) {
      Alert.alert('Hata', 'Lütfen kurumunuzu girin.');
      return false;
    }

    if (!expertData.articleUrl.trim()) {
      Alert.alert('Hata', 'Lütfen makale URL\'si girin.');
      return false;
    }

    if (!articleVerified) {
      Alert.alert('Hata', 'Lütfen makale doğrulamasını yapın.');
      return false;
    }

    return true;
  };

  const handleAccountStepNext = () => {
    if (!validateAccountStep()) return;
    setStep('expert');
  };

  const handleVerifyArticle = async (articleUrl: string) => {
    const result = await verifyAcademicArticle(articleUrl);
    if (result.valid) {
      setArticleVerified(true);
      setExpertData((prev) => ({ ...prev, articleUrl }));
    }
    return result;
  };

  const handleExpertRegister = async () => {
    if (!validateExpertStep()) return;

    try {
      setLoading(true);

      // 1. Create account
      const userCredential = await signUp(
        accountData.email.trim(),
        accountData.password,
        accountData.displayName.trim()
      );

      // 2. Submit expert application
      await applyForExpertRole(
        userCredential.user.uid,
        accountData.email.trim(),
        expertData.fullName.trim(),
        expertData.articleUrl.trim(),
        expertData.specialization.trim(),
        expertData.institution.trim(),
        expertData.additionalInfo.trim()
      );

      Alert.alert(
        'Başvuru Gönderildi! 🎉',
        'Uzman hesabı başvurunuz alındı. İnceleme süreci tamamlandığında e-posta ile bilgilendirileceksiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      Alert.alert('Hata', 'Kullanım koşullarını kabul etmelisiniz.');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await signInWithGoogle();
      setAccountData({
        ...accountData,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
      });
      setStep('expert');
    } catch (error: any) {
      Alert.alert('Hata', 'Google ile giriş yapılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🔬</Text>
            <Text style={styles.title}>Uzman Kaydı</Text>
            <Text style={styles.subtitle}>
              {step === 'account'
                ? 'Adım 1/2: Hesap Oluştur'
                : 'Adım 2/2: Uzman Bilgileri'}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]}>
              <Text style={styles.progressDotText}>1</Text>
            </View>
            <View style={[styles.progressLine, step === 'expert' && styles.progressLineActive]} />
            <View style={[styles.progressDot, step === 'expert' && styles.progressDotActive]}>
              <Text style={styles.progressDotText}>2</Text>
            </View>
          </View>

          {/* Step 1: Account Creation */}
          {step === 'account' && (
            <>
              <Card style={styles.formCard}>
                <Text style={styles.formTitle}>Hesap Bilgileri</Text>

                {/* Display Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ad Soyad</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ahmet Yılmaz"
                    placeholderTextColor={Colors.text.disabled}
                    value={accountData.displayName}
                    onChangeText={(value) => updateAccountField('displayName', value)}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>E-posta</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ornek@email.com"
                    placeholderTextColor={Colors.text.disabled}
                    value={accountData.email}
                    onChangeText={(value) => updateAccountField('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şifre</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.text.disabled}
                      value={accountData.password}
                      onChangeText={(value) => updateAccountField('password', value)}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.showPasswordButton}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.showPasswordText}>
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helperText}>En az 6 karakter</Text>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Şifre Tekrar</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.text.disabled}
                      value={accountData.confirmPassword}
                      onChangeText={(value) => updateAccountField('confirmPassword', value)}
                      secureTextEntry={!showConfirmPassword}
                      editable={!loading}
                    />
                    <TouchableOpacity
                      style={styles.showPasswordButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Text style={styles.showPasswordText}>
                        {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Terms Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                  disabled={loading}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    <Text style={styles.termsLink}>Kullanım Koşulları</Text> ve{' '}
                    <Text style={styles.termsLink}>Gizlilik Politikası</Text>nı kabul ediyorum.
                  </Text>
                </TouchableOpacity>

                <Button
                  title="Devam Et"
                  onPress={handleAccountStepNext}
                  disabled={loading}
                />

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>veya</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Google Sign In */}
                <Button
                  title="Google ile Devam Et"
                  onPress={handleGoogleSignIn}
                  variant="outline"
                  disabled={loading}
                />
              </Card>
            </>
          )}

          {/* Step 2: Expert Information */}
          {step === 'expert' && (
            <>
              <Card style={styles.formCard}>
                <Text style={styles.formTitle}>Uzman Bilgileri</Text>

                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Tam Ad *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Prof. Dr. Ahmet Yılmaz"
                    placeholderTextColor={Colors.text.disabled}
                    value={expertData.fullName}
                    onChangeText={(value) => updateExpertField('fullName', value)}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                  <Text style={styles.helperText}>
                    Makalede geçen adınız ile aynı olmalıdır
                  </Text>
                </View>

                {/* Specialization */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Uzmanlık Alanı *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Beslenme ve Diyetetik"
                    placeholderTextColor={Colors.text.disabled}
                    value={expertData.specialization}
                    onChangeText={(value) => updateExpertField('specialization', value)}
                    editable={!loading}
                  />
                  <Text style={styles.helperText}>
                    Örn: Beslenme ve Diyetetik, Biyokimya, İç Hastalıkları
                  </Text>
                </View>

                {/* Institution */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Kurum *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="İstanbul Üniversitesi"
                    placeholderTextColor={Colors.text.disabled}
                    value={expertData.institution}
                    onChangeText={(value) => updateExpertField('institution', value)}
                    editable={!loading}
                  />
                  <Text style={styles.helperText}>
                    Çalıştığınız üniversite, hastane veya araştırma kurumu
                  </Text>
                </View>

                {/* Article URL */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Makale URL *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="https://pubmed.ncbi.nlm.nih.gov/..."
                    placeholderTextColor={Colors.text.disabled}
                    value={expertData.articleUrl}
                    onChangeText={(value) => updateExpertField('articleUrl', value)}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading || articleVerified}
                  />
                  {articleVerified && (
                    <Text style={styles.verifiedText}>✓ Makale doğrulandı</Text>
                  )}
                  <Button
                    title={articleVerified ? 'Makale Değiştir' : 'Makale Doğrula'}
                    onPress={() => setShowArticleVerifier(true)}
                    variant="outline"
                    size="small"
                    disabled={loading}
                    style={{ marginTop: 8 }}
                  />
                </View>

                {/* Additional Info */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Ek Bilgiler (Opsiyonel)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Diğer yayınlarınız, sertifikalarınız veya önemli gördüğünüz bilgiler..."
                    placeholderTextColor={Colors.text.disabled}
                    value={expertData.additionalInfo}
                    onChangeText={(value) => updateExpertField('additionalInfo', value)}
                    multiline
                    numberOfLines={4}
                    editable={!loading}
                  />
                </View>

                {/* Back and Submit Buttons */}
                <View style={styles.buttonRow}>
                  <Button
                    title="Geri"
                    onPress={() => setStep('account')}
                    variant="outline"
                    disabled={loading}
                    style={styles.backButton}
                  />
                  <Button
                    title="Başvuru Gönder"
                    onPress={handleExpertRegister}
                    loading={loading}
                    disabled={loading || !articleVerified}
                    style={styles.submitButton}
                  />
                </View>
              </Card>

              {/* Info Card */}
              <Card style={styles.infoCard}>
                <Text style={styles.infoTitle}>ℹ️ Başvuru Süreci</Text>
                <Text style={styles.infoText}>
                  1. Başvurunuz yönetim ekibi tarafından incelenecektir.{'\n'}
                  2. Makale doğrulaması ve bilgilerinizin kontrolü yapılacaktır.{'\n'}
                  3. Onay süreci ortalama 2-3 iş günü sürmektedir.{'\n'}
                  4. Sonuç e-posta ile bildirilecektir.
                </Text>
              </Card>
            </>
          )}

          {/* Login Link */}
          <View style={styles.loginSection}>
            <Text style={styles.loginText}>Zaten hesabınız var mı?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              disabled={loading}
            >
              <Text style={styles.loginLink}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Article Verifier Modal */}
      <ArticleVerifier
        visible={showArticleVerifier}
        onClose={() => setShowArticleVerifier(false)}
        onVerify={handleVerifyArticle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  progressDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.primary.green,
    borderColor: Colors.primary.green,
  },
  progressDotText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: Colors.ui.border,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: Colors.primary.green,
  },
  formCard: {
    padding: 24,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  showPasswordButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  showPasswordText: {
    fontSize: 20,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.primary.green,
    fontWeight: '600',
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.ui.border,
    marginRight: 10,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary.green,
    borderColor: Colors.primary.green,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.primary.green,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.ui.divider,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: Colors.text.disabled,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  infoCard: {
    backgroundColor: Colors.primary.greenLight + '20',
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginRight: 6,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary.green,
    fontWeight: '700',
  },
});
