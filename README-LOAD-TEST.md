# Load Testing Dashboard Sales

## Overview
File ini berisi konfigurasi dan panduan untuk melakukan load testing pada aplikasi Dashboard Sales dengan simulasi 300 concurrent users.

## Files
- `load-test.mjs` - File utama load test menggunakan K6
- `package.json` - Sudah dikonfigurasi dengan `"type": "module"`

## Requirements
1. **K6 Load Testing Tool**
   ```bash
   # Install K6 (Windows)
   choco install k6
   # atau download dari https://k6.io/cloud/get-started/
   ```

2. **Node.js & NPM** (sudah terinstall)

## Cara Menjalankan Load Test

### 1. Start Dashboard Application
```bash
npm run dev
# Aplikasi akan berjalan di http://localhost:3000
```

### 2. Jalankan Load Test dengan K6
```bash
# Jalankan test dengan 300 users
k6 run load-test.mjs

# Atau dengan output ke file
k6 run load-test.mjs --out json=results.json
```

### 3. Test Scenarios
Load test ini mensimulasikan 3 tipe user:

#### Standard User (70%)
- Access homepage dashboard
- Fetch sales data API
- Load areas dan stats
- Think time: 1-3 detik

#### Power User (20%)
- Semua standard user actions
- Multiple API calls berturut-turut
- Complex filter operations
- Think time: 0.5-2 detik

#### Admin User (10%)
- Semua standard user actions
- File upload simulation
- Area management operations
- Think time: 1-2 detik

## Load Profile
Test akan berjalan selama ~14 menit dengan profile:

| Stage | Duration | Target Users | Description |
|-------|----------|--------------|-------------|
| Warmup | 30s | 50 | Gradual ramp-up |
| Moderate | 1m | 100 | Moderate load |
| High | 2m | 200 | High load |
| Peak | 3m | 300 | Peak load (300 users) |
| Sustained | 5m | 300 | Sustained peak |
| Cool Down | 2m | 100 | Gradual cool down |
| Ramp Down | 30s | 0 | Complete stop |

## Metrics & Thresholds
- **Response Time**: 95% < 2 detik
- **Error Rate**: < 10%
- **Throughput**: Target 100 req/second

## Custom Metrics
- `dashboard_load_time` - Waktu load homepage
- `api_response_time` - Waktu response API
- `errors` - Rate kesalahan

## API Endpoints yang Di-test
1. `GET /` - Homepage dashboard
2. `GET /api/sales` - Sales data dengan berbagai filter
3. `GET /api/areas` - Area management
4. `GET /api/stats` - Database statistics
5. `GET /api/files` - File management
6. `POST /api/upload` - File upload simulation

## Monitoring
Selama test berjalan, monitor:
- CPU dan Memory usage
- Database connection pool
- Response times
- Error rates
- Throughput

## Tips
1. Pastikan database memiliki data yang cukup untuk realistic testing
2. Monitor server resources selama test
3. Jalankan test beberapa kali untuk konsistensi hasil
4. Simpan hasil test untuk perbandingan performance improvements

## Troubleshooting
### Error "Cannot use import statement"
Pastikan menggunakan file `.mjs` dan package.json memiliki `"type": "module"`

### Connection Timeout
Check jika aplikasi tidak berjalan di localhost:3000

### High Error Rate
- Pastikan semua API endpoints berfungsi normal
- Check database connection
- Verify server resources (CPU, Memory)
