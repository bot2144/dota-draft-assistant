/**
 * Unified HTTP client for AI provider calls.
 *
 * Inside Tauri we route through the `http` plugin, which calls out from the
 * Rust side and is not subject to browser CORS restrictions. In a plain
 * browser/dev context we fall back to `window.fetch`, adding the
 * "direct browser access" opt-in header some providers require.
 */

function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export interface HttpJsonRequest {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

export class HttpError extends Error {
  status: number;
  bodyText: string;
  constructor(status: number, bodyText: string) {
    super(`HTTP ${status}`);
    this.status = status;
    this.bodyText = bodyText;
  }
}

export async function httpPostJson<T>(req: HttpJsonRequest): Promise<T> {
  const timeoutMs = req.timeoutMs ?? 30000;

  if (isTauri()) {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await tauriFetch(req.url, {
        method: req.method ?? 'POST',
        headers: { 'content-type': 'application/json', ...req.headers },
        body: req.body ? JSON.stringify(req.body) : undefined,
        signal: controller.signal,
      });
      const text = await res.text();
      if (!res.ok) throw new HttpError(res.status, text);
      return JSON.parse(text) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(req.url, {
      method: req.method ?? 'POST',
      headers: { 'content-type': 'application/json', ...req.headers },
      body: req.body ? JSON.stringify(req.body) : undefined,
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new HttpError(res.status, text);
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}
