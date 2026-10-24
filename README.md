# 🎓 StudyWork Planner — Full-Stack (React.js + PostgreSQL)

Aplikasi manajemen tugas dan produktivitas cerdas untuk mahasiswa dengan beban tugas tinggi, hasil *reverse engineering* dari spesifikasi resmi **`SKPL-001-SWP-2025`** (Program Studi S1 Informatika, Fakultas Informatika, Universitas Telkom).

Project ini mentransformasikan versi hybrid lama (*WebView + LocalStorage*) menjadi arsitektur **Modern Client-Server Full-Stack**:
* **Frontend:** **React 18** (Vite SPA) + Mobile-first UI Design System + Lucide Icons.
* **Backend API:** **Node.js** + **Express.js** + JWT Authentication + Bcrypt.
* **Database:** **PostgreSQL** (Dikelola & diinisialisasi melalui GUI Database Tool **pgAdmin**).
* **Core Engines:**
  - 🧮 **Priority Engine (FR-02):** Perhitungan prioritas otomatis berbasis rumus $Urgency \times Impact \times DifficultyModifier$ dengan klasifikasi `TOP`, `HIGH`, `MEDIUM`, `LOW`.
  - ⚠️ **Conflict & Buffer Detection (FR-04):** Deteksi tabrakan waktu, peringatan jeda istirahat $< 30$ menit, peringatan *overcommitment* ($> 8$ jam/hari), dan generator slot waktu saran otomatis.
  - 🧠 **AI & Mood Adaptive Recommendation (FR-06 & FR-08):** Penyelarasan kompleksitas tugas dengan tingkat energi mood harian serta saran penundaan tugas berat dan *self-care*.
  - 🛡️ **SuperAdmin Panel (FR-11):** Manajemen pengguna lengkap dengan *cascading delete*.

---

## 📂 Struktur Direktori Proyek

```text
swp-fullstack/
├── README.md                       # Dokumentasi dan panduan pengujian
│
├── backend/                        # Server REST API & Core Engines
│   ├── package.json
│   ├── .env.example                # Template konfigurasi environment (koneksi pgAdmin)
│   ├── .env
│   ├── src/
│   │   ├── server.js               # Entry point Express
│   │   ├── config/
│   │   │   └── db.js               # Pool koneksi PostgreSQL & status checker
│   │   ├── db/
│   │   │   ├── ddl.sql             # DDL tabel, constraint, & indeks (Eksekusi di pgAdmin)
│   │   │   └── dml.sql             # DML data awal SuperAdmin & kategori (Eksekusi di pgAdmin)
│   │   ├── engines/                # Porting logika matematika SKPL
│   │   │   ├── priorityEngine.js   # Priority calculation & sorting
│   │   │   ├── conflictEngine.js   # Conflict, buffer, & slot suggestion
│   │   │   └── recommendationEngine.js # AI mood match & self-care
│   │   ├── middleware/
│   │   │   └── authMiddleware.js   # Verifikasi JWT & proteksi role
│   │   ├── controllers/            # Controller auth, tasks, categories, moods, admin
│   │   └── routes/                 # Endpoint RESTful API
│   └── tests/
│       └── engine.test.js          # Unit testing otomatis algoritma inti
│
└── frontend/                       # Client Single Page Application (React)
    ├── package.json
    ├── vite.config.js              # Vite config dengan reverse proxy API
    ├── index.html
    └── src/
        ├── main.jsx                # React DOM mount
        ├── App.jsx                 # Main layout & router state
        ├── index.css               # Design system & mobile-first styling
        ├── api/
        │   └── client.js           # API client service layer
        ├── context/
        │   └── AuthContext.jsx     # Global user authentication state
        ├── components/             # Topbar, BottomNav, Drawer, TaskCard, TaskModal, dll.
        └── pages/                  # UISW01 s.d. UISW08 (Login, Dashboard, Kuliah, AI, Admin, dll.)
```

---

## ⚙️ Prasyarat Sistem (Prerequisites)

Pastikan telah terpasang:
1. **Node.js** versi **v18+** atau **v20+** (Cek dengan: `node -v`)
2. **NPM** versi **v9+** atau **v10+** (Cek dengan: `npm -v`)
3. **PostgreSQL Server & pgAdmin** (GUI Database Tool resmi PostgreSQL)

> [!IMPORTANT]
> **Tips Windows & Google Drive:**  
> Jika folder proyek Anda berada di dalam drive virtual Google Drive (`H:\My Drive\...`), perintah `npm install` dapat memicu error `EBADF / EBUSY` karena proses sinkronisasi Google Drive mengunci ribuan file kecil di dalam `node_modules`.  
> **Solusi Terbaik:** Gunakan proyek di drive lokal fisik seperti **`C:\StudiWorkPlanner\swp-fullstack`**. Di drive lokal, `npm install` dan hot-reload Vite berjalan secepat kilat tanpa konflik file locking!

