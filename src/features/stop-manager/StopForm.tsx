"use client";

import { useState, useEffect } from "react";
import { MapPin, Save, X } from "lucide-react";
import type { StopFormData } from "./types";

type Props = {
  initial?: StopFormData;
  pickMode: boolean;
  pickedPosition: { lat: number; lng: number } | null;
  onTogglePickMode: () => void;
  onSave: (data: StopFormData) => void;
  onCancel: () => void;
  saving?: boolean;
};

export default function StopForm({
  initial,
  pickMode,
  pickedPosition,
  onTogglePickMode,
  onSave,
  onCancel,
  saving,
}: Props) {
  const [name, setName] = useState(initial?.stop_name ?? "");
  const [lat, setLat] = useState<number | null>(initial?.lat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.lng ?? null);

  // Sync picked position from map
  useEffect(() => {
    if (pickedPosition) {
      setLat(pickedPosition.lat);
      setLng(pickedPosition.lng);
    }
  }, [pickedPosition]);

  const canSave = name.trim().length > 0 && lat !== null && lng !== null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ stop_name: name.trim(), lat, lng });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-4 space-y-3"
    >
      {/* Name */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Nombre de la parada
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Boulevard Kukulcan, 7"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Ubicación
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-600 truncate">
            {lat !== null && lng !== null
              ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
              : "Sin ubicación"}
          </div>
          <button
            type="button"
            onClick={onTogglePickMode}
            className={`shrink-0 px-3 py-2 text-sm rounded-lg font-medium flex items-center gap-1.5 transition-colors ${
              pickMode
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {pickMode ? "Seleccionando..." : "Seleccionar en Mapa"}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={!canSave || saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </button>
      </div>
    </form>
  );
}
