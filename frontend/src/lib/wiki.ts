import { useQuery } from '@tanstack/react-query'

// Place facts and photos from Wikipedia (free, no key, CORS enabled). Phase 1 of "Place details" in the design handoff.
// Third-party service, so it is called directly instead of through our api() client.

export type PlaceInfo = {
  title: string
  extract: string
  /** small image for cards (~330px wide) */
  thumbnail: string | null
  /** larger image for the details panel */
  image: string | null
  url: string
}

const CACHE_PREFIX = 'tc-wiki:v2:'
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

// Words that say what kind of place it is; they don't prove an article is about *this* place
const GENERIC = new Set(
  'the and of in at on to for a an by with from restaurant cafe café bar museum park church cathedral monastery fortress castle palace tower gallery theatre theater garden market street square bridge tour walk visit lunch dinner breakfast house old new city centre center national local traditional'.split(
    ' ',
  ),
)

const tokens = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 2 && !GENERIC.has(w))

/** Accept a search hit only if its title shares a distinctive word with the activity name. */
function matches(name: string, title: string): boolean {
  const titleWords = new Set(tokens(title))
  return tokens(name).some((w) => titleWords.has(w))
}

function readCache(key: string): PlaceInfo | null | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return undefined
    const { at, value } = JSON.parse(raw) as { at: number; value: PlaceInfo | null }
    return Date.now() - at < CACHE_TTL_MS ? value : undefined
  } catch {
    return undefined
  }
}

function writeCache(key: string, value: PlaceInfo | null) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), value }))
  } catch {
    // storage full or blocked: the in-memory query cache still works
  }
}

async function lookup(name: string, city: string, signal?: AbortSignal): Promise<PlaceInfo | null> {
  const search = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: `${name} ${city}`,
    format: 'json',
    origin: '*',
    srlimit: '3',
  })
  const res = await fetch(`https://en.wikipedia.org/w/api.php?${search}`, { signal })
  if (!res.ok) throw new Error(`Wikipedia search failed: ${res.status}`)
  const hits = ((await res.json()) as { query?: { search?: { title: string }[] } }).query?.search ?? []
  const hit = hits.find((h) => matches(name, h.title))
  if (!hit) return null

  const summary = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`, {
    signal,
  })
  if (!summary.ok) return null
  const s = (await summary.json()) as {
    type?: string
    title: string
    extract?: string
    thumbnail?: { source: string }
    originalimage?: { source: string; width: number }
    content_urls?: { desktop?: { page?: string } }
  }
  if (s.type === 'disambiguation' || !s.extract) return null

  const thumbnail = s.thumbnail?.source ?? null
  // thumbnails are ".../330px-File.jpg"; Wikimedia only serves standard widths (330, 500, 960, ...), 500 fits the panel
  const image = thumbnail ? thumbnail.replace(/\/\d+px-/, '/500px-') : (s.originalimage?.source ?? null)
  return {
    title: s.title,
    extract: s.extract,
    thumbnail,
    image,
    url: s.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title)}`,
  }
}

/** First part of "Tbilisi, Georgia". */
export const cityOf = (destination: string) => destination.split(',')[0].trim()

/** Wikipedia summary and photo for an itinerary stop; null when there is no matching article. */
export function usePlaceInfo(name: string, destination: string, enabled = true) {
  const city = cityOf(destination)
  const key = `${name}|${city}`.toLowerCase()
  return useQuery({
    queryKey: ['place-info', key],
    queryFn: async ({ signal }) => {
      const cached = readCache(key)
      if (cached !== undefined) return cached
      const info = await lookup(name, city, signal)
      writeCache(key, info)
      return info
    },
    enabled,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    retry: false,
  })
}