---

## 🤝 Panduan Kolaborasi & Menjalankan di Mesin Lain (Clone & Run Guide)

### 📋 Checklist Setup Mesin Baru
- [ ] Git, Node.js (v18+) dan PostgreSQL + pgAdmin sudah terpasang.
- [ ] Repository sudah di-clone ke drive lokal (hindari network/cloud drive).
- [ ] Database `studywork_db` sudah dibuat di pgAdmin.
- [ ] DDL (`backend/src/db/ddl.sql`) dan DML (`backend/src/db/dml.sql`) sudah dieksekusi di pgAdmin.
- [ ] File `backend/.env` sudah disiapkan dan dicocokkan dengan kredensial pgAdmin.
- [ ] Dependensi backend & frontend sudah di-install (`npm install`).
- [ ] Backend dan Frontend sudah berjalan (`npm run dev`).

---

### ⚡ Langkah Cepat (Quickstart untuk Rekan Tim)

#### 1. Clone Repository ke Komputer Lokal
```bash
git clone <URL_REPOSITORY_GITHUB>
cd swp-fullstack
```

#### 2. Buat Database & Eksekusi DDL & DML di pgAdmin
1. Buka aplikasi **pgAdmin**.
2. Di panel kiri, klik kanan pada **Databases** $\rightarrow$ pilih **Create** $\rightarrow$ **Database...**.
3. Beri nama: **`studywork_db`** lalu klik **Save**.
4. Klik kanan database **`studywork_db`** $\rightarrow$ pilih **Query Tool**.
5. Buka file **`backend/src/db/ddl.sql`** (Ctrl + O) $\rightarrow$ klik icon **Execute** (atau tekan **F5**) untuk membuat tabel & indeks.
6. Buka file **`backend/src/db/dml.sql`** (Ctrl + O) $\rightarrow$ klik icon **Execute** (atau tekan **F5**) untuk mengisi data awal.

#### 3. Siapkan File Konfigurasi Environment (`backend/.env`)
Salin template environment untuk backend:
* **Windows (PowerShell / Command Prompt):**
  ```powershell
  copy backend\.env.example backend\.env
  ```
* **macOS / Linux / Git Bash:**
  ```bash
  cp backend/.env.example backend/.env
  ```

Buka file `backend/.env` dan pastikan URL koneksi sesuai dengan password dan port PostgreSQL di pgAdmin:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:<PASSWORD_PGADMIN>@localhost:5432/studywork_db
JWT_SECRET=studywork_super_secret_jwt_key_2025
JWT_EXPIRES_IN=7d
```

#### 4. Jalankan Backend API Server
Buka terminal dan jalankan:
```bash
cd backend
npm install
npm run dev
```
Backend akan aktif di: **`http://localhost:5000`**

#### 5. Jalankan Frontend React
Buka tab terminal baru dan jalankan:
```bash
cd frontend
npm install
npm run dev
```
Frontend akan aktif di: **`http://localhost:3000`**

#### 6. Buka di Browser
Akses **`http://localhost:3000`** dan login menggunakan:
* **Email:** `admin@studywork.id`
* **Password:** `admin123`

---

## 🧪 Panduan Cara Pengujian di Lokal (QA & Testing)

### 1. Menjalankan Automated Unit Tests (Algoritma & Matematika)
Proyek ini dilengkapi dengan unit test otomatis untuk menguji kebenaran algoritma perhitungan matematis SKPL:

Buka terminal di folder `backend` dan jalankan:
```powershell
npm test
```

**Skenario yang diuji secara otomatis:**
* ✅ **Boundary Value Analysis (BVA) Rumus Prioritas:** Memvalidasi ambang batas label `TOP` ($\ge 36$), `HIGH` ($\ge 24$), `MEDIUM` ($\ge 12$), dan `LOW` ($< 12$).
* ✅ **Difficulty Modifier Mapping:** Memvalidasi pengali kesulitan (1–5 dipetakan tepat ke 0.8–1.2).
* ✅ **Collision Overlap Test:** Memastikan sistem mendeteksi saat 2 tugas bertabrakan jam.
* ✅ **Buffer Jeda Istirahat:** Memastikan sistem memicu peringatan jika jeda antar tugas $< 30$ menit.
* ✅ **Smart Reschedule Slot:** Memastikan algoritma otomatis mengusulkan slot kosong berikutnya.
* ✅ **AI Mood Recommendation:** Memastikan penundaan tugas berat disarankan saat mood drop (level 1 atau 2).

---

### 2. Pengujian Fungsional di Browser (`http://localhost:3000`)

