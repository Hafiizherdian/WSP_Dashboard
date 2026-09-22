/**
 * lib/distributionCache.ts
 *
 * In-memory cache untuk hasil agregasi /api/distribution (GET).
 * Data distribution_records cuma berubah pas upload/delete file (event jarang, admin-only), 
 * sementara GET-nya di-hit berkali-kali oleh banyak user dengan filter yang sering sama (area + rentang minggu default).
 * Query GET itu sendiri berat (13 query paralel, ~9GB tabel, bisa >100 detik tanpa cache) 
 * jadi cache di sini bukan micro-optimization, tapi yang bikin dashboard ini kepake sama sekali di kondisi server sekarang.
 *
 * CATATAN 
 * in-memory Map ini per PROCESS, bukan shared:
 *   - Kalau nanti app di-scale ke >1 instance (PM2 cluster mode / multi server), 
 *     tiap instance punya cache sendiri-sendiri -> user bisa
 *     dapat jawaban beda tergantung instance mana yang nangkep request-nya sampai TTL habis. 
 *     Untuk single-instance (PM2 fork mode / 1 VPS sekarang) ini aman.
 * 
 *   - Kalau nanti pindah ke multi-instance, ganti Map ini dengan Redis
 *     struktur fungsi getCached/setCached/invalidateAll di bawah ini sengaja dibikin generic 
 *     supaya gampang diganti implementasinya tanpa ubah caller di route.ts.
 */

type CacheEntry = { data: unknown; expiresAt: number };

const cache = new Map<string, CacheEntry>();

// 30 menit cukup panjang buat nutupin traffic browsing biasa, 
// tapi tetap ke-invalidate otomatis kalau kelupaan panggil invalidateAll()
// di suatu tempat (fallback safety net, bukan mekanisme utama).
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Cache dibatasi jumlah entry-nya supaya nggak bocor memory 
// kalau ada kombinasi filter yang sangat banyak (misal search box bebas ketik).
// LRU sederhana: kalau penuh, buang entry yang paling lama di-set.
const MAX_ENTRIES = 300;

function cacheKey(params: Record<string, string>): string {
  return Object.entries(params)
    .filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

export function getCached<T = unknown>(params: Record<string, string>): T | null {
  const key = cacheKey(params);
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function setCached(params: Record<string, string>, data: unknown): void {
  const key = cacheKey(params);

  if (cache.size >= MAX_ENTRIES && !cache.has(key)) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }

  cache.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

// Dipanggil pas ada upload atau delete file distribusi. 
// Karena nggak tau area/filter mana yang kena dampak dari 1 file yang diupload/dihapus,
// jadi lebih aman full-invalidate daripada salah target
// (soalnya bisa bikin user liat data basi).
export function invalidateAll(): void {
  const size = cache.size;
  cache.clear();
  console.log(`[dist-cache] invalidated ${size} entries`);
}

// Opsional — buat debugging/monitoring, nggak dipanggil otomatis di mana pun.
export function cacheStats() {
  return {
    size: cache.size,
    maxEntries: MAX_ENTRIES,
    ttlMs: TTL_MS,
  };
}