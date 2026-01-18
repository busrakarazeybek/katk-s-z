import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  ScrollView,
  Image,
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

// Mock data for web demo
const MOCK_EXPERT_POSTS: ExpertPostType[] = [
  {
    id: '1',
    authorId: 'expert1',
    authorName: 'Dr. Ayşe Yılmaz',
    authorSpecialization: 'Gıda Mühendisi',
    authorPhoto: 'https://i.pravatar.cc/150?img=45',
    title: 'E621 (Monosodyum Glutamat) Gerçekleri',
    content: 'MSG (Monosodyum Glutamat) hakkında yaygın mitler ve bilimsel gerçekler üzerine kapsamlı bir değerlendirme.\n\nYapılan araştırmalar gösteriyor ki önerilen günlük tüketim miktarlarında MSG\'nin ciddi yan etkileri bulunmuyor. FDA ve Dünya Sağlık Örgütü tarafından GRAS (Generally Recognized as Safe) kategorisinde değerlendiriliyor.\n\n**Önemli Noktalar:**\n- MSG doğal olarak domates, peynir ve mantarda bulunur\n- "Çin Restoranı Sendromu" bilimsel olarak kanıtlanamamıştır\n- Glutamat, vücudumuzda doğal olarak üretilen bir amino asittir\n\nGünlük tüketim limitine dikkat edildiğinde MSG\'nin sağlık riski oluşturmadığı görülmektedir.',
    category: 'research',
    tags: ['MSG', 'E621', 'katkı maddeleri'],
    references: [
      {
        title: 'MSG Safety Review - PubMed',
        url: 'https://pubmed.ncbi.nlm.nih.gov/example1',
        type: 'scientific_paper',
      },
    ],
    likes: 145,
    views: 2340,
    comments: [
      {
        id: 'c1',
        userId: 'user1',
        userName: 'Mehmet K.',
        text: 'Çok bilgilendirici, teşekkürler!',
        createdAt: new Date('2024-01-11'),
      },
      {
        id: 'c2',
        userId: 'user2',
        userName: 'Elif S.',
        text: 'MSG hakkında kafamdaki soru işaretleri gitti.',
        createdAt: new Date('2024-01-12'),
      },
    ],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    authorId: 'expert2',
    authorName: 'Prof. Dr. Mehmet Kaya',
    authorSpecialization: 'Beslenme ve Diyetetik',
    authorPhoto: 'https://i.pravatar.cc/150?img=12',
    title: 'Organik Ürünler: Mitos mu Gerçek mi?',
    content: 'Organik ürünlerin besin değeri ve sağlık üzerindeki etkileri hakkında kapsamlı bir inceleme.\n\n**Araştırma Bulguları:**\nBilimsel çalışmalara göre organik ve konvansiyonel ürünler arasındaki besin değeri farkları çok küçüktür. Ancak organik ürünlerde pestisit kalıntısı belirgin şekilde daha azdır.\n\n**Avantajları:**\n- Pestisit maruziyeti daha az\n- Çevre dostu üretim\n- Hayvan refahına önem\n\n**Dezavantajları:**\n- Daha yüksek maliyet\n- Daha kısa raf ömrü\n- Sınırlı çeşit\n\nSonuç olarak, organik ürünler sağlık açısından mutlaka daha iyi değildir ancak pestisit maruziyetini azaltmak isteyenler için iyi bir seçenektir.',
    category: 'guide',
    tags: ['organik', 'beslenme', 'sağlık'],
    references: [
      {
        title: 'Organic Food Studies - Scientific Review',
        url: 'https://pubmed.ncbi.nlm.nih.gov/example2',
        type: 'scientific_paper',
      },
    ],
    likes: 234,
    views: 3450,
    comments: [
      {
        id: 'c3',
        userId: 'user3',
        userName: 'Zeynep A.',
        text: 'Organik ürünlere aşırı para vermeme gerek yok demek ki.',
        createdAt: new Date('2024-01-09'),
      },
    ],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
  },
  {
    id: '3',
    authorId: 'expert3',
    authorName: 'Dr. Zeynep Demir',
    authorSpecialization: 'Toksikoloji Uzmanı',
    authorPhoto: 'https://i.pravatar.cc/150?img=47',
    title: 'Yapay Tatlandırıcılar ve Sağlık',
    content: 'Aspartam, sukraloz ve diğer yapay tatlandırıcıların insan sağlığına etkileri üzerine güncel araştırmalar.\n\n**En Yaygın Tatlandırıcılar:**\n1. **Aspartam (E951):** Şekerden 200 kat tatlı, düşük kalorili içeceklerde yaygın\n2. **Sukraloz (E955):** Şekerden 600 kat tatlı, ısıya dayanıklı\n3. **Sakarin (E954):** En eski yapay tatlandırıcı\n\n**Güvenlik Değerlendirmesi:**\nEFSA ve FDA tarafından günlük kabul edilebilir alım (ADI) değerleri belirlenmiştir. Bu limitlerin altında tüketim güvenli kabul edilir.\n\n**Dikkat Edilmesi Gerekenler:**\n- Fenilketonüri hastalar aspartamdan kaçınmalı\n- Hamilelik ve emzirme döneminde dikkatli kullanılmalı\n- Aşırı tüketimden kaçınılmalı\n\nSonuç: Yapay tatlandırıcılar belirlenen limitlere uyulduğunda güvenlidir.',
    category: 'research',
    tags: ['tatlandırıcı', 'aspartam', 'sukraloz'],
    references: [],
    likes: 189,
    views: 2890,
    comments: [],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  {
    id: '4',
    authorId: 'expert1',
    authorName: 'Dr. Ayşe Yılmaz',
    authorSpecialization: 'Gıda Mühendisi',
    authorPhoto: 'https://i.pravatar.cc/150?img=45',
    title: 'Koruyucuların Rolü ve Önemi',
    content: 'Gıdalarda kullanılan koruyucuların mikrobiyal güvenlik açısından önemi ve doğal vs sentetik koruyucular arasındaki farklar.\n\n**Neden Koruyucu Kullanılır?**\n- Gıda kaynaklı hastalıkları önlemek\n- Raf ömrünü uzatmak\n- Besin kaybını azaltmak\n\n**Doğal Koruyucular:**\n- Tuz, şeker, sirke\n- C vitamini (E300)\n- Tokoferoller (E306-309)\n\n**Sentetik Koruyucular:**\n- Benzoatlar (E210-213)\n- Sorbatlar (E200-203)\n- Nitritler/Nitratlar (E249-252)\n\nKoruyucular olmadan modern gıda sisteminin işlemesi mümkün olmayacaktır. Önemli olan doğru koruyucuyu doğru miktarda kullanmaktır.',
    category: 'news',
    tags: ['koruyucu', 'gıda güvenliği'],
    references: [],
    likes: 98,
    views: 1560,
    comments: [
      {
        id: 'c4',
        userId: 'user4',
        userName: 'Ali Y.',
        text: 'Koruyucular hakkında düşüncelerim değişti.',
        createdAt: new Date('2024-01-04'),
      },
    ],
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

// Mock groups/communities (Reddit-style)
const MOCK_GROUPS = [
  { id: 'g1', name: 'Katkısız Yaşam', icon: '🌱', members: 12500, description: 'Katkısız ve doğal yaşam tarzı paylaşımları', color: Colors.primary.green },
  { id: 'g2', name: 'Organik Beslenme', icon: '🥕', members: 8200, description: 'Organik ürünler ve beslenme önerileri', color: '#FF9800' },
  { id: 'g3', name: 'E Kodları Ansiklopedisi', icon: '📚', members: 6800, description: 'Katkı maddeleri hakkında bilimsel bilgiler', color: '#2196F3' },
  { id: 'g4', name: 'Gıda Bilimi', icon: '🔬', members: 5400, description: 'Gıda bilimi araştırmaları ve tartışmalar', color: '#9C27B0' },
  { id: 'g5', name: 'Sağlıklı Tarifler', icon: '🍳', members: 15600, description: 'Ev yapımı, sağlıklı tarif paylaşımları', color: '#FF5722' },
];

export default function ExpertsScreen() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<ExpertPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);
  const [filter, setFilter] = useState<'all' | 'research' | 'news' | 'guide'>('all');
  const [selectedPost, setSelectedPost] = useState<ExpertPostType | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showGroups, setShowGroups] = useState(false);

  const isExpert = user?.role === 'expert';

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);

      // Use mock data on web
      if (Platform.OS === 'web') {
        setPosts(MOCK_EXPERT_POSTS);
      } else {
        const expertPosts = await getExpertPosts(20);
        setPosts(expertPosts);
      }
    } catch (error) {
      console.error('Error loading expert posts:', error);
      // Fallback to mock data on error
      setPosts(MOCK_EXPERT_POSTS);
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
    if (Platform.OS !== 'web') {
      await incrementPostViews(post.id);
    }

    // Show detail modal
    setSelectedPost(post);
    setShowDetailModal(true);
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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Uzman Görüşleri</Text>
          <Text style={styles.subtitle}>
            Bilim insanlarından güvenilir bilgi
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <Button
            title="👥 Gruplar"
            onPress={() => setShowGroups(true)}
            variant="outline"
            size="small"
            style={{ marginRight: 8 }}
          />
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

      {/* Groups/Communities Modal */}
      <Modal
        visible={showGroups}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGroups(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowGroups(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Topluluklar</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.groupsSubtitle}>
              İlgi alanlarınıza göre topluluklara katılın ve paylaşımlardan haberdar olun
            </Text>

            {MOCK_GROUPS.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={styles.groupCard}
                onPress={() => {
                  Alert.alert(
                    group.name,
                    `${group.description}\n\n${group.members.toLocaleString('tr-TR')} üye`,
                    [
                      { text: 'İptal', style: 'cancel' },
                      {
                        text: 'Katıl',
                        onPress: () => {
                          setShowGroups(false);
                          Alert.alert('Başarılı', `${group.name} topluluğuna katıldınız!`);
                        },
                      },
                    ]
                  );
                }}
              >
                <View style={styles.groupHeader}>
                  <View
                    style={[
                      styles.groupIcon,
                      { backgroundColor: group.color + '20' },
                    ]}
                  >
                    <Text style={styles.groupEmoji}>{group.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMembers}>
                      👥 {group.members.toLocaleString('tr-TR')} üye
                    </Text>
                  </View>
                  <View style={[styles.joinButton, { borderColor: group.color }]}>
                    <Text style={[styles.joinButtonText, { color: group.color }]}>
                      Katıl
                    </Text>
                  </View>
                </View>
                <Text style={styles.groupDescription}>{group.description}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Post detail modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowDetailModal(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Uzman Görüşü</Text>
            <View style={{ width: 40 }} />
          </View>

          {selectedPost && (
            <ScrollView style={styles.modalContent}>
              {/* Author info */}
              <View style={styles.modalAuthor}>
                <View style={styles.modalAuthorAvatar}>
                  {selectedPost.authorPhoto ? (
                    <Image
                      source={{ uri: selectedPost.authorPhoto }}
                      style={styles.modalAvatarImage}
                    />
                  ) : (
                    <Text style={styles.modalAvatarText}>
                      {selectedPost.authorName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.modalAuthorName}>
                      {selectedPost.authorName}
                    </Text>
                    <Text style={styles.verifiedBadge}>✓</Text>
                  </View>
                  <Text style={styles.modalAuthorSpec}>
                    {selectedPost.authorSpecialization}
                  </Text>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.modalPostTitle}>{selectedPost.title}</Text>

              {/* Content */}
              <Text style={styles.modalPostContent}>{selectedPost.content}</Text>

              {/* References */}
              {selectedPost.references && selectedPost.references.length > 0 && (
                <View style={styles.referencesSection}>
                  <Text style={styles.sectionTitle}>📚 Kaynaklar</Text>
                  {selectedPost.references.map((ref, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.referenceItem}
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          window.open(ref.url, '_blank');
                        }
                      }}
                    >
                      <Text style={styles.referenceText}>• {ref.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Tags */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <View style={styles.modalTags}>
                  {selectedPost.tags.map((tag, index) => (
                    <View key={index} style={styles.modalTag}>
                      <Text style={styles.modalTagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Stats */}
              <View style={styles.modalStats}>
                <View style={styles.modalStatItem}>
                  <Text style={styles.statIcon}>❤️</Text>
                  <Text style={styles.statText}>{selectedPost.likes} beğeni</Text>
                </View>
                <View style={styles.modalStatItem}>
                  <Text style={styles.statIcon}>👁️</Text>
                  <Text style={styles.statText}>{selectedPost.views} görüntülenme</Text>
                </View>
              </View>

              {/* Comments */}
              {selectedPost.comments && selectedPost.comments.length > 0 && (
                <View style={styles.commentsSection}>
                  <Text style={styles.sectionTitle}>
                    💬 Yorumlar ({selectedPost.comments.length})
                  </Text>
                  {selectedPost.comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <Text style={styles.commentUser}>{comment.userName}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.ui.border,
    backgroundColor: Colors.background.card,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: Colors.text.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalAuthor: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  modalAuthorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  modalAvatarImage: {
    width: '100%',
    height: '100%',
  },
  modalAvatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  modalAuthorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginRight: 6,
  },
  verifiedBadge: {
    fontSize: 16,
    color: Colors.primary.green,
  },
  modalAuthorSpec: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  modalPostTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 16,
    lineHeight: 32,
  },
  modalPostContent: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
    marginBottom: 24,
  },
  referencesSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  referenceItem: {
    paddingVertical: 8,
  },
  referenceText: {
    fontSize: 14,
    color: Colors.primary.green,
    textDecorationLine: 'underline',
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  modalTag: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  modalTagText: {
    fontSize: 13,
    color: Colors.primary.green,
    fontWeight: '600',
  },
  modalStats: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.ui.border,
    marginBottom: 24,
  },
  modalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  commentsSection: {
    marginBottom: 40,
  },
  commentItem: {
    backgroundColor: Colors.background.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 11,
    color: Colors.text.disabled,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupsSubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 20,
    paddingHorizontal: 4,
    lineHeight: 20,
  },
  groupCard: {
    backgroundColor: Colors.background.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.ui.border,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupEmoji: {
    fontSize: 28,
  },
  groupName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  groupDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
