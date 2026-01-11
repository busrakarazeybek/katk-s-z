import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { Product, NearbyPlace } from '../../types';
import { Colors } from '../../constants/colors';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TrafficLight } from './TrafficLight';

interface AlternativeCardProps {
  currentProduct?: Product;
  alternatives: Product[];
  nearbyPlaces?: NearbyPlace[];
  onViewProduct: (product: Product) => void;
  onViewPlace: (place: NearbyPlace) => void;
}

export const AlternativeCard: React.FC<AlternativeCardProps> = ({
  currentProduct,
  alternatives,
  nearbyPlaces,
  onViewProduct,
  onViewPlace,
}) => {
  if (alternatives.length === 0 && (!nearbyPlaces || nearbyPlaces.length === 0)) {
    return null;
  }

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌿 Katkısız Alternatifler</Text>
        <Text style={styles.subtitle}>
          Size daha sağlıklı seçenekler önerdik
        </Text>
      </View>

      {/* Alternative products */}
      {alternatives.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benzer Ürünler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {alternatives.map((product, index) => (
              <Card
                key={index}
                style={styles.productCard}
                onPress={() => onViewProduct(product)}
              >
                {product.imageUrl && (
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.productImage}
                  />
                )}
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  {product.brand && (
                    <Text style={styles.productBrand} numberOfLines={1}>
                      {product.brand}
                    </Text>
                  )}
                  <TrafficLight
                    status={product.status}
                    size="small"
                    showLabel={false}
                    animated={false}
                  />
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Nearby places */}
      {nearbyPlaces && nearbyPlaces.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yakındaki Yerler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {nearbyPlaces.slice(0, 5).map((place, index) => (
              <Card
                key={index}
                style={styles.placeCard}
                onPress={() => onViewPlace(place)}
              >
                <View style={styles.placeHeader}>
                  <View
                    style={[
                      styles.placeIndicator,
                      {
                        backgroundColor:
                          place.status === 'green'
                            ? Colors.primary.green
                            : place.status === 'yellow'
                            ? Colors.primary.yellow
                            : Colors.primary.red,
                      },
                    ]}
                  >
                    <Text style={styles.placePercentage}>
                      {place.rating.green}%
                    </Text>
                  </View>
                  <Text style={styles.placeName} numberOfLines={2}>
                    {place.name}
                  </Text>
                </View>
                <View style={styles.placeFooter}>
                  <Text style={styles.placeType}>{getPlaceTypeLabel(place.type)}</Text>
                  <Text style={styles.placeDistance}>
                    {formatDistance(place.distance)}
                  </Text>
                </View>
              </Card>
            ))}
          </ScrollView>
        </View>
      )}

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={styles.ctaText}>
          💡 Sağlıklı alternatifleri tercih ederek daha iyi beslenin!
        </Text>
        <Button
          title="Haritada Göster"
          onPress={() => {
            // Navigate to map tab
          }}
          variant="outline"
          size="small"
          style={{ marginTop: 12 }}
        />
      </View>
    </Card>
  );
};

const getPlaceTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    market: 'Market',
    bakkal: 'Bakkal',
    manav: 'Manav',
    restoran: 'Restoran',
    sarkuteri: 'Şarküteri',
    organik: 'Organik',
  };
  return labels[type] || type;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  productCard: {
    width: 160,
    marginRight: 12,
    padding: 12,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.background.secondary,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  placeCard: {
    width: 140,
    marginRight: 12,
    padding: 12,
  },
  placeHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  placeIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  placePercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  placeName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.primary,
    textAlign: 'center',
    minHeight: 32,
  },
  placeFooter: {
    alignItems: 'center',
  },
  placeType: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  placeDistance: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary.green,
  },
  cta: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 13,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
