# ticket-pulse-demo

Proyek demonstrasi perkuliahan untuk sistem reservasi tiket event (**Ticket Pulse**) berbasis monorepo Node.js (ESM), dirancang untuk mendemonstrasikan praktik **Continuous Integration (CI)** modern menggunakan **GitHub Actions**, **Service Containers (PostgreSQL & Redis)**, **Vitest V8 Coverage Quality Gate**, dan **Docker Multi-Stage Build**.

## Arsitektur Monorepo

```text
ticket-pulse-demo/
├── .github/workflows/ci.yml   # Pipeline CI deklaratif (backend-ci, frontend-ci, docker-verify)
├── backend/                   # REST API Express, PostgreSQL, Redis, & Vitest Quality Gate
│   ├── src/
│   │   ├── config/env.js      # Konfigurasi environment variables
│   │   ├── db/migrate.js      # Skrip migrasi skema tabel reservations
│   │   ├── infra/db.js        # Connection pool PostgreSQL
│   │   ├── infra/redis.js     # Klien Redis & manajemen kuota event
│   │   ├── services/          # Logika bisnis reservasi & kalkulasi harga tiket
│   │   ├── app.js             # Definisi endpoint Express API
│   │   └── server.js          # Entrypoint HTTP server
│   ├── tests/                 # Unit test & integration test (Supertest + Vitest mocks)
│   └── Dockerfile             # Multi-stage build (node:20-alpine, non-root USER node)
├── frontend/                  # Dashboard UI ringan berbasis Vite + Vitest (jsdom)
│   ├── src/main.js            # Helper format harga IDR, estimasi total, & rendering DOM
│   ├── tests/ticket-ui.test.js
│   └── Dockerfile             # Multi-stage build (node:20-alpine -> nginx:alpine)
└── deployments/
    └── docker-compose.yml     # Orkestrasi PostgreSQL 16, Redis 7, Backend, & Frontend
```

## Prasyarat

- **Node.js** v20+ dan **npm** v10+
- **Docker** dan **Docker Compose** (untuk menjalankan PostgreSQL, Redis, atau build container penuh)

## Menjalankan Tes Lokal

### 1. Backend (Unit, Integration, & Coverage Quality Gate)

Seluruh test suite backend menggunakan `vi.mock` untuk layer `db.js` dan `redis.js` sehingga dapat dijalankan secara terisolasi tanpa koneksi database maupun Redis aktif.

```bash
cd backend
npm ci
npm test
npm run test:coverage
```

Konfigurasi Vitest (`backend/vitest.config.js`) menerapkan Quality Gate minimal:
- **Lines**: `70%`
- **Functions**: `70%`
- **Branches**: `65%`
- **Statements**: `70%`

Laporan cakupan kode dihasilkan pada direktori `backend/coverage/` (`text`, `html`, dan `lcov`).

### 2. Frontend (Unit Test & Production Build)

```bash
cd frontend
npm ci
npm test
npm run build
```

Hasil build statis akan tersimpan di `frontend/dist/`.

## Menjalankan Layanan & Migrasi Database Lokal

Anda dapat menjalankan seluruh stack menggunakan Docker Compose:

```bash
docker compose -f deployments/docker-compose.yml build
docker compose -f deployments/docker-compose.yml up -d postgres redis
```

Setelah PostgreSQL siap, jalankan migrasi tabel `reservations`:

```bash
cd backend
DB_HOST=localhost DB_PORT=5432 DB_USER=devops DB_PASSWORD=devops_secret DB_NAME=tickets_ci npm run db:migrate
```

Untuk menjalankan seluruh container (termasuk `backend` dan `frontend`):

```bash
docker compose -f deployments/docker-compose.yml up --build
```

- **Backend API**: `http://localhost:3000/healthz`
- **Frontend UI**: `http://localhost:8080`

## Skenario Demonstrasi Live (Quality Gate Failure)

1. Pada kondisi awal, `npm run test:coverage` di `backend/` memiliki cakupan global sekitar **85%** dan lulus Quality Gate (`>= 70%`).
2. Tambahkan satu modul baru di `backend/src/services/` (sekitar ~45 baris kode, misalnya modul export/invoice helper) **tanpa** menambahkan unit test.
3. Jalankan kembali `npm run test:coverage` atau push ke branch PR — Vitest V8 Coverage akan mencatat penurunan cakupan global ke bawah **70%** sehingga pipeline CI gagal otomatis pada tahap Quality Gate.
