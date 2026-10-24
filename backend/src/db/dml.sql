-- =====================================================================
-- StudyWork Planner - PostgreSQL Database DML (Data Manipulation Language)
-- Initial Seed & Sample Data
--
-- Petunjuk Eksekusi via GUI Database Tool (pgAdmin):
-- 1. Pastikan ddl.sql sudah dieksekusi terlebih dahulu.
-- 2. Di pgAdmin, pada Query Tool database "studywork_db":
-- 3. Buka file dml.sql ini (Open File / Ctrl+O) atau Copy-Paste seluruh isinya.
-- 4. Klik icon "Execute" (tombol Play) atau tekan F5 untuk mengisi data awal.
-- =====================================================================

DO $$
DECLARE
    admin_id UUID;
    student_id UUID;
    cat_quiz UUID;
    cat_tugas UUID;
    cat_praktikum UUID;
BEGIN
    -- 1. AKUN SUPERADMIN (admin@studywork.id / admin123)
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@studywork.id') THEN
        INSERT INTO users (name, email, password_hash, role, daily_capacity_hours)
        VALUES (
            'Super Admin',
            'admin@studywork.id',
            -- Uses pgcrypto bcrypt hash for 'admin123'
            crypt('admin123', gen_salt('bf', 8)),
            'superadmin',
            8.0
        ) RETURNING id INTO admin_id;

        -- Kategori bawaan SuperAdmin
        INSERT INTO categories (user_id, name, color, type) VALUES
        (admin_id, 'Quiz', '#EF4444', 'kuliah'),
        (admin_id, 'Assessment', '#8B5CF6', 'kuliah'),
        (admin_id, 'Tugas Harian', '#3B82F6', 'kuliah'),
        (admin_id, 'Praktikum', '#0EA5E9', 'kuliah'),
        (admin_id, 'Olahraga', '#22C55E', 'pribadi'),
        (admin_id, 'Pekerjaan', '#F59E0B', 'pribadi'),
        (admin_id, 'Keluarga', '#EC4899', 'pribadi');

        RAISE NOTICE 'Akun SuperAdmin dan kategori default berhasil di-seed.';
    END IF;

    -- 2. AKUN MAHASISWA DEMO (demo@studywork.id / demo123)
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'demo@studywork.id') THEN
        INSERT INTO users (name, email, password_hash, role, daily_capacity_hours)
        VALUES (
            'Mahasiswa Demo',
            'demo@studywork.id',
            crypt('demo123', gen_salt('bf', 8)),
            'mahasiswa',
            8.0
        ) RETURNING id INTO student_id;

        -- Kategori Mahasiswa Demo
        INSERT INTO categories (user_id, name, color, type) VALUES
        (student_id, 'Tugas Besar', '#EF4444', 'kuliah') RETURNING id INTO cat_quiz;
        INSERT INTO categories (user_id, name, color, type) VALUES
        (student_id, 'Kuliah Teori', '#3B82F6', 'kuliah') RETURNING id INTO cat_tugas;
        INSERT INTO categories (user_id, name, color, type) VALUES
        (student_id, 'Praktikum Lab', '#10B981', 'kuliah') RETURNING id INTO cat_praktikum;

        -- Sample Tasks untuk Mahasiswa Demo
        INSERT INTO tasks (user_id, category_id, title, description, type, status, importance, difficulty, deadline, estimated_duration_hours)
        VALUES
        (student_id, cat_quiz, 'Tubes Implementasi & Pengujian PL', 'Implementasi sistem fullstack React + PostgreSQL', 'deadline', 'belum', 5, 5, CURRENT_TIMESTAMP + INTERVAL '2 days', 4.0),
        (student_id, cat_tugas, 'Review Materi Algoritma Prioritas', 'Mempelajari rumus Urgency x Impact x Difficulty', 'deadline', 'belum', 4, 3, CURRENT_TIMESTAMP + INTERVAL '4 days', 2.0);

        -- Sample Mood Log
        INSERT INTO moods (user_id, level, logged_at)
        VALUES (student_id, 4, CURRENT_TIMESTAMP);

        RAISE NOTICE 'Akun Mahasiswa Demo dan data contoh berhasil di-seed.';
    END IF;
END $$;
