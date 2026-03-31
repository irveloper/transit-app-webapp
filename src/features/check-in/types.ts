export type CheckInStatus = "Fluido" | "Lleno" | "Tráfico";

export type CheckIn = {
  id: string;
  created_at: string;
  lat: number;
  lng: number;
  is_on_board: boolean;
  status: CheckInStatus;
  route_id: string;
};
