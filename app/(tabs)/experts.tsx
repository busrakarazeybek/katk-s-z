import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Loading } from '../../components/common/Loading';
import { ExpertPost as ExpertPostType } from '../../types';
import { ExpertPost } from '../../components/experts/ExpertPost';
import { CreatePostSheet, CreatePostData } from '../../components/experts/CreatePostSheet';
import { ArticleVerifier } from '../../components/experts/ArticleVerifier';
import {
  getExpertPosts,
  createExpertPost,
  verifyAcademicArticle,
  applyForExpertRole,
  likeExpertPost,
  incrementPostViews,
} from '../../services/firebase/expert';

export default function ExpertsScreen() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<ExpertPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);
  const [filter, setFilter] = useState<'all' | 'research' | 'news' | 'guide'>('all');

  const isExpert = user?.role === 'expert';

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const expertPosts = await getExpertPosts(20);
      setPosts(expertPosts);
    } catch (error) {
      console.error('Error loading expert posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handlePostPress = async (post: ExpertPostType) => {
    // Increment views
    await incrementPostViews(post.id);

    // TODO: Navigate to post detail screen
    Alert.alert(post.title, 'Detay ekranı yakında eklenecek...');
  };

  const handleLike = async (post: ExpertPostType) => {
    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'Beğenmek için giriş yapmalısınız.');
      return;
    }

    try {
      await likeExpertPost(post.id, user!.uid);
      await loadPosts(); // Refresh
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  const handleCreatePost = async (data: CreatePostData) => {
    if (!user || !isExpert) {
      throw new Error('Uzman girişi gerekli');
    }

    const expertProfile = user.expertProfile;
    if (!expertProfile) {
      throw new Error('Uzman profili bulunamadı');
    }

    await createExpertPost(
      user.uid,
      user.displayName,
      expertProfile.specialization,
      data
    );

    await loadPosts(); // Refresh
  };

  const handleApplyExpert = () => {
    setShowVerifier(true);
  };

  const handleVerifyArticle = async (articleUrl: string) => {
    if (!user) throw new Error('Giriş gerekli');

    const result = await verifyAcademicArticle(articleUrl);

    if (result.valid) {
      // If valid, proceed to application
      Alert.prompt(
        'Uzmanlık Alanı',
        'Uzmanlık alanınızı girin:',
        async (specialization) => {
          if (!specialization) return;

          Alert.prompt(
            'Kurum',
            'Çalıştığınız kurum:',
            async (institution) => {
              if (!institution) return;

              try {
                await applyForExpertRole(
                  user.uid,
                  user.email,
                  user.displayName,
                  articleUrl,
                  specialization,
                  institution
                );

                setShowVerifier(false);
                Alert.alert(
                  'Başarılı',
                  'Başvurunuz alındı! İncelenip onaylandıktan sonra bildirim alacaksınız.'
                );
              } catch (error: any) {
                Alert.alert('Hata', error.message);
              }
            }
          );
        }
      );
    }

    return result;
  };

  const getFilteredPosts = () => {
    if (filter === 'all') return posts;
    return posts.filter((post) => post.category === filter);
  };

  const FilterButton: React.FC<{
    label: string;
    value: typeof filter;
    count?: number;
  }> = ({ label, value, count }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[styles.filterText, filter === value && styles.filterTextActive]}
      >
        {label}
      </Text>
      {count !== undefined && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading message="Uzman görüşleri yükleniyor..." fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Uzman Görüşleri</Text>
          <Text style={styles.subtitle}>
            Bilim insanlarından güvenilir bilgi
          </Text>
        </View>
        {isExpert && (
          <Button
            title="+ Post"
            onPress={() => setShowCreatePost(true)}
            variant="primary"
            size="small"
          />
        )}
        {!isExpert && isAuthenticated && (
          <Button
            title="Uzman Ol"
            onPress={handleApplyExpert}
            variant="outline"
            size="small"
          />
        )}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <FilterButton label="Tümü" value="all" count={posts.length} />
        <FilterButton
          label="Araştırma"
          value="research"
          count={posts.filter((p) => p.category === 'research').length}
        />
        <FilterButton
          label="Haberler"
          value="news"
          count={posts.filter((p) => p.category === 'news').length}
        />
        <FilterButton
          label="Rehber"
          value="guide"
          count={posts.filter((p) => p.category === 'guide').length}
        />
      </View>

      {/* Posts list */}
      {getFilteredPosts().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍🔬</Text>
          <Text style={styles.emptyTitle}>Henüz İçerik Yok</Text>
          <Text style={styles.emptyText}>
            {filter === 'all'
              ? 'Uzmanlardan gelen ilk makaleler yakında burada görünecek'
              : `Bu kategoride henüz içerik yok`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredPosts()}
          renderItem={({ item }) => (
            <ExpertPost
              post={item}
              onPress={handlePostPress}
              onLike={handleLike}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary.green}
            />
          }
        />
      )}

      {/* Create post modal */}
      <CreatePostSheet
        visible={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
      />

      {/* Article verifier modal */}
      <ArticleVerifier
        visible={showVerifier}
        onClose={() => setShowVerifier(false)}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.green,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
