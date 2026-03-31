"use client";

import {
  Bus,
  Crosshair,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  GeocodeSuggestion,
  PlannerLocation,
} from "@/features/journey-planner/locationSearch";
import { geocode } from "@/features/journey-planner/locationSearch";
import { fetchApi } from "@/shared/api/apiClient";
import { notify } from "@/shared/ui/notify";

type RouteResult = {
  id: string;
  route_name: string;
  route_long_name?: string;
  color?: string | null;
  distance?: number;
  distance_from_origin?: number;
  distance_from_dest?: number;
};

type RouteResponse = {
  success: boolean;
  data: RouteResult[];
};

type Props = {
  originCoords: PlannerLocation | null;
  destCoords: PlannerLocation | null;
  onRouteSelect?: (routeId: string) => void;
  onOriginChange?: (coords: PlannerLocation | null) => void;
  onDestinationChange?: (coords: PlannerLocation | null) => void;
  mapPickTarget?: "origin" | "dest" | null;
  onMapPickTargetChange?: (target: "origin" | "dest" | null) => void;
  mapPickResolvingTarget?: "origin" | "dest" | null;
};

export default function DestinationSearch({
  originCoords,
  destCoords,
  onRouteSelect,
  onOriginChange,
  onDestinationChange,
  mapPickTarget = null,
  onMapPickTargetChange,
  mapPickResolvingTarget = null,
}: Props) {
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState<
    GeocodeSuggestion[]
  >([]);
  const [destSuggestions, setDestSuggestions] = useState<GeocodeSuggestion[]>(
    [],
  );
  const [focusedField, setFocusedField] = useState<"origin" | "dest" | null>(
    null,
  );

  const [locatingUser, setLocatingUser] = useState(false);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<RouteResult[] | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocusedField(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-fetch nearby routes when origin is selected
  useEffect(() => {
    if (!originCoords) return;

    let cancelled = false;
    setSearching(true);

    fetchApi<RouteResponse>(
      `/api/routes/nearby?lat=${originCoords.lat}&lng=${originCoords.lng}`,
    )
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setResults(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          notify.error({
            title: "Rutas cercanas no disponibles",
            description:
              "No se pudieron cargar las rutas cercanas a tu ubicación.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [originCoords]);

  useEffect(() => {
    if (originCoords) {
      setOriginText(originCoords.label);
    }
  }, [originCoords]);

  useEffect(() => {
    if (destCoords) {
      setDestText(destCoords.label);
    }
  }, [destCoords]);

  const handleGeocode = (
    text: string,
    setter: (s: GeocodeSuggestion[]) => void,
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 3) {
      setter([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await geocode(text);
      setter(results);
    }, 400);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      notify.error({
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta geolocalización.",
      });
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onOriginChange?.({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Mi Ubicación",
        });
        setOriginText("Mi Ubicación");
        setOriginSuggestions([]);
        setResults(null);
        setLocatingUser(false);
        notify.success({
          title: "Ubicación detectada",
          description: "Usaremos tu ubicación actual como origen.",
          duration: 2600,
        });
      },
      () => {
        notify.error({
          title: "Ubicación no disponible",
          description: "No se pudo obtener tu ubicación actual.",
        });
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const selectSuggestion = (
    suggestion: GeocodeSuggestion,
    field: "origin" | "dest",
  ) => {
    const coords: PlannerLocation = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      label: suggestion.display_name.split(",")[0],
    };
    if (field === "origin") {
      setOriginText(coords.label);
      setOriginSuggestions([]);
      onOriginChange?.(coords);
    } else {
      setDestText(coords.label);
      setDestSuggestions([]);
      onDestinationChange?.(coords);
    }
    setResults(null);
    setFocusedField(null);
  };

  const toggleMapPick = (field: "origin" | "dest") => {
    setFocusedField(null);
    setResults(null);
    onMapPickTargetChange?.(mapPickTarget === field ? null : field);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setResults(null);

    if (!originCoords) {
      notify.warning({
        title: "Falta el origen",
        description: "Selecciona un punto de origen para buscar rutas.",
      });
      return;
    }
    if (!destCoords) {
      notify.warning({
        title: "Falta el destino",
        description: "Selecciona un destino antes de continuar.",
      });
      return;
    }

    setSearching(true);
    try {
      const res = await fetchApi<RouteResponse>(
        `/api/routes/journey?originLat=${originCoords.lat}&originLng=${originCoords.lng}&destLat=${destCoords.lat}&destLng=${destCoords.lng}`,
      );
      if (res.success) {
        setResults(res.data);
      } else {
        notify.error({
          title: "Búsqueda fallida",
          description: "No se pudieron buscar rutas para este trayecto.",
        });
      }
    } catch {
      notify.error({
        title: "Sin conexión",
        description: "No se pudo conectar con el servidor para buscar rutas.",
      });
    } finally {
      setSearching(false);
    }
  };

  const clearResults = () => {
    setResults(null);
  };

  return (
    <div
      ref={containerRef}
      className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg w-full border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800 overflow-visible"
    >
      <div className="p-4">
        <h2 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-500" />
          Planea tu Viaje
        </h2>

        {(mapPickTarget || mapPickResolvingTarget) && (
          <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-3 py-3 text-sm text-sky-900">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-sky-600 p-1.5 text-white">
                {mapPickResolvingTarget ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {mapPickResolvingTarget === "origin" &&
                    "Guardando Punto A desde el mapa..."}
                  {mapPickResolvingTarget === "dest" &&
                    "Guardando Punto B desde el mapa..."}
                  {!mapPickResolvingTarget &&
                    mapPickTarget === "origin" &&
                    "Toca el mapa para fijar el Punto A"}
                  {!mapPickResolvingTarget &&
                    mapPickTarget === "dest" &&
                    "Toca el mapa para fijar el Punto B"}
                </p>
                <p className="mt-1 text-sky-800/80">
                  Usa el mapa de fondo para dejar el pin exacto en el origen o
                  el destino.
                </p>
              </div>
              {mapPickTarget && !mapPickResolvingTarget && (
                <button
                  type="button"
                  onClick={() => onMapPickTargetChange?.(null)}
                  className="rounded-full p-1 text-sky-700 transition-colors hover:bg-sky-100"
                  aria-label="Cancelar selección en mapa"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          {/* Origin field */}
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Punto A
            </span>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-500" />
              <input
                type="text"
                placeholder="Elige origen"
                value={originText}
                onChange={(e) => {
                  setOriginText(e.target.value);
                  onOriginChange?.(null);
                  setResults(null);
                  handleGeocode(e.target.value, setOriginSuggestions);
                }}
                onFocus={() => setFocusedField("origin")}
                className="w-full pl-8 pr-20 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggleMapPick("origin")}
                  className={`rounded-full p-1 transition-colors ${
                    mapPickTarget === "origin"
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:bg-slate-200 hover:text-blue-700"
                  }`}
                  title="Elegir Punto A en el mapa"
                >
                  <MapPin className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={useMyLocation}
                  disabled={locatingUser}
                  className="rounded-full p-1 text-blue-500 transition-colors hover:bg-slate-200 hover:text-blue-700"
                  title="Usar mi ubicación"
                >
                  {locatingUser ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixed className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Origin suggestions */}
            {focusedField === "origin" && originSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 bottom-full mb-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 max-h-48 overflow-auto">
                {originSuggestions.map((s) => (
                  <li key={`${s.display_name}-${s.lat}-${s.lon}`}>
                    <button
                      type="button"
                      onClick={() => selectSuggestion(s, "origin")}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 truncate text-slate-700 dark:text-slate-200"
                    >
                      {s.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Destination field */}
          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Punto B
            </span>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
              <input
                type="text"
                placeholder="Elige destino"
                value={destText}
                onChange={(e) => {
                  setDestText(e.target.value);
                  onDestinationChange?.(null);
                  setResults(null);
                  handleGeocode(e.target.value, setDestSuggestions);
                }}
                onFocus={() => setFocusedField("dest")}
                className="w-full pl-8 pr-12 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-white"
                required
              />
              <button
                type="button"
                onClick={() => toggleMapPick("dest")}
                className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors ${
                  mapPickTarget === "dest"
                    ? "bg-rose-600 text-white"
                    : "text-slate-500 hover:bg-slate-200 hover:text-rose-700"
                }`}
                title="Elegir Punto B en el mapa"
              >
                <MapPin className="h-4 w-4" />
              </button>
            </div>

            {/* Destination suggestions */}
            {focusedField === "dest" && destSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 bottom-full mb-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 max-h-48 overflow-auto">
                {destSuggestions.map((s) => (
                  <li key={`${s.display_name}-${s.lat}-${s.lon}`}>
                    <button
                      type="button"
                      onClick={() => selectSuggestion(s, "dest")}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 truncate text-slate-700 dark:text-slate-200"
                    >
                      {s.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {searching ? "Buscando…" : "Buscar Rutas"}
          </button>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="border-t border-slate-100 dark:border-slate-800">
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {results.length === 0
                ? "No se encontraron rutas cercanas"
                : `${results.length} ruta${results.length > 1 ? "s" : ""} encontrada${results.length > 1 ? "s" : ""}`}
            </span>
            <button
              type="button"
              onClick={clearResults}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {results.length > 0 && (
            <div className="max-h-40 overflow-auto">
              {results.map((route) => (
                <button
                  type="button"
                  key={route.id}
                  onClick={() => onRouteSelect?.(route.id)}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Bus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {route.route_name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {route.distance_from_origin != null &&
                      route.distance_from_dest != null
                        ? `Origen: ${Math.round(route.distance_from_origin)}m · Destino: ${Math.round(route.distance_from_dest)}m`
                        : route.distance != null
                          ? `A ${Math.round(route.distance)}m de tu origen`
                          : (route.route_long_name ?? "")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
