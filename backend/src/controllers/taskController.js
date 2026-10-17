const db = require('../config/db');
const { calculatePriority, sortTasks, getDurationHours, getEventTime } = require('../engines/priorityEngine');
const { checkConflicts, suggestSlot } = require('../engines/conflictEngine');

async function getTasks(req, res) {
  try {
    const { scope, status, priority, sort, q } = req.query;

    let query = `
      SELECT t.*, c.name AS category_name, c.color AS category_color, c.type AS category_type 
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params = [req.user.id];

    if (scope) {
      params.push(scope);
      query += ` AND COALESCE(c.type, 'kuliah') = $${params.length}`;
    }

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }

    if (q && q.trim()) {
      params.push(`%${q.trim()}%`);
      query += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }

    const result = await db.query(query, params);
    const now = Date.now();

    // Enrich tasks with live priority calculation
    let enriched = result.rows.map((task) => {
      const p = calculatePriority(task, now);
      return {
        ...task,
        priority_score: p.score,
        priority_label: p.label,
        calculated_urgency: p.urgency,
        duration_hours: getDurationHours(task),
        event_time: getEventTime(task, now)
      };
    });

    // Filter by priority label if requested
    if (priority && priority !== 'all') {
      enriched = enriched.filter((t) => t.priority_label === priority.toUpperCase());
    }

    // Sort tasks
    const sorted = sortTasks(enriched, sort || 'priority', now);

    return res.json({ success: true, tasks: sorted });
  } catch (error) {
    console.error('GetTasks error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar tugas' });
  }
}

async function getDashboardStats(req, res) {
  try {
    const userRes = await db.query('SELECT daily_capacity_hours FROM users WHERE id = $1', [req.user.id]);
    const capacity = Number(userRes.rows[0]?.daily_capacity_hours) || 8.0;

    const query = `
      SELECT t.*, c.name AS category_name, c.color AS category_color, c.type AS category_type 
      FROM tasks t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const result = await db.query(query, [req.user.id]);
    const now = Date.now();

    const allTasks = result.rows.map((task) => {
      const p = calculatePriority(task, now);
      return {
        ...task,
        priority_score: p.score,
        priority_label: p.label,
        duration_hours: getDurationHours(task),
        event_time: getEventTime(task, now)
      };
    });

    const activeTasks = allTasks.filter((x) => x.status !== 'selesai');
    const completedTasks = allTasks.filter((x) => x.status === 'selesai');

    const totalHours = activeTasks.reduce((acc, t) => acc + t.duration_hours, 0);
    const highPriorityCount = activeTasks.filter(
      (t) => t.priority_label === 'TOP' || t.priority_label === 'HIGH'
    ).length;

    // 4 Nearest upcoming tasks
    const nearestTasks = activeTasks
      .filter((t) => t.event_time != null)
      .sort((a, b) => a.event_time - b.event_time)
      .slice(0, 4);

    return res.json({
      success: true,
      stats: {
        totalTasks: allTasks.length,
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        totalWorkHours: Math.round(totalHours * 10) / 10,
        highPriorityCount,
        dailyCapacity: capacity
      },
      nearestTasks
    });
  } catch (error) {
    console.error('GetDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data statistik dashboard' });
  }
}

