export type QueryParams = Record<string, any> | undefined;

export function sanitizeParams(params?: Record<string, any>): Record<string, any> | undefined {
  if (!params) return undefined;
  const out: Record<string, any> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (typeof v === 'string' && v.trim() === '') return;
    out[k] = v;
  });
  return Object.keys(out).length ? out : undefined;
}
