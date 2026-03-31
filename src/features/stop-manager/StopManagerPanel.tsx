"use client";

import { CheckCircle2, Loader2, Plus, Route, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/shared/api/apiClient";
import { notify } from "@/shared/ui/notify";
import {
  updateStop as apiUpdateStop,
  createStop,
  getStopsByDirection,
  removeStop,
  reorderStops,
} from "./api";
import StopForm from "./StopForm";
import StopList from "./StopList";
import type { ManagedStop, StopFormData } from "./types";

type RouteDirection = {
  id: string;
  direction_name: string;
  direction_index: number;
  total_stops: number;
};

type TransitRoute = {
  id: string;
  route_name: string;
  route_long_name: string;
  color: string | null;
  directions: RouteDirection[];
};

type RoutesResponse = {
  success: boolean;
  data: TransitRoute[];
};

type FormMode = "create" | "edit" | null;
type StopsChangeOptions = { syncRoute?: boolean };

type Props = {
  pickMode: boolean;
  pickedPosition: { lat: number; lng: number } | null;
  onPickModeChange: (active: boolean) => void;
  onRouteChange: (route: TransitRoute | null) => void;
  onStopsChange: (stops: ManagedStop[], options?: StopsChangeOptions) => void;
  onDirectionChange: (directionId: string | null) => void;
};

function normalizeStopSequence(stops: ManagedStop[]) {
  return stops.map((stop, index) => ({
    ...stop,
    stop_sequence: index + 1,
  }));
}

function reorderStopList(stops: ManagedStop[], from: number, to: number) {
  if (from === to) {
    return stops;
  }

  const nextStops = [...stops];
  const [movedStop] = nextStops.splice(from, 1);

  if (!movedStop) {
    return stops;
  }

  nextStops.splice(to, 0, movedStop);
  return normalizeStopSequence(nextStops);
}

export default function StopManagerPanel({
  pickMode,
  pickedPosition,
  onPickModeChange,
  onRouteChange,
  onStopsChange,
  onDirectionChange,
}: Props) {
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute | null>(null);
  const [selectedDirId, setSelectedDirId] = useState<string | null>(null);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  const [stops, setStops] = useState<ManagedStop[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [lastOrderSyncAt, setLastOrderSyncAt] = useState<number | null>(null);

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingStop, setEditingStop] = useState<ManagedStop | null>(null);
  const [insertSequence, setInsertSequence] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchApi<RoutesResponse>("/api/routes")
      .then((res) => {
        if (res.success) {
          setRoutes(res.data);
        }
      })
      .catch(() =>
        notify.error({
          title: "Rutas no disponibles",
          description:
            "No se pudieron cargar las rutas del panel de administración.",
        }),
      )
      .finally(() => setLoadingRoutes(false));
  }, []);

  const loadStops = useCallback(
    async (dirId: string, options?: StopsChangeOptions) => {
      setLoadingStops(true);
      try {
        const res = await getStopsByDirection(dirId);
        if (res.success) {
          setStops(res.data);
          onStopsChange(res.data, options);
        }
      } catch {
        notify.error({
          title: "Paradas no disponibles",
          description: "No se pudieron cargar las paradas de esta dirección.",
        });
      } finally {
        setLoadingStops(false);
      }
    },
    [onStopsChange],
  );

  useEffect(() => {
    if (selectedDirId) {
      void loadStops(selectedDirId);
    }
  }, [selectedDirId, loadStops]);

  const closeForm = () => {
    setFormMode(null);
    setEditingStop(null);
    setInsertSequence(null);
    onPickModeChange(false);
  };

  const handleRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const route =
      routes.find((candidate) => candidate.id === e.target.value) ?? null;
    const firstDirection = route?.directions[0] ?? null;

    setSelectedRoute(route);
    setSelectedDirId(firstDirection?.id ?? null);
    setStops([]);
    setLastOrderSyncAt(null);
    setIsReordering(false);

    onRouteChange(route);
    onDirectionChange(firstDirection?.id ?? null);
    onStopsChange([]);
    closeForm();
  };

  const handleDirChange = (dirId: string) => {
    setSelectedDirId(dirId);
    setLastOrderSyncAt(null);
    setIsReordering(false);
    onDirectionChange(dirId);
    closeForm();
  };

  const handleCreate = () => {
    setFormMode("create");
    setEditingStop(null);
    setInsertSequence(null);
  };

  const handleEdit = (stop: ManagedStop) => {
    setFormMode("edit");
    setEditingStop(stop);
    setInsertSequence(null);
    onPickModeChange(false);
  };

  const handleInsertAt = (sequence: number) => {
    setFormMode("create");
    setEditingStop(null);
    setInsertSequence(sequence);
  };

  const handleSave = async (data: StopFormData) => {
    if (!selectedDirId || data.lat === null || data.lng === null) {
      return;
    }

    setSaving(true);
    try {
      if (formMode === "edit" && editingStop) {
        await apiUpdateStop(editingStop.stop_id, {
          stop_name: data.stop_name,
          lat: data.lat,
          lng: data.lng,
        });
      } else {
        const sequence = insertSequence ?? stops.length + 1;
        await createStop({
          stop_name: data.stop_name,
          lat: data.lat,
          lng: data.lng,
          route_direction_id: selectedDirId,
          stop_sequence: sequence,
        });
      }

      closeForm();
      await loadStops(selectedDirId, { syncRoute: true });
      notify.success({
        title: formMode === "edit" ? "Parada actualizada" : "Parada agregada",
        description: "Los cambios ya aparecen en la ruta activa.",
      });
    } catch {
      notify.error({
        title: "No se pudo guardar",
        description:
          "La parada no se pudo guardar. Revisa la ubicación e inténtalo otra vez.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (stop: ManagedStop) => {
    if (!selectedDirId) {
      return;
    }

    if (!confirm(`¿Eliminar "${stop.stop_name}" de esta dirección?`)) {
      return;
    }

    try {
      await removeStop(stop.stop_id, selectedDirId);
      await loadStops(selectedDirId, { syncRoute: true });
      notify.success({
        title: "Parada eliminada",
        description: `"${stop.stop_name}" fue removida de esta dirección.`,
      });
    } catch {
      notify.error({
        title: "No se pudo eliminar",
        description:
          "La parada no se pudo eliminar de la dirección seleccionada.",
      });
    }
  };

  const handleReorder = async (from: number, to: number) => {
    if (!selectedDirId || isReordering) {
      return;
    }

    const previousStops = stops;
    const nextStops = reorderStopList(stops, from, to);

    if (nextStops === stops) {
      return;
    }

    setStops(nextStops);
    onStopsChange(nextStops, { syncRoute: true });
    setIsReordering(true);

    try {
      await reorderStops(
        selectedDirId,
        nextStops.map((stop) => stop.stop_id),
      );
      setLastOrderSyncAt(Date.now());
    } catch {
      setStops(previousStops);
      onStopsChange(previousStops, { syncRoute: true });
      notify.error({
        title: "No se pudo reordenar",
        description: "No se pudo mover la parada en esta dirección.",
      });
    } finally {
      setIsReordering(false);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) {
      return;
    }

    await handleReorder(index, index - 1);
  };

  const handleMoveDown = async (index: number) => {
    if (index >= stops.length - 1) {
      return;
    }

    await handleReorder(index, index + 1);
  };

  const badgeColor = (color: string | null) =>
    color ? `#${color.replace("#", "")}` : "#3b82f6";
  const panelAccent = badgeColor(selectedRoute?.color ?? null);
  const activeDirection =
    selectedRoute?.directions.find(
      (direction) => direction.id === selectedDirId,
    ) ?? null;
  const syncLabel = isReordering
    ? "Sincronizando el nuevo orden..."
    : lastOrderSyncAt
      ? "Orden sincronizado"
      : "Haz cambios y el mapa responde al instante";

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_36%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] backdrop-blur-md">
      <div className="shrink-0 border-b border-slate-200/80 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Administrar Paradas
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Reordena primero, sincroniza después. El mapa acompaña cada ajuste
              sin esperar un recargo completo.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
            Webapp Admin
          </div>
        </div>
      </div>

      <div className="shrink-0 space-y-4 border-b border-slate-200/80 px-4 py-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-3 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            <Sparkles className="h-3.5 w-3.5" />
            Contexto de edición
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
              style={{ backgroundColor: panelAccent }}
            >
              {selectedRoute?.route_name ?? "Sin ruta activa"}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {activeDirection?.direction_name ?? "Selecciona una dirección"}
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500">
              {stops.length} paradas cargadas
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {isReordering ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            )}
            <span>{syncLabel}</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="admin-route-select"
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            Ruta
          </label>
          {loadingRoutes ? (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando rutas...
            </div>
          ) : (
            <select
              id="admin-route-select"
              value={selectedRoute?.id ?? ""}
              onChange={handleRouteChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Selecciona una ruta</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.route_name} — {route.route_long_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedRoute && selectedRoute.directions.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {selectedRoute.directions.map((direction) => (
              <button
                key={direction.id}
                type="button"
                onClick={() => handleDirChange(direction.id)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  selectedDirId === direction.id
                    ? "border-transparent text-white shadow-lg"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
                style={
                  selectedDirId === direction.id
                    ? {
                        background: `linear-gradient(135deg, ${panelAccent}, rgba(15,23,42,0.92))`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Route className="h-3.5 w-3.5" />
                  {direction.direction_name}
                </div>
                <div className="mt-2 text-[11px] opacity-80">
                  {direction.total_stops} paradas en esta dirección
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto px-4 py-4">
        {loadingStops ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando paradas...
          </div>
        ) : selectedDirId ? (
          <>
            {formMode && (
              <div className="mb-4">
                <StopForm
                  initial={
                    editingStop
                      ? {
                          stop_name: editingStop.stop_name,
                          lat: editingStop.lat,
                          lng: editingStop.lng,
                        }
                      : undefined
                  }
                  pickMode={pickMode}
                  pickedPosition={pickedPosition}
                  onTogglePickMode={() => onPickModeChange(!pickMode)}
                  onSave={handleSave}
                  onCancel={closeForm}
                  saving={saving}
                />
              </div>
            )}

            {!formMode && (
              <div className="mb-3 rounded-2xl border border-dashed border-slate-300 bg-white/80 px-3 py-2.5 text-xs text-slate-500">
                Usa las flechas para ajustar la secuencia. Cada movimiento se
                refleja primero en la lista y el mapa, y luego se confirma en el
                backend.
              </div>
            )}

            <StopList
              stops={stops}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onInsertAt={handleInsertAt}
              disabled={isReordering}
            />
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/75 px-6 py-10 text-center text-sm text-slate-400">
            Selecciona una ruta y dirección para empezar a editar.
          </div>
        )}
      </div>

      {selectedDirId && !formMode && (
        <div className="shrink-0 border-t border-slate-200/80 px-4 py-3">
          <button
            type="button"
            onClick={handleCreate}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Agregar Parada
          </button>
        </div>
      )}
    </div>
  );
}
