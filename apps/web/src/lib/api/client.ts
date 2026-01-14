import { createClient } from "@/lib/supabase/client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function getAuthToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...customHeaders,
  };

  if (!skipAuth) {
    const token = await getAuthToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...rest,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(error.message ?? "API request failed");
  }

  return response.json();
}

export const api = {
  get: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { method: "GET", ...options }),

  post: <T>(path: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, {
      method: "POST",
      body: JSON.stringify(data),
      ...options,
    }),

  patch: <T>(path: string, data?: unknown, options?: FetchOptions) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: JSON.stringify(data),
      ...options,
    }),

  delete: <T>(path: string, options?: FetchOptions) =>
    apiFetch<T>(path, { method: "DELETE", ...options }),
};
