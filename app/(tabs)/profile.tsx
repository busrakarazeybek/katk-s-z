import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error: any) {
              Alert.alert('Hata', error.message);
            }
          },
        },
      ]
    );
  };

  const MenuItem: React.FC<{
    icon: string;
    title: string;
    onPress: () => void;
    color?: string;
  }> = ({ icon, title, onPress, color }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuTitle, color && { color }]}>{title}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>

        <View style={styles.notAuthContainer}>
          <Text style={styles.notAuthEmoji}>👤</Text>
          <Text style={styles.notAuthTitle}>Giriş Yap</Text>
          <Text style={styles.notAuthText}>
            Ürünlerinizi kaydetmek, yorum yapmak ve daha fazlası için giriş yapın
          </Text>
          <Button
            title="Giriş Yap / Kayıt Ol"
            onPress={() => router.push('/(auth)/login')}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Info */}
        <Card style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.userName}>{user.displayName}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.role === 'expert' && (
            <View style={styles.expertBadge}>
              <Text style={styles.expertBadgeText}>✓ Uzman</Text>
            </View>
          )}
        </Card>

        {/* Statistics */}
        <Card>
          <Text style={styles.sectionTitle}>İstatistikler</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Tarama</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Kayıtlı Ürün</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>0</Text>
              <Text style={styles.statLabel}>Favori</Text>
            </View>
          </View>
        </Card>

        {/* Menu */}
        <Card>
          <MenuItem
            icon="📜"
            title="Tarama Geçmişi"
            onPress={() => Alert.alert('Geçmiş', 'Tarama geçmişi açılacak...')}
          />
          <MenuItem
            icon="❤️"
            title="Favorilerim"
            onPress={() => Alert.alert('Favoriler', 'Favoriler açılacak...')}
          />
          <MenuItem
            icon="⚙️"
            title="Ayarlar"
            onPress={() => Alert.alert('Ayarlar', 'Ayarlar açılacak...')}
          />
          {user.role !== 'expert' && (
            <MenuItem
              icon="👨‍🔬"
              title="Uzman Başvurusu"
              onPress={() => router.push('/(auth)/expert-register')}
            />
          )}
        </Card>

        {/* About */}
        <Card>
          <MenuItem
            icon="ℹ️"
            title="Hakkında"
            onPress={() => Alert.alert('Hakkında', 'Katkısız v1.0.0')}
          />
          <MenuItem
            icon="📄"
            title="Gizlilik Politikası"
            onPress={() => Alert.alert('Gizlilik', 'Gizlilik politikası açılacak...')}
          />
          <MenuItem
            icon="📧"
            title="Destek"
            onPress={() => Alert.alert('Destek', 'destek@katkisiz.app')}
          />
        </Card>

        {/* Sign Out */}
        <Button
          title="Çıkış Yap"
          onPress={handleSignOut}
          variant="danger"
          style={{ marginTop: 20, marginBottom: 40 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    padding: 20,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  content: {
    padding: 20,
  },
  userCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  expertBadge: {
    backgroundColor: Colors.primary.green,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  expertBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary.green,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.divider,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.primary,
  },
  menuArrow: {
    fontSize: 20,
    color: Colors.text.disabled,
  },
  notAuthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  notAuthEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  notAuthTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  notAuthText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
