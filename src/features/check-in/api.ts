import { fetchApi } from "@/shared/api/apiClient";
import type { CheckIn, CheckInStatus } from "./types";

type ApiResponse<T> = { success: boolean; data: T };

export type CreateCheckInInput = {
  lat: number;
  lng: number;
  is_on_board: boolean;
  status: CheckInStatus;
  route_id: string;
};

export function createCheckIn(input: CreateCheckInInput) {
  return fetchApi<ApiResponse<CheckIn>>("/api/check-ins", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getRecentCheckIns(routeId: string) {
  return fetchApi<ApiResponse<CheckIn[]>>(
    `/api/check-ins/recent?routeId=${routeId}`
  );
}
