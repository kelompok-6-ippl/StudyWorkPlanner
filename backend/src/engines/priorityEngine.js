// =====================================================================
// PRIORITY ENGINE (FR-02, SKPL 4.5.2-A)
// Formula: Priority = Urgency × Impact (1-5) × DifficultyModifier (0.8-1.2)
// Urgency fixed-time = 10 − hours_until_start / 24
// Urgency deadline   = 10 − (hours_until_deadline − duration) / 24
// Range: Clamped between 1 and 10
// Labels: TOP >= 36, HIGH >= 24, MEDIUM >= 12, LOW < 12
// =====================================================================

const H = 3600000; // 1 hour in ms

function getEventTime(task, now = Date.now()) {
  if (task.type === 'fixed') {
    return task.start_time ? new Date(task.start_time).getTime() : null;
  }
  if (task.type === 'deadline') {
    return task.deadline ? new Date(task.deadline).getTime() : null;
  }
  if (task.type === 'routine' && task.routine_days && task.routine_time) {
    const [hh, mm] = task.routine_time.split(':').map(Number);
    const dur = (Number(task.estimated_duration_hours) || 1) * H;
    for (let i = 0; i < 8; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      d.setHours(hh, mm, 0, 0);
      const dow = (d.getDay() + 6) % 7; // 0 = Senin, 6 = Minggu
      if (task.routine_days.includes(dow) && d.getTime() + dur > now) {
        return d.getTime();
      }
    }
  }
  return null;
}

function getDurationHours(task) {
  if (task.type === 'fixed' && task.start_time && task.end_time) {
    const diff = (new Date(task.end_time).getTime() - new Date(task.start_time).getTime()) / H;
    return Math.max(0, diff);
  }
  return Number(task.estimated_duration_hours) || 0;
}

function calculateUrgency(task, now = Date.now()) {
  const ev = getEventTime(task, now);
  if (ev == null) return 1;

  const h = (ev - now) / H;
  let u;

  if (task.type === 'deadline') {
    u = 10 - (h - getDurationHours(task)) / 24;
  } else {
    // For fixed task that has passed
    if (task.type === 'fixed' && task.end_time && new Date(task.end_time).getTime() < now) {
      return 1;
    }
    u = 10 - h / 24;
  }

  return Math.min(10, Math.max(1, u));
}

function calculateDifficultyModifier(difficulty) {
  const d = Number(difficulty) || 3;
  return Math.round((0.8 + (d - 1) * 0.1) * 10) / 10; // 0.8 to 1.2
}

function calculatePriority(task, now = Date.now()) {
  const urgency = calculateUrgency(task, now);
  const impact = Number(task.importance) || 3;
  const diffMod = calculateDifficultyModifier(task.difficulty);

  const rawScore = urgency * impact * diffMod;
  const score = Math.round(rawScore * 10) / 10;

  let label;
  if (score >= 36) label = 'TOP';
  else if (score >= 24) label = 'HIGH';
  else if (score >= 12) label = 'MEDIUM';
  else label = 'LOW';

  return {
    score,
    label,
    urgency: Math.round(urgency * 10) / 10,
    diffMod: Math.round(diffMod * 10) / 10
  };
}

function isHighPriority(task, now = Date.now()) {
  const { label } = calculatePriority(task, now);
  return label === 'TOP' || label === 'HIGH';
}

function sortTasks(tasks, mode = 'priority', now = Date.now()) {
  const done = (x) => (x.status === 'selesai' ? 1 : 0);

  return [...tasks].sort((a, b) => {
    // Finished tasks always at bottom
    if (done(a) !== done(b)) return done(a) - done(b);

    if (mode === 'deadline') {
      const timeA = getEventTime(a, now) || Infinity;
      const timeB = getEventTime(b, now) || Infinity;
      return timeA - timeB;
    }

    if (mode === 'newest') {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    }

    // Default: by priority score descending
    const pA = calculatePriority(a, now).score;
    const pB = calculatePriority(b, now).score;
    return pB - pA;
  });
}

module.exports = {
  getEventTime,
  getDurationHours,
  calculateUrgency,
  calculateDifficultyModifier,
  calculatePriority,
  isHighPriority,
  sortTasks
};
