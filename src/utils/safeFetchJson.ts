/**
 * Safely parses a Fetch API response as JSON without crashing with
 * `SyntaxError: Unexpected token '<'` if a proxy/gateway returns an HTML error page.
 */
export async function safeParseJson<T = any>(
  response: Response,
  fallbackError = 'Máy chủ đang khởi động lại hoặc quá tải. Vui lòng thử lại sau vài giây.'
): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (!rawText.trim()) {
    if (!response.ok) {
      throw new Error(fallbackError);
    }
    return {} as T;
  }

  if (contentType.includes('application/json') || rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
    try {
      return JSON.parse(rawText) as T;
    } catch {
      throw new Error(fallbackError);
    }
  }

  // Non-JSON payload (e.g., HTML gateway timeout/502/503 or SPA fallback)
  if (response.status === 504 || response.status === 502 || response.status === 503) {
    throw new Error('Kết nối tới Lão Sư AI tạm thời bị gián đoạn. Vui lòng bấm thử lại ngay nhé!');
  }
  throw new Error(fallbackError);
}
