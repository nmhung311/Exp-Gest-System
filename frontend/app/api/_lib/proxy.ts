export async function fetchJson(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const text = await r.text();
  try {
    return { ok: r.ok, status: r.status, data: JSON.parse(text) };
  } catch {
    return { ok: r.ok, status: r.status, data: { raw: text } };
  }
}

export async function fetchWithFallback(base: string, paths: string[], init?: RequestInit) {
  for (const p of paths) {
    const url = `${base}${p}`;
    const res = await fetchJson(url, init);
    if (res.ok) return { ...res, url };
    if (res.status !== 404) return { ...res, url };
  }
  return { ok: false, status: 404, data: { error: 'not_found_all_paths' }, url: `${base}${paths.join(' | ')}` };
}

export function toListShape(input: any) {
  if (Array.isArray(input)) return { items: input, meta: {} };
  if (Array.isArray(input?.items)) return { items: input.items, meta: { ...input, items: undefined } };
  if (Array.isArray(input?.results)) return { items: input.results, meta: { ...input, results: undefined } };
  if (Array.isArray(input?.data)) return { items: input.data, meta: { ...input, data: undefined } };
  return { items: [], meta: { raw: input } };
}
