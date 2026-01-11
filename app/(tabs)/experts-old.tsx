import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Card } from '../../components/common/Card';
import { Loading } from '../../components/common/Loading';
import { ExpertPost } from '../../types';
import { getExpertPosts } from '../../services/firebase/firestore';

export default function ExpertsScreen() {
  const [posts, setPosts] = useState<ExpertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const renderPost = ({ item }: { item: ExpertPost }) => (
    <Card style={styles.postCard} onPress={() => {}}>
      <View style={styles.postHeader}>
        <View style={styles.authorAvatar}>
          <Text style={styles.authorInitial}>
            {item.authorName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{item.authorName}</Text>
          <Text style={styles.authorSpecialization}>
            {item.authorSpecialization}
          </Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{getCategoryLabel(item.category)}</Text>
        </View>
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      {item.excerpt && (
        <Text style={styles.postExcerpt} numberOfLines={3}>
          {item.excerpt}
        </Text>
      )}

      <View style={styles.postFooter}>
        <Text style={styles.footerText}>❤️ {item.likes}</Text>
        <Text style={styles.footerText}>💬 {item.commentCount}</Text>
        <Text style={styles.footerText}>👁️ {item.views}</Text>
      </View>
    </Card>
  );

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      research: 'Araştırma',
      news: 'Haber',
      guide: 'Rehber',
      warning: 'Uyarı',
      myth: 'Mit',
    };
    return labels[category] || category;
  };

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Loading message="Uzman görüşleri yükleniyor..." fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Uzman Görüşleri</Text>
        <Text style={styles.subtitle}>
          Alanında uzman araştırmacıların makaleleri
        </Text>
      </View>

      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👨‍🔬</Text>
          <Text style={styles.emptyTitle}>Henüz İçerik Yok</Text>
          <Text style={styles.emptyText}>
            Uzmanlardan gelen ilk makaleler yakında burada görünecek
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
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
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  listContent: {
    padding: 20,
  },
  postCard: {
    marginBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  authorSpecialization: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: Colors.primary.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  postExcerpt: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
  },
  footerText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginRight: 16,
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
