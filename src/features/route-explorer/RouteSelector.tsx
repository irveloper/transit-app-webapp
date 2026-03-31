"use client";

import { ChevronDown, Loader2, Route } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchApi } from "@/shared/api/apiClient";
import { notify } from "@/shared/ui/notify";

type RouteDirection = {
  id: string;
  direction_name: string;
  direction_index: number;
  total_stops: number;
  approx_duration: number;
  start_time: string;
  end_time: string;
  operates_on: string;
};

export type TransitRoute = {
  id: string;
  route_name: string;
  route_long_name: string;
  route_type: string;
  color: string | null;
  fare_amount: number | null;
  fare_currency: string;
  operator: { name: string; full_name: string };
  directions: RouteDirection[];
  recent_check_ins: number;
};

type ApiResponse = {
  success: boolean;
  data: TransitRoute[];
};

type Props = {
  onRouteSelect?: (route: TransitRoute) => void;
};

export default function RouteSelector({ onRouteSelect }: Props) {
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<TransitRoute | null>(null);

  useEffect(() => {
    const loadRoutes = async () => {
      try {
        const result = await fetchApi<ApiResponse>("/api/routes");
        if (result.success) {
          setRoutes(result.data);
        } else {
          notify.error({
            title: "Rutas no disponibles",
            description: "No se pudieron cargar las rutas en este momento.",
          });
        }
      } catch {
        notify.error({
          title: "Sin conexión",
          description: "No se pudo conectar con el servidor para cargar rutas.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadRoutes();
  }, []);

  const handleSelect = (route: TransitRoute) => {
    setSelected(route);
    setIsOpen(false);
    onRouteSelect?.(route);
  };

  const badgeColor = (color: string | null) =>
    color ? `#${color.replace("#", "")}` : "#6366f1";

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg w-full border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800 overflow-hidden">
      {/* Header — tap to toggle */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: selected
                ? badgeColor(selected.color)
                : "#3b82f6",
            }}
          >
            <Route className="w-4 h-4 text-white" />
          </div>
          <div className="text-left min-w-0">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
              {selected ? selected.route_name : "Selecciona una Ruta"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {selected
                ? selected.route_long_name
                : `${routes.length} rutas disponibles`}
            </p>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expandable route list */}
      <div
        className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"}`}
        style={{ overflow: isOpen ? "auto" : "hidden" }}
      >
        <div className="border-t border-slate-100 dark:border-slate-800">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando rutas…
            </div>
          )}

          {!loading && routes.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400">
              No hay rutas disponibles.
            </div>
          )}

          {!loading &&
            routes.map((route) => {
              const isActive = selected?.id === route.id;
              return (
                <button
                  type="button"
                  key={route.id}
                  onClick={() => handleSelect(route)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-950/40"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {/* Color badge */}
                  <span
                    className="shrink-0 w-3 h-3 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm"
                    style={{ backgroundColor: badgeColor(route.color) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {route.route_name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                      {route.operator.full_name}
                    </p>
                  </div>
                  {/* Direction count */}
                  <span className="shrink-0 text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 px-1.5 py-0.5 rounded-md">
                    {route.directions.length === 1
                      ? "1 dir"
                      : `${route.directions.length} dirs`}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
