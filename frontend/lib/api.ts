const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

//  修改后：
export function getApiBase() {
    return DEFAULT_API_BASE;
}

//  修改后：
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // 💡 关键：改用 getApiBase() 动态获取地址
  const apiBase = getApiBase();

  try {
    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      const message =
        (typeof payload === "object" && payload && "detail" in payload && typeof payload.detail === "string"
          ? payload.detail
          : typeof payload === "string" && payload
            ? payload
            : `Request failed (${response.status})`);
      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408);
    }
    throw new ApiError(error instanceof Error ? error.message : "Network request failed", 0);
  } finally {
    clearTimeout(timeoutId);
  }
}
