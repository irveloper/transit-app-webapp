"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from "lucide-react";
import type { ManagedStop } from "./types";

type Props = {
  stops: ManagedStop[];
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onEdit: (stop: ManagedStop) => void;
  onRemove: (stop: ManagedStop) => void;
  onInsertAt: (sequence: number) => void;
  disabled?: boolean;
};

export default function StopList({
  stops,
  onMoveUp,
  onMoveDown,
  onEdit,
  onRemove,
  onInsertAt,
  disabled = false,
}: Props) {
  if (stops.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 py-10 text-center text-sm text-slate-400">
        No hay paradas en esta dirección.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <InsertButton onClick={() => onInsertAt(1)} disabled={disabled} />

      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;

        return (
          <div key={stop.stop_id} className="space-y-2">
            <div className="group rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md">
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-sm">
                    {stop.stop_sequence}
                  </span>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    {isFirst ? "Inicio" : isLast ? "Final" : "Stop"}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {stop.stop_name}
                    </p>
                    {(isFirst || isLast) && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {isFirst ? "Terminal inicial" : "Terminal final"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    icon={<ChevronUp className="h-3.5 w-3.5" />}
                    onClick={() => onMoveUp(index)}
                    disabled={disabled || isFirst}
                    title="Mover arriba"
                  />
                  <IconButton
                    icon={<ChevronDown className="h-3.5 w-3.5" />}
                    onClick={() => onMoveDown(index)}
                    disabled={disabled || isLast}
                    title="Mover abajo"
                  />
                  <IconButton
                    icon={<Pencil className="h-3.5 w-3.5" />}
                    onClick={() => onEdit(stop)}
                    disabled={disabled}
                    title="Editar"
                  />
                  <IconButton
                    icon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => onRemove(stop)}
                    disabled={disabled}
                    className="hover:bg-rose-50 hover:text-rose-600"
                    title="Eliminar"
                  />
                </div>
              </div>
            </div>

            <InsertButton
              onClick={() => onInsertAt(stop.stop_sequence + 1)}
              disabled={disabled}
            />
          </div>
        );
      })}
    </div>
  );
}

function InsertButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-1">
      <div className="h-px flex-1 bg-slate-200" />
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-40"
        title="Insertar parada aquí"
      >
        <Plus className="h-3.5 w-3.5" />
        Insertar
      </button>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function IconButton({
  icon,
  onClick,
  disabled,
  className = "",
  title,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30 ${className}`}
    >
      {icon}
    </button>
  );
}
