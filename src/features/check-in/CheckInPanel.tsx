"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { notify } from "@/shared/ui/notify";
import { createCheckIn } from "./api";
import type { CheckInStatus } from "./types";

type Props = {
  routeId: string;
  routeName: string;
};

const STATUS_OPTIONS: {
  value: CheckInStatus;
  label: string;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "Fluido",
    label: "Fluido",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    activeColor: "bg-emerald-500 text-white border-emerald-500",
  },
  {
    value: "Tráfico",
    label: "Tráfico",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    activeColor: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "Lleno",
    label: "Lleno",
    color: "bg-red-100 text-red-700 border-red-200",
    activeColor: "bg-red-500 text-white border-red-500",
  },
];

function getCheckInErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "No se pudo enviar. Inténtalo de nuevo.";
  }

  if (error.message.includes("403")) {
    return "No se pudo enviar. Acércate más a la ruta o a una parada cercana.";
  }

  return "No se pudo enviar. Inténtalo de nuevo.";
}

function getCurrentPositionAsync() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });
}

export default function CheckInPanel({ routeId, routeName }: Props) {
  const [isOnBoard, setIsOnBoard] = useState(true);
  const [status, setStatus] = useState<CheckInStatus>("Fluido");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!navigator.geolocation) {
      notify.error({
        title: "Geolocalización no disponible",
        description: "Tu navegador no soporta geolocalización.",
      });
      return;
    }

    setSubmitting(true);

    const submission = (async () => {
      let position: GeolocationPosition;

      try {
        position = await getCurrentPositionAsync();
      } catch {
        throw new Error("LOCATION_UNAVAILABLE");
      }

      return createCheckIn({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        is_on_board: isOnBoard,
        status,
        route_id: routeId,
      });
    })();

    try {
      await notify.promise(submission, {
        loading: {
          title: "Enviando reporte",
          description: `Validando tu posición cerca de ${routeName}.`,
        },
        success: {
          title: "Reporte enviado",
          description: "Gracias por contribuir con información en tiempo real.",
        },
        error: (error: unknown) => ({
          title:
            error instanceof Error && error.message === "LOCATION_UNAVAILABLE"
              ? "Ubicación no disponible"
              : "No se pudo enviar",
          description:
            error instanceof Error && error.message === "LOCATION_UNAVAILABLE"
              ? "No se pudo obtener tu ubicación. Activa el GPS e inténtalo otra vez."
              : getCheckInErrorMessage(error),
        }),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg w-full border border-slate-100 dark:bg-slate-900/90 dark:border-slate-800">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-3">
        Reportar — {routeName}
      </h3>

      {/* On board toggle */}
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setIsOnBoard(true)}
          className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-colors ${
            isOnBoard
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          }`}
        >
          En el camión
        </button>
        <button
          type="button"
          onClick={() => setIsOnBoard(false)}
          className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-colors ${
            !isOnBoard
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          }`}
        >
          Esperando
        </button>
      </div>

      {/* Status buttons */}
      <div className="flex gap-2 mb-3">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatus(opt.value)}
            className={`flex-1 text-xs font-medium py-2 rounded-xl border transition-colors ${
              status === opt.value ? opt.activeColor : opt.color
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {submitting ? "Enviando..." : "Enviar Reporte"}
      </button>
    </div>
  );
}
