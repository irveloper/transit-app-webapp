"use client";

import { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { ManagedStop } from "./types";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const CANCUN_CENTER: [number, number] = [21.1619, -86.8515];

type Props = {
  stops: ManagedStop[];
  pickMode: boolean;
  pickedPosition: { lat: number; lng: number } | null;
  onPick: (lat: number, lng: number) => void;
  routeCoordinates?: [number, number][];
  routeColor?: string;
  fitBoundsKey?: string | null;
};

function FitBounds({
  coordinates,
  fitBoundsKey,
}: {
  coordinates: [number, number][];
  fitBoundsKey: string | null;
}) {
  const map = useMap();
  const lastFitBoundsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fitBoundsKey) {
      lastFitBoundsKeyRef.current = null;
      return;
    }

    if (
      coordinates.length > 0 &&
      lastFitBoundsKeyRef.current !== fitBoundsKey
    ) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      lastFitBoundsKeyRef.current = fitBoundsKey;
    }
  }, [coordinates, fitBoundsKey, map]);

  return null;
}

function ClickHandler({
  onPick,
  active,
}: {
  onPick: (lat: number, lng: number) => void;
  active: boolean;
}) {
  useMapEvents({
    click(e) {
      if (active) {
        onPick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function StopMapPicker({
  stops,
  pickMode,
  pickedPosition,
  onPick,
  routeCoordinates,
  routeColor,
  fitBoundsKey = null,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-sm text-slate-500">
        Cargando Mapa...
      </div>
    );
  }

  const color = routeColor ? `#${routeColor.replace("#", "")}` : "#3b82f6";
  const stopPolyline =
    stops.length > 1
      ? stops.map((stop) => [stop.lat, stop.lng] as [number, number])
      : [];
  const displayCoordinates =
    routeCoordinates && routeCoordinates.length > 1
      ? routeCoordinates
      : stopPolyline;

  // Build bounds from stops if no route coordinates
  const boundsCoords: [number, number][] =
    displayCoordinates.length > 0 ? displayCoordinates : [];

  return (
    <div className={`h-full w-full ${pickMode ? "cursor-crosshair" : ""}`}>
      <MapContainer
        center={CANCUN_CENTER}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onPick={onPick} active={pickMode} />

        {boundsCoords.length > 0 && (
          <FitBounds coordinates={boundsCoords} fitBoundsKey={fitBoundsKey} />
        )}

        {/* Route polyline */}
        {displayCoordinates.length > 1 && (
          <>
            <Polyline
              positions={displayCoordinates}
              pathOptions={{
                color: "#000",
                weight: 7,
                opacity: 0.15,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            <Polyline
              positions={displayCoordinates}
              pathOptions={{
                color,
                weight: 5,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {/* Stop markers (numbered) */}
        {stops.map((stop, idx) => {
          const isTerminal = idx === 0 || idx === stops.length - 1;
          return (
            <CircleMarker
              key={stop.stop_id}
              center={[stop.lat, stop.lng]}
              radius={isTerminal ? 8 : 6}
              pathOptions={{
                color,
                fillColor: isTerminal ? color : "#ffffff",
                fillOpacity: 1,
                weight: isTerminal ? 3 : 2,
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span className="font-medium text-xs">
                  {stop.stop_sequence}. {stop.stop_name}
                </span>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Picked position marker */}
        {pickedPosition && (
          <Marker
            position={[pickedPosition.lat, pickedPosition.lng]}
            icon={icon}
          />
        )}
      </MapContainer>

      {/* Pick mode overlay indicator */}
      {pickMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-full shadow-lg">
          Haz clic en el mapa para seleccionar ubicación
        </div>
      )}
    </div>
  );
}