async function createTask(req, res) {
  try {
    const {
      title,
      description,
      type,
      category_id,
      importance,
      difficulty,
      start_time,
      end_time,
      deadline,
      estimated_duration_hours,
      routine_time,
      routine_days,
      force // If true, ignores conflict warnings
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Judul tugas wajib diisi' });
    }
    if (!['fixed', 'deadline', 'routine'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipe tugas tidak valid (harus fixed, deadline, atau routine)' });
    }

    if (type === 'fixed') {
      if (!start_time || !end_time) {
        return res.status(400).json({ success: false, message: 'Waktu mulai dan waktu selesai wajib diisi untuk fixed-time' });
      }
      if (new Date(end_time).getTime() <= new Date(start_time).getTime()) {
        return res.status(400).json({ success: false, message: 'Waktu selesai harus lebih besar dari waktu mulai' });
      }
    } else if (type === 'deadline') {
      if (!deadline) {
        return res.status(400).json({ success: false, message: 'Batas waktu (deadline) wajib diisi' });
      }
    } else if (type === 'routine') {
      if (!routine_time || !routine_days || routine_days.length === 0) {
        return res.status(400).json({ success: false, message: 'Jam mulai rutin dan minimal 1 hari wajib dipilih' });
      }
    }

    // Prepare candidate task object for conflict checking
    const candidate = {
      id: 'temp-id',
      type,
      start_time,
      end_time,
      deadline,
      estimated_duration_hours: Number(estimated_duration_hours) || 1.0,
      routine_time,
      routine_days: routine_days || []
    };

    // Get existing tasks to test for conflicts
    const userRes = await db.query('SELECT daily_capacity_hours FROM users WHERE id = $1', [req.user.id]);
    const capacity = Number(userRes.rows[0]?.daily_capacity_hours) || 8.0;

    const existingRes = await db.query('SELECT * FROM tasks WHERE user_id = $1 AND status != $2', [req.user.id, 'selesai']);
    const conflictResult = checkConflicts(candidate, existingRes.rows, capacity);

    if (conflictResult.hasConflict && !force) {
      const suggestion = suggestSlot(candidate, existingRes.rows);
      return res.status(409).json({
        success: false,
        conflictDetected: true,
        message: 'Konflik jadwal terdeteksi',
        conflicts: conflictResult,
        suggestion
      });
    }

    const insertRes = await db.query(
      `INSERT INTO tasks (
        user_id, category_id, title, description, type, status,
        importance, difficulty, start_time, end_time, deadline,
        estimated_duration_hours, routine_time, routine_days
      ) VALUES ($1, $2, $3, $4, $5, 'belum', $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        req.user.id,
        category_id || null,
        title.trim(),
        description || null,
        type,
        Number(importance) || 3,
        Number(difficulty) || 3,
        start_time ? new Date(start_time) : null,
        end_time ? new Date(end_time) : null,
        deadline ? new Date(deadline) : null,
        Number(estimated_duration_hours) || 1.0,
        routine_time || null,
        routine_days || null
      ]
    );

    const createdTask = insertRes.rows[0];
    const priority = calculatePriority(createdTask);

    return res.status(201).json({
      success: true,
      message: 'Tugas berhasil ditambahkan',
      task: {
        ...createdTask,
        priority_score: priority.score,
        priority_label: priority.label
      }
    });
  } catch (error) {
    console.error('CreateTask error:', error);
    return res.status(500).json({ success: false, message: 'Gagal membuat tugas baru' });
  }
}

async function updateTask(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      category_id,
      importance,
      difficulty,
      status,
      start_time,
      end_time,
      deadline,
      estimated_duration_hours,
      routine_time,
      routine_days,
      force
    } = req.body;

    const check = await db.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    }

    const existingTask = check.rows[0];
    const candidate = {
      ...existingTask,
      type: type || existingTask.type,
      start_time: start_time || existingTask.start_time,
      end_time: end_time || existingTask.end_time,
      deadline: deadline || existingTask.deadline,
      estimated_duration_hours: estimated_duration_hours ?? existingTask.estimated_duration_hours,
      routine_time: routine_time || existingTask.routine_time,
      routine_days: routine_days || existingTask.routine_days
    };

    if (!force) {
      const userRes = await db.query('SELECT daily_capacity_hours FROM users WHERE id = $1', [req.user.id]);
      const capacity = Number(userRes.rows[0]?.daily_capacity_hours) || 8.0;

      const otherTasksRes = await db.query(
        'SELECT * FROM tasks WHERE user_id = $1 AND id != $2 AND status != $3',
        [req.user.id, id, 'selesai']
      );

      const conflictResult = checkConflicts(candidate, otherTasksRes.rows, capacity);
      if (conflictResult.hasConflict) {
        const suggestion = suggestSlot(candidate, otherTasksRes.rows);
        return res.status(409).json({
          success: false,
          conflictDetected: true,
          message: 'Konflik jadwal terdeteksi pada pembaruan tugas',
          conflicts: conflictResult,
          suggestion
        });
      }
    }

    const updateRes = await db.query(
      `UPDATE tasks SET
        title = $1,
        description = $2,
        type = $3,
        category_id = $4,
        importance = $5,
        difficulty = $6,
        status = $7,
        start_time = $8,
        end_time = $9,
        deadline = $10,
        estimated_duration_hours = $11,
        routine_time = $12,
        routine_days = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14 AND user_id = $15
      RETURNING *`,
      [
        title ? title.trim() : existingTask.title,
        description !== undefined ? description : existingTask.description,
        type || existingTask.type,
        category_id !== undefined ? category_id : existingTask.category_id,
        importance ? Number(importance) : existingTask.importance,
        difficulty ? Number(difficulty) : existingTask.difficulty,
        status || existingTask.status,
        start_time ? new Date(start_time) : existingTask.start_time,
        end_time ? new Date(end_time) : existingTask.end_time,
        deadline ? new Date(deadline) : existingTask.deadline,
        estimated_duration_hours !== undefined ? Number(estimated_duration_hours) : existingTask.estimated_duration_hours,
        routine_time || existingTask.routine_time,
        routine_days || existingTask.routine_days,
        id,
        req.user.id
      ]
    );

    const updatedTask = updateRes.rows[0];
    const priority = calculatePriority(updatedTask);

    return res.json({
      success: true,
      message: 'Perubahan tugas berhasil disimpan',
      task: {
        ...updatedTask,
        priority_score: priority.score,
        priority_label: priority.label
      }
    });
  } catch (error) {
    console.error('UpdateTask error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui tugas' });
  }
}

async function toggleStatus(req, res) {
  try {
    const { id } = req.params;
    const check = await db.query('SELECT status FROM tasks WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    }

    const currentStatus = check.rows[0].status;
    const newStatus = currentStatus === 'selesai' ? 'belum' : 'selesai';

    const result = await db.query(
      'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [newStatus, id, req.user.id]
    );

    return res.json({
      success: true,
      message: newStatus === 'selesai' ? 'Tugas ditandai selesai!' : 'Tugas diaktifkan kembali.',
      task: result.rows[0]
    });
  } catch (error) {
    console.error('ToggleStatus error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengubah status tugas' });
  }
}

async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id', [id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Tugas tidak ditemukan' });
    }

    return res.json({ success: true, message: 'Tugas berhasil dihapus' });
  } catch (error) {
    console.error('DeleteTask error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menghapus tugas' });
  }
}

module.exports = {
  getTasks,
  getDashboardStats,
  createTask,
  updateTask,
  toggleStatus,
  deleteTask
};
