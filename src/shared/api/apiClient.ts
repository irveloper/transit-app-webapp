export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json();
}