Buka browser dan aktifkan **Mobile Device Toolbar** (`F12` $\rightarrow$ `Ctrl + Shift + M` $\rightarrow$ pilih **Pixel 7** atau **iPhone 14**):

| Modul / Fitur | Cara Menguji di Antarmuka | Hasil yang Diharapkan |
| :--- | :--- | :--- |
| **Login & Auth (FR-09)** | Masuk dengan `admin@studywork.id` / `admin123`. | Berhasil masuk ke Dashboard, token JWT tersimpan, dan avatar profil menampilkan "SA". |
| **Tambah Tugas (FR-01)** | Klik tombol `+` di kanan bawah $\rightarrow$ isi tugas tipe *Deadline* dengan kesulitan 5 dan kepentingan 5. | Tugas tersimpan ke database PostgreSQL, label prioritas otomatis terhitung `TOP`. |
| **Uji Konflik Jadwal (FR-04)** | Buat tugas *Fixed-time* (misal: 10:00 - 12:00), lalu buat tugas lain pada jam 11:00 - 13:00. | Muncul modal peringatan bentrok jadwal beserta tombol **"Pakai Slot Saran"** atau **"Tetap Simpan"**. |
| **Uji Buffer Waktu (FR-04.2)** | Buat tugas yang selesai pukul 12:00, lalu buat tugas berikutnya mulai pukul 12:15 (jeda 15 menit). | Muncul peringatan bahwa jeda antar tugas kurang dari 30 menit. |
| **Uji Mood & AI (FR-06 & FR-08)** | Buka tab **AI** $\rightarrow$ klik emoji 😢 (Sangat Buruk). | Sistem menampilkan saran self-care/istirahat dan menyarankan menunda tugas-tugas berat yang deadlinenya masih lama. |
| **Kelola Kategori (FR-07)** | Buka tab **Kategori** $\rightarrow$ klik **Tambah** $\rightarrow$ pilih warna ungu dan nama "Praktikum Jaringan". | Kategori baru muncul dengan badge warna dan langsung bisa dipilih di form tambah tugas. |
| **Admin Panel (FR-11)** | Buka Drawer menu samping $\rightarrow$ klik **Admin Panel** $\rightarrow$ tambah user baru atau hapus user demo. | Statistik pengguna ter-update, user baru tersimpan di PostgreSQL. Saat user dihapus, data tugas user tersebut ikut terhapus (*cascading delete*). |
| **Persistensi Data PostgreSQL** | Buka aplikasi database (DBeaver / pgAdmin), periksa tabel `tasks` dan `users`. | Seluruh data yang diinput dari web React tersimpan rapi di dalam tabel PostgreSQL secara persisten. |

---

## 📡 Dokumentasi Endpoint REST API

| Method | Endpoint | Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Publik | Registrasi akun mahasiswa baru |
| `POST` | `/api/auth/login` | Publik | Autentikasi & generate token JWT |
| `GET` | `/api/auth/me` | User | Mengambil data profil user yang sedang login |
| `GET` | `/api/tasks` | User | Mengambil daftar tugas (filter: scope, status, priority, sort, search) |
| `GET` | `/api/tasks/dashboard-stats` | User | Mengambil statistik 4 kartu metrik & 4 tugas terdekat |
| `POST` | `/api/tasks` | User | Menambah tugas baru (lengkap dengan conflict check) |
| `PUT` | `/api/tasks/:id` | User | Memperbarui detail tugas |
| `PATCH`| `/api/tasks/:id/toggle-status` | User | Mengubah status tugas (belum $\leftrightarrow$ selesai) |
| `DELETE`| `/api/tasks/:id` | User | Menghapus tugas |
| `GET` | `/api/categories` | User | Mengambil daftar kategori tugas |
| `POST` | `/api/categories` | User | Menambah kategori tugas baru |
| `PUT` | `/api/categories/:id` | User | Mengubah nama/warna/tipe kategori |
| `DELETE`| `/api/categories/:id` | User | Menghapus kategori |
| `GET` | `/api/moods/latest` | User | Mengambil log mood terakhir hari ini |
| `POST` | `/api/moods/log` | User | Mencatat level mood harian (skala 1–5) |
| `GET` | `/api/moods/recommendations` | User | Mengambil rekomendasi tugas adaptif & saran self-care |
| `GET` | `/api/admin/users` | SuperAdmin | Mengambil semua user beserta total tugas |
| `POST` | `/api/admin/users` | SuperAdmin | Menambah user baru oleh SuperAdmin |
| `PUT` | `/api/admin/users/:id` | SuperAdmin | Mengubah data user |
| `DELETE`| `/api/admin/users/:id` | SuperAdmin | Menghapus user (*cascading delete* ke seluruh data terkait) |
