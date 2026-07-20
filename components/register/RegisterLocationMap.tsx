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

type MapPosition = { lat: number; lng: number };

function isValidMapPosition(
  position?: Partial<MapPosition> | null,
): position is MapPosition {
  return (
    position != null &&
    Number.isFinite(position.lat) &&
    Number.isFinite(position.lng)
  );
}

function toLatLngTuple(position: MapPosition): [number, number] {
  return [position.lat, position.lng];
}

export interface LocationValidationResult {
  lat: number;
  lng: number;
  isInTogo: boolean;
  region?: { id: string; name: string; capital: string };
  /** Set when the API call failed (network / server), not when coords are outside Togo */
  validationError?: boolean;
}

interface RegisterLocationMapProps {
  onLocationValidated: (result: LocationValidationResult) => void;
  onValidatingChange?: (isValidating: boolean) => void;
  onGeolocatingChange?: (isGeolocating: boolean) => void;
  geolocateSignal?: number;
  initialPosition?: Partial<MapPosition> | null;
  interactive?: boolean;
  searchBarExtra?: React.ReactNode;
  className?: string;
  disableDefaultZoom?: boolean;
  onMapReady?: (map: L.Map) => void;
  /** Classes d'inset horizontal pour la barre de recherche (défaut: espace pour zoom Leaflet à gauche) */
  searchBarInsetClassName?: string;
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

function MapReadyNotifier({ onMapReady }: { onMapReady?: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady?.(map);
  }, [map, onMapReady]);
  return null;
}

export default function RegisterLocationMap({
  onLocationValidated,
  onValidatingChange,
  onGeolocatingChange,
  geolocateSignal,
  initialPosition,
  interactive = true,
  searchBarExtra,
  className,
  disableDefaultZoom = false,
  onMapReady,
  searchBarInsetClassName = 'left-[3.25rem] right-3',
}: RegisterLocationMapProps) {
  const validInitial = isValidMapPosition(initialPosition) ? initialPosition : null;
  const [position, setPosition] = useState<[number, number] | null>(
    validInitial ? toLatLngTuple(validInitial) : null,
  );
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
        onLocationValidated({ lat, lng, isInTogo: false, validationError: true });
      } finally {
        onValidatingChange?.(false);
      }
    },
    [onLocationValidated, onValidatingChange],
  );

  const selectPosition = useCallback(
    (lat: number, lng: number, flyToZoom?: number) => {
      if (!interactive) return;
      setPosition([lat, lng]);
      if (flyToZoom != null) {
        mapRef.current?.flyTo([lat, lng], flyToZoom);
      }
      void validatePosition(lat, lng);
    },
    [validatePosition, interactive],
  );

  useEffect(() => {
    if (validInitial) {
      setPosition(toLatLngTuple(validInitial));
      mapRef.current?.flyTo(toLatLngTuple(validInitial), 14);
      return;
    }
    if (initialPosition == null) {
      setPosition(null);
    }
  }, [validInitial?.lat, validInitial?.lng, initialPosition]);

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
    <div className={`relative h-full w-full ${className ?? ''}`}>
      <div
        className={`absolute top-3 z-[1000] flex items-center gap-2 pointer-events-none ${searchBarInsetClassName}`}
      >
        <div className="pointer-events-auto min-w-0 flex-1 max-w-md">
          <MapSearchBar onSelect={handleSearchSelect} />
        </div>
        {searchBarExtra ? (
          <div className="pointer-events-auto shrink-0">{searchBarExtra}</div>
        ) : null}
      </div>

      <MapContainer
        center={TOGO_CENTER}
        zoom={MAP_ZOOM}
        zoomControl={!disableDefaultZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0 h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRefBinder mapRef={mapRef} />
        <MapReadyNotifier onMapReady={onMapReady} />
        <MapClickHandler
          onSelect={(lat, lng) => {
            if (interactive) selectPosition(lat, lng);
          }}
        />
        {position && Number.isFinite(position[0]) && Number.isFinite(position[1]) && (
          <Marker
            position={position}
            draggable={interactive}
            eventHandlers={interactive ? markerEventHandlers : undefined}
          />
        )}
      </MapContainer>
    </div>
  );
}
