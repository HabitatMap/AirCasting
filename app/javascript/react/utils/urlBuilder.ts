export function buildURL(
  baseURL: string,
  params: Record<string, string>
): string {
  let url = `${baseURL}?`;
  for (const [key, value] of Object.entries(params)) {
    url += `${key}=${value}&`;
  }
  return url.slice(0, -1);
}
