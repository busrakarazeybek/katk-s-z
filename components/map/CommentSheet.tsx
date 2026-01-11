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
import { Place, PlaceComment } from '../../types';
import { Colors } from '../../constants/colors';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useAuth } from '../../contexts/AuthContext';

interface CommentSheetProps {
  visible: boolean;
  place: Place | null;
  onClose: () => void;
  onSubmitComment: (placeId: string, text: string, rating?: number) => Promise<void>;
}

export const CommentSheet: React.FC<CommentSheetProps> = ({
  visible,
  place,
  onClose,
  onSubmitComment,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!place) return;

    if (!isAuthenticated) {
      Alert.alert('Giriş Gerekli', 'Yorum yapmak için giriş yapmalısınız.');
      return;
    }

    if (commentText.trim().length === 0) {
      Alert.alert('Hata', 'Lütfen yorum yazın.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitComment(place.id, commentText.trim(), rating);
      setCommentText('');
      setRating(undefined);
      onClose();
      Alert.alert('Başarılı', 'Yorumunuz eklendi!');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Yorum eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.star}
          >
            <Text style={styles.starText}>
              {rating && star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderComment = (comment: PlaceComment, index: number) => {
    return (
      <Card key={index} style={styles.commentCard}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAvatar}>
            <Text style={styles.commentAvatarText}>
              {comment.userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.commentUserName}>{comment.userName}</Text>
            {comment.rating && (
              <View style={styles.commentRating}>
                {Array.from({ length: comment.rating }).map((_, i) => (
                  <Text key={i} style={styles.commentStar}>⭐</Text>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.commentDate}>
            {new Date(comment.createdAt as any).toLocaleDateString('tr-TR')}
          </Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
        {comment.upvotes > 0 && (
          <Text style={styles.commentVotes}>👍 {comment.upvotes}</Text>
        )}
      </Card>
    );
  };

  if (!place) return null;

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
            <View>
              <Text style={styles.title}>Yorumlar</Text>
              <Text style={styles.subtitle}>{place.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Comments list */}
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsContent}
          >
            {place.comments && place.comments.length > 0 ? (
              place.comments.map((comment, index) => renderComment(comment, index))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyText}>
                  Henüz yorum yok. İlk yorumu siz yapın!
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Add comment form */}
          {isAuthenticated ? (
            <View style={styles.addCommentSection}>
              <Text style={styles.formLabel}>Yorumunuz</Text>
              <TextInput
                style={styles.input}
                placeholder="Bu mekan hakkında düşüncelerinizi paylaşın..."
                placeholderTextColor={Colors.text.disabled}
                multiline
                numberOfLines={4}
                value={commentText}
                onChangeText={setCommentText}
                maxLength={500}
              />
              <View style={styles.characterCount}>
                <Text style={styles.characterCountText}>
                  {commentText.length}/500
                </Text>
              </View>

              <Text style={styles.formLabel}>Değerlendirme (Opsiyonel)</Text>
              {renderStars()}

              <Button
                title="Yorum Ekle"
                onPress={handleSubmit}
                loading={submitting}
                disabled={commentText.trim().length === 0}
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            <View style={styles.loginPrompt}>
              <Text style={styles.loginPromptText}>
                Yorum yapmak için giriş yapmalısınız
              </Text>
              <Button
                title="Giriş Yap"
                onPress={() => {
                  onClose();
                  // Navigate to login
                }}
                variant="outline"
                size="small"
                style={{ marginTop: 12 }}
              />
            </View>
          )}
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
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
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
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    padding: 20,
  },
  commentCard: {
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  commentRating: {
    flexDirection: 'row',
    marginTop: 2,
  },
  commentStar: {
    fontSize: 12,
    marginRight: 2,
  },
  commentDate: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  commentVotes: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  addCommentSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    backgroundColor: Colors.background.card,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 4,
    marginBottom: 16,
  },
  characterCountText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  star: {
    marginRight: 8,
  },
  starText: {
    fontSize: 28,
  },
  loginPrompt: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.ui.border,
    backgroundColor: Colors.background.card,
    alignItems: 'center',
  },
  loginPromptText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
