import { fetchApi } from "@/shared/api/apiClient";
import type { ManagedStop } from "./types";

type ApiResponse<T> = { success: boolean; data: T };

export function getStopsByDirection(directionId: string) {
  return fetchApi<ApiResponse<ManagedStop[]>>(
    `/api/stops/direction/${directionId}`,
  );
}

export function createStop(input: {
  stop_name: string;
  lat: number;
  lng: number;
  route_direction_id: string;
  stop_sequence: number;
}) {
  return fetchApi<ApiResponse<ManagedStop>>("/api/stops", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateStop(
  stopId: string,
  data: { stop_name?: string; lat?: number; lng?: number },
) {
  return fetchApi<ApiResponse<ManagedStop>>(`/api/stops/${stopId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function removeStop(stopId: string, directionId: string) {
  return fetchApi<ApiResponse<null>>(
    `/api/stops/${stopId}/direction/${directionId}`,
    { method: "DELETE" },
  );
}

export function reorderStops(directionId: string, routeStopIds: string[]) {
  return fetchApi<ApiResponse<null>>(
    `/api/stops/direction/${directionId}/reorder`,
    { method: "PUT", body: JSON.stringify({ routeStopIds }) },
  );
}

export function insertExistingStop(
  directionId: string,
  stopId: string,
  sequence: number,
) {
  return fetchApi<ApiResponse<null>>(
    `/api/stops/direction/${directionId}/insert`,
    { method: "POST", body: JSON.stringify({ stopId, sequence }) },
  );
}
