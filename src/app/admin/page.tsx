"use client";

import { Shield } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import StopManagerPanel from "@/features/stop-manager/StopManagerPanel";
import type { ManagedStop } from "@/features/stop-manager/types";
import type { RouteDetail } from "@/features/transit-map/MapCanvas";
import { fetchApi } from "@/shared/api/apiClient";
import { notify } from "@/shared/ui/notify";

const StopMapPicker = dynamic(
  () => import("@/features/stop-manager/StopMapPicker"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500">
        Cargando Mapa...
      </div>
    ),
  },
);

type RouteInfo = {
  id: string;
  route_name: string;
  color: string | null;
};

type RouteDetailResponse = {
  success: boolean;
  data: RouteDetail;
};

export default function AdminPage() {
  const [stops, setStops] = useState<ManagedStop[]>([]);
  const [pickMode, setPickMode] = useState(false);
  const [pickedPosition, setPickedPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [routeDetail, setRouteDetail] = useState<RouteDetail | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteInfo | null>(null);
  const [selectedDirectionId, setSelectedDirectionId] = useState<string | null>(
    null,
  );
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshRouteDetail = useCallback(async (routeId: string) => {
    const res = await fetchApi<RouteDetailResponse>(`/api/routes/${routeId}`);
    if (res.success) {
      setRouteDetail(res.data);
    }
  }, []);

  useEffect(
    () => () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    },
    [],
  );

  const scheduleRouteDetailRefresh = useCallback(
    (routeId: string) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        void refreshRouteDetail(routeId).catch(() => {
          notify.warning({
            title: "Mapa desactualizado",
            description:
              "Los cambios se guardaron, pero no se pudo refrescar la geometría de la ruta.",
          });
        });
      }, 400);
    },
    [refreshRouteDetail],
  );

  const handlePick = useCallback(
    (lat: number, lng: number) => {
      if (pickMode) {
        setPickedPosition({ lat, lng });
      }
    },
    [pickMode],
  );

  const handleRouteChange = useCallback(
    async (route: RouteInfo | null) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      setCurrentRoute(route);
      setRouteDetail(null);
      setSelectedDirectionId(null);
      setStops([]);
      if (route) {
        try {
          await refreshRouteDetail(route.id);
        } catch {
          notify.error({
            title: "Ruta no disponible",
            description:
              "No se pudo cargar la geometría de la ruta seleccionada.",
          });
        }
      }
    },
    [refreshRouteDetail],
  );

  const handleStopsChange = useCallback(
    (
      newStops: ManagedStop[],
      options?: {
        syncRoute?: boolean;
      },
    ) => {
      setStops(newStops);

      if (!currentRoute || !options?.syncRoute) {
        return;
      }

      scheduleRouteDetailRefresh(currentRoute.id);
    },
    [currentRoute, scheduleRouteDetailRefresh],
  );

  const handlePickModeChange = useCallback((active: boolean) => {
    setPickMode(active);
    if (!active) setPickedPosition(null);
  }, []);

  const selectedDirection =
    routeDetail?.directions.find(
      (direction) => direction.id === selectedDirectionId,
    ) ?? null;
  const mapFitBoundsKey =
    currentRoute && selectedDirectionId
      ? `${currentRoute.id}:${selectedDirectionId}`
      : (currentRoute?.id ?? null);
  const selectedDirectionPath =
    selectedDirectionId && stops.length > 1
      ? stops.map((stop) => [stop.lat, stop.lng] as [number, number])
      : (selectedDirection?.path_coordinates ?? routeDetail?.path_coordinates);

  return (
    <main className="h-screen w-screen flex flex-col bg-slate-100">
      {/* Top bar */}
      <header className="shrink-0 bg-slate-900 text-white px-4 py-3 flex items-center gap-3 z-10">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base leading-tight">
            RutaCancun Admin
          </h1>
          <p className="text-slate-400 text-xs">Gestión de paradas de ruta</p>
        </div>
      </header>

      {/* Split layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <div className="w-[420px] shrink-0">
          <StopManagerPanel
            pickMode={pickMode}
            pickedPosition={pickedPosition}
            onPickModeChange={handlePickModeChange}
            onRouteChange={handleRouteChange}
            onStopsChange={handleStopsChange}
            onDirectionChange={setSelectedDirectionId}
          />
        </div>

        {/* Right panel — map */}
        <div className="flex-1 relative">
          <StopMapPicker
            stops={stops}
            pickMode={pickMode}
            pickedPosition={pickedPosition}
            onPick={handlePick}
            routeCoordinates={selectedDirectionPath}
            routeColor={currentRoute?.color ?? undefined}
            fitBoundsKey={mapFitBoundsKey}
          />
        </div>
      </div>
    </main>
  );
}
