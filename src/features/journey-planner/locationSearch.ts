"use client";

export type GeocodeSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
};

export type PlannerLocation = {
  lat: number;
  lng: number;
  label: string;
};

const NOMINATIM_HEADERS = {
  "User-Agent": "RutaCancun/1.0",
};

export async function geocode(query: string): Promise<GeocodeSuggestion[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=4&countrycodes=mx&viewbox=-87.1,-86.7,21.0,21.3&bounded=1`;
  const res = await fetch(url, {
    headers: NOMINATIM_HEADERS,
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
  const res = await fetch(url, {
    headers: NOMINATIM_HEADERS,
  });

  if (!res.ok) {
    return `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
  }

  const data = (await res.json()) as {
    display_name?: string;
    name?: string;
    address?: {
      road?: string;
      neighbourhood?: string;
      suburb?: string;
    };
  };

  return (
    data.name ??
    data.address?.road ??
    data.address?.neighbourhood ??
    data.address?.suburb ??
    data.display_name?.split(",")[0] ??
    `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`
  );
}
