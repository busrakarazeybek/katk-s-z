import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Place } from '../../types';
import { Colors } from '../../constants/colors';
import { Button } from '../common/Button';

interface PlaceCardProps {
  place: Place;
  onClose: () => void;
  onGetDirections: (place: Place) => void;
  onAddComment: (place: Place) => void;
  onViewDetails: (place: Place) => void;
}

export const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  onClose,
  onGetDirections,
  onAddComment,
  onViewDetails,
}) => {
  const getStatusColor = () => {
    switch (place.status) {
      case 'green':
        return Colors.primary.green;
      case 'yellow':
        return Colors.primary.yellow;
      case 'red':
        return Colors.primary.red;
      default:
        return Colors.ui.border;
    }
  };

  const getStatusLabel = () => {
    switch (place.status) {
      case 'green':
        return 'Katkısız Ürünler';
      case 'yellow':
        return 'Karışık Ürünler';
      case 'red':
        return 'Katkılı Ürünler';
      default:
        return 'Bilinmiyor';
    }
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      market: 'Market',
      bakkal: 'Bakkal',
      manav: 'Manav',
      restoran: 'Restoran',
      sarkuteri: 'Şarküteri',
      organik: 'Organik Dükkan',
    };
    return labels[place.type] || place.type;
  };

  return (
    <View style={styles.container}>
      {/* Close button */}
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{place.name}</Text>
          <Text style={styles.type}>{getTypeLabel()}</Text>
          {place.location.address && (
            <Text style={styles.address} numberOfLines={1}>
              📍 {place.location.address}
            </Text>
          )}
        </View>

        {/* Status badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() },
          ]}
        >
          <Text style={styles.statusPercentage}>{place.rating.green}%</Text>
          <Text style={styles.statusLabel}>Katkısız</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.primary.green }]} />
          <Text style={styles.statText}>{place.rating.green}%</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.primary.yellow }]} />
          <Text style={styles.statText}>{place.rating.yellow}%</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.primary.red }]} />
          <Text style={styles.statText}>{place.rating.red}%</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>✓ {place.verificationCount}</Text>
        </View>
      </View>

      {/* Description */}
      {place.description && (
        <Text style={styles.description} numberOfLines={2}>
          {place.description}
        </Text>
      )}

      {/* Recent comments preview */}
      {place.comments && place.comments.length > 0 && (
        <View style={styles.commentsPreview}>
          <Text style={styles.commentsTitle}>
            💬 Son Yorumlar ({place.comments.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {place.comments.slice(0, 3).map((comment, index) => (
              <View key={index} style={styles.commentBubble}>
                <Text style={styles.commentUser}>{comment.userName}</Text>
                <Text style={styles.commentText} numberOfLines={2}>
                  {comment.text}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Yol Tarifi"
          onPress={() => onGetDirections(place)}
          variant="primary"
          size="small"
          style={{ flex: 1, marginRight: 8 }}
        />
        <Button
          title="Detaylar"
          onPress={() => onViewDetails(place)}
          variant="outline"
          size="small"
          style={{ flex: 1, marginLeft: 8 }}
        />
      </View>

      <Button
        title="Yorum Ekle"
        onPress={() => onAddComment(place)}
        variant="secondary"
        size="small"
        style={{ marginTop: 8 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeText: {
    color: Colors.text.secondary,
    fontSize: 18,
    fontWeight: '300',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  statusBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.ui.divider,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  commentsPreview: {
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  commentBubble: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    marginRight: 8,
    width: 160,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
  },
});
