const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers: customHeaders, ...rest } = options;

  const token = localStorage.getItem('meatmart_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const config: RequestInit = {
    ...rest,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      // response wasn't JSON
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string, headers?: HeadersInit) => apiRequest<T>(url, { method: 'GET', headers }),
  post: <T = any>(url: string, data?: any, headers?: HeadersInit) => apiRequest<T>(url, { method: 'POST', data, headers }),
  put: <T = any>(url: string, data?: any, headers?: HeadersInit) => apiRequest<T>(url, { method: 'PUT', data, headers }),
  patch: <T = any>(url: string, data?: any, headers?: HeadersInit) => apiRequest<T>(url, { method: 'PATCH', data, headers }),
  delete: <T = any>(url: string, headers?: HeadersInit) => apiRequest<T>(url, { method: 'DELETE', headers }),
};
