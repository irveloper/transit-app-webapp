"use client";

import { BusFront } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { getRecentCheckIns } from "@/features/check-in/api";
import CheckInPanel from "@/features/check-in/CheckInPanel";
import type { CheckIn } from "@/features/check-in/types";
import PredictDelay from "@/features/intelligence/PredictDelay";
import DestinationSearch from "@/features/journey-planner/DestinationSearch";
import type { TransitRoute } from "@/features/route-explorer/RouteSelector";
import RouteSelector from "@/features/route-explorer/RouteSelector";
import type { RouteDetail } from "@/features/transit-map/MapCanvas";
import { fetchApi } from "@/shared/api/apiClient";
import { notify } from "@/shared/ui/notify";

// Dynamically import the map to avoid SSR issues with Leaflet
const MapCanvas = dynamic(() => import("@/features/transit-map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500">
      Cargando Mapa...
    </div>
  ),
});

type RouteDetailResponse = {
  success: boolean;
  data: RouteDetail;
};

type UserLocation = {
  lat: number;
  lng: number;
  label: string;
};

export default function Home() {
  const [routeDetail, setRouteDetail] = useState<RouteDetail | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const fetchAndShowRoute = async (routeId: string) => {
    try {
      const result = await fetchApi<RouteDetailResponse>(
        `/api/routes/${routeId}`,
      );
      if (result.success) {
        setRouteDetail(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch route detail:", err);
      notify.error({
        title: "Ruta no disponible",
        description: "No se pudo cargar el trazado de la ruta seleccionada.",
      });
    }
  };

  const handleRouteSelect = (route: TransitRoute) => {
    setSelectedRoute({ id: route.id, name: route.route_name });
    fetchAndShowRoute(route.id);
  };

  // Fetch recent check-ins when a route is selected, poll every 60s
  const fetchCheckIns = useCallback(async () => {
    if (!selectedRoute) return;
    try {
      const result = await getRecentCheckIns(selectedRoute.id);
      if (result.success) {
        setRecentCheckIns(result.data);
      }
    } catch {
      // Silently fail — non-critical for UX
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (!selectedRoute) {
      setRecentCheckIns([]);
      return;
    }
    fetchCheckIns();
    const interval = setInterval(fetchCheckIns, 60000);
    return () => clearInterval(interval);
  }, [selectedRoute, fetchCheckIns]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-100">
      {/* Background Map Layer */}
      <MapCanvas
        routeDetail={routeDetail}
        checkIns={recentCheckIns}
        userLocation={userLocation}
      />

      {/* Top Floating App Bar */}
      <header className="absolute top-0 left-0 right-0 z-[1000] p-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-blue-600 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <BusFront className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">RutaCancun</h1>
              <p className="text-blue-100 text-xs font-medium">
                Mapas y Transporte en Vivo
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Floating UI Elements over Map */}
      <div className="absolute inset-x-0 bottom-0 z-[1000] p-4 pointer-events-none flex flex-col gap-4">
        <div className="max-w-md mx-auto w-full pointer-events-auto flex flex-col gap-4">
          <RouteSelector onRouteSelect={handleRouteSelect} />
          {selectedRoute && (
            <CheckInPanel
              routeId={selectedRoute.id}
              routeName={selectedRoute.name}
            />
          )}
          <PredictDelay
            routeId={selectedRoute?.id ?? null}
            routeName={selectedRoute?.name ?? null}
            userLocation={userLocation}
          />
          <DestinationSearch
            onRouteSelect={fetchAndShowRoute}
            onOriginChange={setUserLocation}
          />
        </div>
      </div>
    </main>
  );
}
