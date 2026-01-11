import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Additive } from '../../types';
import { Colors } from '../../constants/colors';
import { Card } from '../common/Card';

interface IngredientListProps {
  additives: Additive[];
  ingredients: string[];
}

export const IngredientList: React.FC<IngredientListProps> = ({ additives, ingredients }) => {
  const getBadgeColor = (category: string) => {
    switch (category) {
      case 'avoid':
        return Colors.primary.red;
      case 'caution':
        return Colors.primary.yellow;
      case 'safe':
        return Colors.primary.green;
      default:
        return Colors.ui.border;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'avoid':
        return 'TEHLİKELİ';
      case 'caution':
        return 'DİKKAT';
      case 'safe':
        return 'GÜVENLİ';
      default:
        return 'BİLİNMEYEN';
    }
  };

  return (
    <View style={styles.container}>
      {/* Additives Section */}
      {additives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tespit Edilen Katkı Maddeleri ({additives.length})
          </Text>
          {additives.map((additive, index) => (
            <Card key={index} style={styles.additiveCard}>
              <View style={styles.additiveHeader}>
                <View>
                  <Text style={styles.additiveCode}>{additive.code}</Text>
                  <Text style={styles.additiveName}>{additive.name}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: getBadgeColor(additive.category) },
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {getCategoryLabel(additive.category)}
                  </Text>
                </View>
              </View>
              {additive.description && (
                <Text style={styles.description}>{additive.description}</Text>
              )}
              {additive.healthImpact && (
                <View style={styles.healthImpact}>
                  <Text style={styles.healthImpactLabel}>⚠️ Sağlık Etkisi:</Text>
                  <Text style={styles.healthImpactText}>{additive.healthImpact}</Text>
                </View>
              )}
            </Card>
          ))}
        </View>
      )}

      {/* All Ingredients Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Tüm İçindekiler ({ingredients.length})
        </Text>
        <Card style={styles.ingredientsCard}>
          <Text style={styles.ingredientsText}>
            {ingredients.join(', ')}
          </Text>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  additiveCard: {
    marginBottom: 12,
  },
  additiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  additiveCode: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary.red,
  },
  additiveName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  healthImpact: {
    backgroundColor: Colors.background.secondary,
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  healthImpactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary.red,
    marginBottom: 4,
  },
  healthImpactText: {
    fontSize: 12,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  ingredientsCard: {
    backgroundColor: Colors.background.secondary,
  },
  ingredientsText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
