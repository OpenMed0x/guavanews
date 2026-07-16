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
  if (typeof window === "undefined") {
    // 服务端渲染（SSR）时使用默认的环境变量
    return DEFAULT_API_BASE;
  }
  
  // 客户端运行时：如果是本地开发，依然请求本地 8000 端口；如果是 Vercel 线上，直接返回空字符串走相对路径
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? DEFAULT_API_BASE
    : ""; 
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
