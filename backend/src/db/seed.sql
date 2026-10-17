-- =====================================================================
-- StudyWork Planner — PostgreSQL Database Initial Seed
-- Default SuperAdmin Account: admin@studywork.id / admin123
-- =====================================================================

DO $$
DECLARE
    admin_id UUID;
BEGIN
    -- Check if SuperAdmin already exists
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

        -- Insert Default Categories for SuperAdmin
        INSERT INTO categories (user_id, name, color, type) VALUES
        (admin_id, 'Quiz', '#EF4444', 'kuliah'),
        (admin_id, 'Assessment', '#8B5CF6', 'kuliah'),
        (admin_id, 'Tugas Harian', '#3B82F6', 'kuliah'),
        (admin_id, 'Praktikum', '#0EA5E9', 'kuliah'),
        (admin_id, 'Olahraga', '#22C55E', 'pribadi'),
        (admin_id, 'Pekerjaan', '#F59E0B', 'pribadi'),
        (admin_id, 'Keluarga', '#EC4899', 'pribadi');

        RAISE NOTICE 'SuperAdmin and default categories seeded successfully.';
    END IF;
END $$;
