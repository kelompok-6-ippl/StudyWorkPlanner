const db = require('../config/db');
const { MOODS, generateRecommendations } = require('../engines/recommendationEngine');

async function getLatestMood(req, res) {
  try {
    const result = await db.query(
      `SELECT * FROM moods 
       WHERE user_id = $1 
       ORDER BY logged_at DESC 
       LIMIT 1`,
      [req.user.id]
    );

    const latest = result.rows[0] || null;
    return res.json({
      success: true,
      latestMood: latest ? latest.level : null,
      details: latest
    });
  } catch (error) {
    console.error('GetLatestMood error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data mood harian' });
  }
}

async function logMood(req, res) {
  try {
    const { level } = req.body;
    const moodLevel = Number(level);

    if (isNaN(moodLevel) || moodLevel < 1 || moodLevel > 5) {
      return res.status(400).json({ success: false, message: 'Skala mood level harus bernilai 1 sampai 5' });
    }

    const result = await db.query(
      'INSERT INTO moods (user_id, level) VALUES ($1, $2) RETURNING *',
      [req.user.id, moodLevel]
    );

    return res.status(201).json({
      success: true,
      message: 'Mood level berhasil dicatat',
      mood: result.rows[0]
    });
  } catch (error) {
    console.error('LogMood error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mencatat mood harian' });
  }
}

async function getRecommendations(req, res) {
  try {
    const moodRes = await db.query(
      'SELECT level FROM moods WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 1',
      [req.user.id]
    );
    const moodLevel = moodRes.rows[0]?.level || 3; // Default neutral if not logged yet

    const tasksRes = await db.query(
      `SELECT t.*, c.name AS category_name, c.color AS category_color, c.type AS category_type 
       FROM tasks t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND t.status != 'selesai'`,
      [req.user.id]
    );

    const recommendations = generateRecommendations(moodLevel, tasksRes.rows);

    return res.json({
      success: true,
      ...recommendations,
      allMoods: MOODS
    });
  } catch (error) {
    console.error('GetRecommendations error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memproses rekomendasi cerdas' });
  }
}

module.exports = {
  getLatestMood,
  logMood,
  getRecommendations
};
