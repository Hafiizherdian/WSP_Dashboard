/**
 * lib/salesCache.ts
 *
 * In-memory cache untuk hasil /api/sales-analysis (GET).
 * Sama seperti distributionCache.ts — data sales cuma berubah pas ada
 * upload/delete data baru (event jarang), sementara GET-nya di-hit
 * berkali-kali oleh banyak user dengan kombinasi filter yang sering sama
 * (year, week range, area, product).
 *
 * CATATAN
 * In-memory Map ini per PROCESS, bukan shared:
 *   - Untuk single-instance (PM2 fork mode / 1 VPS) ini aman.
 *   - Kalau nanti pindah ke multi-instance, ganti Map ini dengan Redis;
 *     fungsi getCached/setCached/invalidateAll di bawah sengaja dibikin
 *     generic supaya gampang diganti implementasinya tanpa ubah caller
 *     di route.ts.
 */

type CacheEntry = { data: unknown; expiresAt: number };

const cache = new Map<string, CacheEntry>();

// Sesuaikan dengan seberapa sering data sales berubah di sistem kamu.
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

// LRU sederhana: kalau penuh, buang entry yang paling lama di-set.
const MAX_ENTRIES = 300;

function cacheKey(params: Record<string, unknown>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== '' && v !== undefined && v !== null &&
      !(Array.isArray(v) && v.length === 0))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.slice().sort().join(',') : v}`)
    .join('&');
}

export function getCached<T = unknown>(params: Record<string, unknown>): T | null {
  const key = cacheKey(params);
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCached(params: Record<string, unknown>, data: unknown): void {
  const key = cacheKey(params);

  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }

  cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

// Dipanggil pas ada upload/delete data sales.
// Full-invalidate karena nggak tau kombinasi filter mana yang kena dampak
// dari 1 file yang diupload/dihapus.
export function invalidateAll(): void {
  const size = cache.size;
  cache.clear();
  console.log(`[sales-cache] invalidated ${size} entries`);
}

// Opsional — buat debugging/monitoring.
export function cacheStats() {
  return {
    size: cache.size,
    maxEntries: MAX_ENTRIES,
    ttlMs: TTL_MS,
  };
}