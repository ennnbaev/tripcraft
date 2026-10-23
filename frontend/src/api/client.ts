// Thin fetch wrapper. In dev, Vite proxies /api to http://localhost:8080.
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}
