import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ExpertPost as ExpertPostType } from '../../types';
import { Colors } from '../../constants/colors';
import { Card } from '../common/Card';

interface ExpertPostProps {
  post: ExpertPostType;
  onPress: (post: ExpertPostType) => void;
  onLike?: (post: ExpertPostType) => void;
  showActions?: boolean;
}

export const ExpertPost: React.FC<ExpertPostProps> = ({
  post,
  onPress,
  onLike,
  showActions = true,
}) => {
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      research: 'Araştırma',
      news: 'Haber',
      guide: 'Rehber',
      warning: 'Uyarı',
      myth: 'Mit',
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      research: Colors.primary.green,
      news: '#2196F3',
      guide: '#FF9800',
      warning: Colors.primary.red,
      myth: '#9C27B0',
    };
    return colors[category] || Colors.primary.green;
  };

  const formatDate = (timestamp: any): string => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} dakika önce`;
    } else if (diffHours < 24) {
      return `${diffHours} saat önce`;
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return date.toLocaleDateString('tr-TR');
    }
  };

  return (
    <Card style={styles.container} onPress={() => onPress(post)}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.authorAvatar}>
          {post.authorPhoto ? (
            <Image source={{ uri: post.authorPhoto }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {post.authorName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>{post.authorName}</Text>
            <Text style={styles.verifiedBadge}>✓</Text>
          </View>
          <Text style={styles.authorSpecialization} numberOfLines={1}>
            {post.authorSpecialization}
          </Text>
          <Text style={styles.timestamp}>{formatDate(post.createdAt)}</Text>
        </View>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: getCategoryColor(post.category) },
          ]}
        >
          <Text style={styles.categoryText}>{getCategoryLabel(post.category)}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {post.content.substring(0, 150)}...
        </Text>
      </View>

      {/* Image */}
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tags}>
          {post.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {post.tags.length > 3 && (
            <Text style={styles.moreTag}>+{post.tags.length - 3}</Text>
          )}
        </View>
      )}

      {/* Footer */}
      {showActions && (
        <View style={styles.footer}>
          <View style={styles.stats}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => onLike?.(post)}
            >
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statText}>{post.likes}</Text>
            </TouchableOpacity>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>💬</Text>
              <Text style={styles.statText}>{post.comments?.length || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👁️</Text>
              <Text style={styles.statText}>{post.views}</Text>
            </View>
          </View>
          {post.references && post.references.length > 0 && (
            <View style={styles.sources}>
              <Text style={styles.sourcesIcon}>📚</Text>
              <Text style={styles.sourcesText}>{post.references.length} kaynak</Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginRight: 4,
  },
  verifiedBadge: {
    fontSize: 14,
    color: Colors.primary.green,
  },
  authorSpecialization: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.text.disabled,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 8,
    lineHeight: 22,
  },
  excerpt: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.background.secondary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary.green,
    fontWeight: '600',
  },
  moreTag: {
    fontSize: 11,
    color: Colors.text.secondary,
    paddingVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.divider,
  },
  stats: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  sources: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourcesIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  sourcesText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
