"use client";

import { useEffect, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { CheckIn } from "@/features/check-in/types";
import type { PlannerLocation } from "@/features/journey-planner/locationSearch";

// Fix for default Leaflet icons in Webpack/Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const originPinIcon = L.divIcon({
  className: "journey-point-icon-wrapper",
  html: '<div class="journey-point-icon journey-point-icon--origin">A</div>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -34],
});

const destinationPinIcon = L.divIcon({
  className: "journey-point-icon-wrapper",
  html: '<div class="journey-point-icon journey-point-icon--dest">B</div>',
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -34],
});

// Use Cancún as center
const CANCUN_CENTER: [number, number] = [21.1619, -86.8515];

// Check-in status colors
const STATUS_COLORS: Record<string, string> = {
  Fluido: "#22c55e",
  Tráfico: "#f59e0b",
  Lleno: "#ef4444",
};

export type RouteStop = {
  sequence: number;
  stop_id: string;
  stop_name: string;
  lat: number;
  lng: number;
};

export type RouteDetailDirection = {
  id: string;
  direction_name: string;
  direction_index: number;
  total_stops: number;
  approx_duration: number;
  start_time: string;
  end_time: string;
  operates_on: string;
  path_coordinates: [number, number][];
  stops: RouteStop[];
};

export type RouteDetail = {
  id: string;
  route_name: string;
  route_long_name: string;
  route_type: string;
  color: string | null;
  path_coordinates: [number, number][];
  directions: RouteDetailDirection[];
};

type Props = {
  routeDetail?: RouteDetail | null;
  checkIns?: CheckIn[];
  originLocation?: PlannerLocation | null;
  destinationLocation?: PlannerLocation | null;
  mapPickTarget?: "origin" | "dest" | null;
  onMapPick?: (coords: { lat: number; lng: number }) => void;
};

// Helper component to fit map bounds when route changes
function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(
        coordinates.map(([lat, lng]) => [lat, lng]),
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    }
  }, [coordinates, map]);

  return null;
}

function FocusLocation({
  location,
  enabled,
}: {
  location: PlannerLocation | null;
  enabled: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !location) {
      return;
    }

    map.setView([location.lat, location.lng], 15);
  }, [enabled, location, map]);

  return null;
}

function ClickHandler({
  active,
  onPick,
}: {
  active: boolean;
  onPick?: (coords: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      if (!active) {
        return;
      }

      onPick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  return null;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins === 1) return "hace 1 min";
  return `hace ${mins} min`;
}

export default function MapCanvas({
  routeDetail,
  checkIns = [],
  originLocation = null,
  destinationLocation = null,
  mapPickTarget = null,
  onMapPick,
}: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted)
    return (
      <div className="h-full w-full bg-slate-100 flex items-center justify-center text-sm text-slate-500">
        Loading Map...
      </div>
    );

  const routeColor = routeDetail?.color
    ? `#${routeDetail.color.replace("#", "")}`
    : "#3b82f6";

  // Get stops from the first direction (outbound) to display on the map
  const stops = routeDetail?.directions?.[0]?.stops ?? [];
  const hasRoutePath = Boolean(routeDetail?.path_coordinates.length);
  const focusLocation = originLocation ?? destinationLocation;
  const journeyLine =
    originLocation && destinationLocation
      ? ([
          [originLocation.lat, originLocation.lng],
          [destinationLocation.lat, destinationLocation.lng],
        ] as [number, number][])
      : [];

  return (
    <div className="h-full w-full absolute inset-0 z-0">
      <MapContainer
        center={CANCUN_CENTER}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler active={Boolean(mapPickTarget)} onPick={onMapPick} />

        <FocusLocation
          location={focusLocation}
          enabled={Boolean(focusLocation) && journeyLine.length < 2}
        />

        {!hasRoutePath && journeyLine.length > 1 ? (
          <FitBounds coordinates={journeyLine} />
        ) : null}

        {/* Location marker */}
        {!originLocation && !destinationLocation ? (
          <Marker position={CANCUN_CENTER} icon={icon}>
            <Popup>Centro de Cancún.</Popup>
          </Marker>
        ) : null}

        {originLocation ? (
          <Marker
            position={[originLocation.lat, originLocation.lng]}
            icon={originPinIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Punto A</p>
                <p className="text-slate-500 text-xs">{originLocation.label}</p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {destinationLocation ? (
          <Marker
            position={[destinationLocation.lat, destinationLocation.lng]}
            icon={destinationPinIcon}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">Punto B</p>
                <p className="text-slate-500 text-xs">
                  {destinationLocation.label}
                </p>
              </div>
            </Popup>
          </Marker>
        ) : null}

        {!hasRoutePath && journeyLine.length > 1 ? (
          <Polyline
            positions={journeyLine}
            pathOptions={{
              color: "#0f172a",
              weight: 3,
              opacity: 0.5,
              dashArray: "8 10",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ) : null}

        {/* Route polyline */}
        {routeDetail && routeDetail.path_coordinates.length > 0 && (
          <>
            <FitBounds coordinates={routeDetail.path_coordinates} />
            {/* Shadow / outline for the route line */}
            <Polyline
              positions={routeDetail.path_coordinates}
              pathOptions={{
                color: "#000",
                weight: 7,
                opacity: 0.15,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* Main route line */}
            <Polyline
              positions={routeDetail.path_coordinates}
              pathOptions={{
                color: routeColor,
                weight: 5,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {/* Stop markers */}
        {routeDetail &&
          stops.map((stop, idx) => {
            const isTerminal = idx === 0 || idx === stops.length - 1;
            return (
              <CircleMarker
                key={stop.stop_id}
                center={[stop.lat, stop.lng]}
                radius={isTerminal ? 7 : 5}
                pathOptions={{
                  color: routeColor,
                  fillColor: isTerminal ? routeColor : "#ffffff",
                  fillOpacity: 1,
                  weight: isTerminal ? 3 : 2,
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -8]}
                  className="route-stop-tooltip"
                >
                  <span className="font-medium text-xs">
                    {stop.sequence}. {stop.stop_name}
                  </span>
                </Tooltip>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{stop.stop_name}</p>
                    <p className="text-slate-500 text-xs">
                      Parada {stop.sequence}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Live check-in markers */}
        {checkIns.map((ci) => {
          const color = STATUS_COLORS[ci.status] || "#6b7280";
          const radius = ci.is_on_board ? 8 : 6;
          return (
            <CircleMarker
              key={ci.id}
              center={[ci.lat, ci.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: ci.is_on_board ? color : "transparent",
                fillOpacity: ci.is_on_board ? 0.7 : 0,
                weight: 3,
                dashArray: ci.is_on_board ? undefined : "4 4",
              }}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <span className="text-xs font-medium">
                  {ci.status} — {ci.is_on_board ? "En camión" : "Esperando"}
                </span>
              </Tooltip>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{ci.status}</p>
                  <p className="text-slate-500 text-xs">
                    {ci.is_on_board ? "En el camión" : "Esperando"} ·{" "}
                    {formatTimeAgo(ci.created_at)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {mapPickTarget && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-[1000] -translate-x-1/2 rounded-full border border-slate-200/70 bg-white/95 px-4 py-2 text-sm font-medium text-slate-800 shadow-xl backdrop-blur">
          Toca el mapa para fijar{" "}
          {mapPickTarget === "origin" ? "Punto A" : "Punto B"}
        </div>
      )}
    </div>
  );
}
