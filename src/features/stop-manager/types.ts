export type ManagedStop = {
  stop_id: string;
  stop_name: string;
  stop_sequence: number;
  lat: number;
  lng: number;
};

export type StopFormData = {
  stop_name: string;
  lat: number | null;
  lng: number | null;
};
