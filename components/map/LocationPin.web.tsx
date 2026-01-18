import React, { useContext, useEffect, useRef } from 'react';
import { GoogleMapContext } from './CustomMapView.web';
import { Place } from '../../types';
import { Colors } from '../../constants/colors';

interface LocationPinProps {
  place: Place;
  onPress?: (place: Place) => void;
  size?: 'small' | 'medium' | 'large';
}

export const LocationPin: React.FC<LocationPinProps> = ({
  place,
  onPress,
  size = 'medium',
}) => {
  const getColor = () => {
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

  const getSize = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 70;
      default:
        return 55;
    }
  };

  const getIcon = () => {
    // Check name for specific types
    const name = place.name.toLowerCase();

    if (name.includes('fırın') || name.includes('ekmek')) {
      return '🥐'; // Kruvasan (fırın)
    }
    if (name.includes('çiftlik') || name.includes('köy')) {
      return '🚜'; // Traktör (çiftlik)
    }

    switch (place.type) {
      case 'market':
        return '🛒'; // Market sepeti
      case 'bakkal':
        return '🏪'; // Mağaza
      case 'manav':
        return '🥕'; // Havuç (manav)
      case 'restoran':
        return '🍴'; // Çatal bıçak
      case 'sarkuteri':
        return '🥖'; // Ekmek
      case 'organik':
        return '🌱'; // Fide (organik)
      default:
        return '📍';
    }
  };

  const pinSize = getSize();
  const color = getColor();
  const { map, google } = useContext(GoogleMapContext);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    if (!map || !google) return;

    // Create custom pin SVG marker
    const pinColor = color;
    const markerDiv = document.createElement('div');
    markerDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; position: relative;">
        <svg width="${pinSize}" height="${pinSize * 1.4}" viewBox="0 0 24 34" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
          <path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 22 12 22s12-13 12-22C24 5.373 18.627 0 12 0z" fill="${pinColor}"/>
          <circle cx="12" cy="12" r="8" fill="white"/>
          <text x="12" y="16" text-anchor="middle" font-size="14" font-weight="bold" fill="${pinColor}">${getIcon()}</text>
        </svg>
        ${
          place.rating.green > 0
            ? `<div style="
                position: absolute;
                top: -8px;
                right: -12px;
                background-color: white;
                border-radius: 12px;
                padding: 3px 8px;
                border: 2px solid ${color};
                font-size: 11px;
                font-weight: 700;
                color: ${color};
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              ">${place.rating.green}%</div>`
            : ''
        }
      </div>
    `;

    const marker = new google.maps.Marker({
      position: {
        lat: place.location.latitude,
        lng: place.location.longitude,
      },
      map: map,
      // @ts-ignore - OverlayView for custom HTML
      content: markerDiv,
    });

    marker.addListener('click', () => {
      onPress?.(place);
    });

    markerRef.current = marker;

    return () => {
      marker.setMap(null);
    };
  }, [map, google, place]);

  return null;
};
