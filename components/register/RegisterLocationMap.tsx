'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '@/lib/api-client';
import type { ValidateLocationResponse } from '@/lib/types';
import MapSearchBar from './MapSearchBar';

const TOGO_CENTER: [number, number] = [6.1375, 1.2123];
const MAP_ZOOM = 7;

export interface LocationValidationResult {
  lat: number;
  lng: number;
  isInTogo: boolean;
  region?: { id: string; name: string; capital: string };
}

interface RegisterLocationMapProps {
  onLocationValidated: (result: LocationValidationResult) => void;
  onValidatingChange?: (isValidating: boolean) => void;
  onGeolocatingChange?: (isGeolocating: boolean) => void;
  geolocateSignal?: number;
}

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onSelect(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function MapRefBinder({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
}

export default function RegisterLocationMap({
  onLocationValidated,
  onValidatingChange,
  onGeolocatingChange,
  geolocateSignal,
}: RegisterLocationMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }, []);

  const validatePosition = useCallback(
    async (lat: number, lng: number) => {
      onValidatingChange?.(true);
      try {
        const { data } = await api.post<ValidateLocationResponse>(
          '/api/store/shipping/validate-location',
          { lat, lng },
          { skipUnauthorizedRedirect: true },
        );
        onLocationValidated({ lat, lng, isInTogo: data.isInTogo, region: data.region });
      } catch {
        onLocationValidated({ lat, lng, isInTogo: false });
      } finally {
        onValidatingChange?.(false);
      }
    },
    [onLocationValidated, onValidatingChange],
  );

  const selectPosition = useCallback(
    (lat: number, lng: number, flyToZoom?: number) => {
      setPosition([lat, lng]);
      if (flyToZoom != null) {
        mapRef.current?.flyTo([lat, lng], flyToZoom);
      }
      void validatePosition(lat, lng);
    },
    [validatePosition],
  );

  const handleSearchSelect = useCallback(
    (lat: number, lon: number) => {
      selectPosition(lat, lon, 14);
    },
    [selectPosition],
  );

  const handleGeolocate = useCallback(() => {
    if (!navigator.geolocation) return;
    onGeolocatingChange?.(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        selectPosition(latitude, longitude, 15);
        onGeolocatingChange?.(false);
      },
      () => {
        onGeolocatingChange?.(false);
      },
    );
  }, [selectPosition, onGeolocatingChange]);

  const lastSignal = useRef(geolocateSignal);
  useEffect(() => {
    if (geolocateSignal === undefined) return;
    if (geolocateSignal !== lastSignal.current) {
      lastSignal.current = geolocateSignal;
      handleGeolocate();
    }
  }, [geolocateSignal, handleGeolocate]);

  const markerEventHandlers = {
    dragend: (e: L.DragEndEvent) => {
      const marker = e.target as L.Marker;
      const { lat, lng } = marker.getLatLng();
      selectPosition(lat, lng);
    },
  };

  return (
    <div className="relative h-full w-full">
      {/* Barre de recherche — décalée après les contrôles zoom Leaflet */}
      <div className="absolute top-3 left-[3.25rem] right-3 z-[1000] max-w-md pointer-events-auto">
        <MapSearchBar onSelect={handleSearchSelect} />
      </div>

      <MapContainer
        center={TOGO_CENTER}
        zoom={MAP_ZOOM}
        style={{ height: '100%', width: '100%' }}
        className="z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRefBinder mapRef={mapRef} />
        <MapClickHandler onSelect={(lat, lng) => selectPosition(lat, lng)} />
        {position && (
          <Marker position={position} draggable eventHandlers={markerEventHandlers} />
        )}
      </MapContainer>
    </div>
  );
}
