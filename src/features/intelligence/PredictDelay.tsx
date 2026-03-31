"use client";

import { AlertTriangle, Clock3, MapPin, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchApi } from "@/shared/api/apiClient";

type Props = {
  routeId: string | null;
  routeName: string | null;
  userLocation: {
    lat: number;
    lng: number;
    label: string;
  } | null;
};

type ArrivalEstimate = {
  available: boolean;
  routeName: string;
  etaMinutes: number | null;
  confidence: "high" | "medium" | "low";
  reason: string;
  targetStop: {
    stopId: string;
    stopName: string;
    sequence: number;
    distanceMeters: number;
    directionName: string;
  } | null;
  sampleSize: number;
  basedOnCheckInCount: number;
};

type ArrivalEstimateResponse = {
  success: boolean;
  data: ArrivalEstimate;
};

export default function PredictDelay({
  routeId,
  routeName,
  userLocation,
}: Props) {
  const [estimate, setEstimate] = useState<ArrivalEstimate | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const displayRouteName = routeName ?? "la ruta seleccionada";

  const handlePredict = useCallback(async () => {
    if (!routeId || !userLocation) {
      setEstimate(null);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchApi<ArrivalEstimateResponse>(
        `/api/routes/${routeId}/arrival-estimate?lat=${userLocation.lat}&lng=${userLocation.lng}`,
      );
      setEstimate(result.data);
    } catch {
      setEstimate(null);
      setErrorMessage(
        "No se pudo calcular la llegada estimada en este momento.",
      );
    } finally {
      setLoading(false);
    }
  }, [routeId, userLocation]);

  useEffect(() => {
    if (!routeId || !routeName || !userLocation) {
      setEstimate(null);
      setErrorMessage(null);
      return;
    }

    handlePredict();
    const interval = setInterval(handlePredict, 60000);
    return () => clearInterval(interval);
  }, [handlePredict, routeId, routeName, userLocation]);

  if (!routeId || !routeName) return null;

  const headline = estimate?.available
    ? estimate.etaMinutes === 0
      ? `El próximo camión de ${displayRouteName} ya está muy cerca.`
      : `Estimamos que ${displayRouteName} llega en ${estimate.etaMinutes} min.`
    : null;

  const confidenceLabel =
    estimate?.confidence === "high"
      ? "Alta confianza"
      : estimate?.confidence === "medium"
        ? "Confianza media"
        : "Confianza limitada";

  return (
    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg w-full border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Clock3 className="w-4 h-4 text-emerald-500" />
          Tiempo estimado
        </h3>
        <button
          type="button"
          onClick={handlePredict}
          disabled={loading || !userLocation}
          className="text-xs font-medium px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Calculando..." : "Actualizar"}
        </button>
      </div>

      {!userLocation ? (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl flex gap-3 text-sm text-slate-700 dark:text-slate-200">
          <MapPin className="w-5 h-5 shrink-0 text-slate-500" />
          <p>
            Selecciona tu ubicación para estimar cuándo pasa el próximo camión.
          </p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex gap-3 text-sm text-rose-800 dark:text-rose-200 animate-in fade-in slide-in-from-bottom-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {estimate ? (
        estimate.available ? (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-900 dark:bg-emerald-950/30 p-3 text-sm text-emerald-950 dark:text-emerald-100 animate-in fade-in slide-in-from-bottom-2">
            <p className="font-semibold">{headline}</p>
            <p className="mt-1 text-emerald-800/90 dark:text-emerald-200/90">
              {estimate.reason}
            </p>
            {estimate.targetStop ? (
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">
                Parada objetivo: {estimate.targetStop.stopName} a{" "}
                {estimate.targetStop.distanceMeters} m. {confidenceLabel}.{" "}
                {estimate.basedOnCheckInCount} reportes a bordo recientes.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex gap-3 text-sm text-amber-900 dark:text-amber-100 animate-in fade-in slide-in-from-bottom-2">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-300" />
            <div>
              <p className="font-medium">
                Aún no hay una estimación confiable.
              </p>
              <p className="mt-1">{estimate.reason}</p>
              {estimate.targetStop ? (
                <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
                  Parada más cercana: {estimate.targetStop.stopName} a{" "}
                  {estimate.targetStop.distanceMeters} m.
                </p>
              ) : null}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
