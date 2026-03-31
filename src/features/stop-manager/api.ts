import { fetchApi } from "@/shared/api/apiClient";
import type { ManagedStop } from "./types";

type ApiResponse<T> = { success: boolean; data: T };
type ManagedStopApiResponse = Partial<ManagedStop> & {
  id?: string;
  routeStopId?: string;
  stopId?: string;
  stopName?: string;
  stopSequence?: number;
};

function normalizeManagedStop(stop: ManagedStopApiResponse): ManagedStop {
  return {
    route_stop_id: stop.route_stop_id ?? stop.routeStopId ?? stop.id ?? "",
    stop_id: stop.stop_id ?? stop.stopId ?? "",
    stop_name: stop.stop_name ?? stop.stopName ?? "",
    stop_sequence: stop.stop_sequence ?? stop.stopSequence ?? 0,
    lat: typeof stop.lat === "number" ? stop.lat : Number(stop.lat ?? 0),
    lng: typeof stop.lng === "number" ? stop.lng : Number(stop.lng ?? 0),
  };
}

export async function getStopsByDirection(directionId: string) {
  const response = await fetchApi<ApiResponse<ManagedStopApiResponse[]>>(
    `/api/stops/direction/${directionId}`,
  );

  return {
    ...response,
    data: response.data.map(normalizeManagedStop),
  };
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
