-- =====================================================================
-- StudyWork Planner - PostgreSQL Database DDL (Data Definition Language)
-- Spesifikasi: SKPL-001-SWP-2025
--
-- Petunjuk Eksekusi via GUI Database Tool (pgAdmin):
-- 1. Buka aplikasi pgAdmin dan hubungkan ke server PostgreSQL Anda.
-- 2. Buat database baru bernama "studywork_db" (Klik kanan Databases -> Create -> Database...).
-- 3. Klik kanan database "studywork_db" -> pilih "Query Tool".
-- 4. Buka file ddl.sql ini (Open File / Ctrl+O) atau Copy-Paste seluruh isinya.
-- 5. Klik icon "Execute" (tombol Play) atau tekan F5 untuk membuat struktur tabel & indeks.
-- =====================================================================

-- Aktifkan ekstensi pgcrypto untuk gen_random_uuid() & hashing password
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABEL USERS (Pengguna & Hak Akses)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'mahasiswa' CHECK (role IN ('mahasiswa', 'superadmin')),
    daily_capacity_hours NUMERIC(4, 1) NOT NULL DEFAULT 8.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL CATEGORIES (Kategori Kuliah & Pribadi)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    type VARCHAR(50) NOT NULL DEFAULT 'kuliah' CHECK (type IN ('kuliah', 'pribadi')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL TASKS (Tugas Deadline, Fixed-time, Routine)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('fixed', 'deadline', 'routine')),
    status VARCHAR(50) NOT NULL DEFAULT 'belum' CHECK (status IN ('belum', 'sedang', 'selesai')),
    importance INT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    difficulty INT NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    deadline TIMESTAMP WITH TIME ZONE,
    estimated_duration_hours NUMERIC(5, 2) DEFAULT 1.0,
    routine_time VARCHAR(10),
    routine_days INT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL MOODS (Log Mood Harian Mahasiswa)
CREATE TABLE IF NOT EXISTS moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INT NOT NULL CHECK (level BETWEEN 1 AND 5),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEKS KINERJA & OPTIMASI QUERY
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_logged_at ON moods(logged_at);
