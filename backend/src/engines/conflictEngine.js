// =====================================================================
// CONFLICT & BUFFER DETECTION ENGINE (FR-04)
// - Schedule Collision Detection
// - Buffer Warning (< 30 minutes)
// - Daily Overcommitment Warning (> capacity hours/day, default 8h)
// - Smart Slot Suggestion
// =====================================================================

const H = 3600000;
const DAY = 86400000;
const BUFFER_MIN = 30;

function startOfDay(timeMs) {
  const d = new Date(timeMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getTaskIntervals(task, fromTime, toTime) {
  if (task.type === 'fixed') {
    const s = new Date(task.start_time).getTime();
    const e = new Date(task.end_time).getTime();
    return (e > fromTime && s < toTime) ? [[s, e]] : [];
  }

  if (task.type === 'routine' && task.routine_time && task.routine_days) {
    const out = [];
    const [hh, mm] = task.routine_time.split(':').map(Number);
    const dur = (Number(task.estimated_duration_hours) || 1) * H;

    for (let d = startOfDay(fromTime); d < toTime; d += DAY) {
      const x = new Date(d);
      x.setHours(hh, mm, 0, 0);
      const dow = (x.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
      const s = x.getTime();
      const e = s + dur;
      if (task.routine_days.includes(dow) && e > fromTime && s < toTime) {
        out.push([s, e]);
      }
    }
    return out;
  }

  return [];
}

function calculateDayLoad(dayStart, tasks, now = Date.now()) {
  const dayEnd = dayStart + DAY;
  let hrs = 0;

  tasks.forEach((tk) => {
    if (tk.status === 'selesai') return;

    if (tk.type === 'deadline') {
      const today = startOfDay(now);
      const dlTime = new Date(tk.deadline).getTime();
      const lastDay = Math.max(today, startOfDay(dlTime));

      if (dayStart < today || dayStart > lastDay) return;
      const days = Math.round((lastDay - today) / DAY) + 1;
      const dur = Number(tk.estimated_duration_hours) || 0;
      hrs += dur / days;
    } else {
      getTaskIntervals(tk, dayStart, dayEnd).forEach(([s, e]) => {
        hrs += (Math.min(e, dayEnd) - Math.max(s, dayStart)) / H;
      });
    }
  });

  return hrs;
}

function checkConflicts(candidate, existingTasks, userCapacity = 8.0, now = Date.now()) {
  const others = existingTasks.filter(
    (x) => x.id !== candidate.id && x.status !== 'selesai'
  );

  const from = now;
  const to = now + 14 * DAY;
  const mine = getTaskIntervals(candidate, from, to);

  const collisions = [];
  const buffers = [];
  const seen = new Set();

  others.forEach((o) => {
    if (o.type === 'deadline') return;
    const theirs = getTaskIntervals(o, from, to);

    for (const [a1, a2] of mine) {
      for (const [b1, b2] of theirs) {
        // Overlap Collision
        if (a1 < b2 && b1 < a2) {
          if (!seen.has(o.id)) {
            collisions.push({ task: o, at: b1, end: b2 });
            seen.add(o.id);
          }
          return;
        }

        // Buffer Gap Warning
        const gap = a1 >= b2 ? a1 - b2 : b1 - a2;
        if (gap < BUFFER_MIN * 60000 && !seen.has(o.id)) {
          buffers.push({
            task: o,
            gapMinutes: Math.round(gap / 60000),
            at: b1,
            end: b2
          });
          seen.add(o.id);
          return;
        }
      }
    }
  });

  // Overcommitment Detection
  const all = [...others, candidate];
  const days = new Set();

  if (candidate.type === 'deadline') {
    const dlTime = new Date(candidate.deadline).getTime();
    for (
      let d = startOfDay(now);
      d <= Math.max(startOfDay(now()), startOfDay(dlTime)) && days.size < 14;
      d += DAY
    ) {
      days.add(d);
    }
  } else {
    mine.forEach(([s]) => days.add(startOfDay(s)));
  }

  const overload = [];
  Array.from(days).sort().forEach((d) => {
    const h = calculateDayLoad(d, all, now);
    if (h > userCapacity + 1e-6) {
      overload.push({
        dayTimestamp: d,
        dayFormatted: new Date(d).toISOString().split('T')[0],
        loadHours: Math.round(h * 10) / 10,
        capacityHours: userCapacity
      });
    }
  });

  return {
    hasConflict: collisions.length > 0 || buffers.length > 0 || overload.length > 0,
    collisions,
    buffers,
    overload: overload.slice(0, 3)
  };
}

function suggestSlot(candidate, existingTasks, now = Date.now()) {
  if (candidate.type !== 'fixed') return null;

  const startMs = new Date(candidate.start_time).getTime();
  const endMs = new Date(candidate.end_time).getTime();
  const duration = endMs - startMs;

  let currentStart = startMs;
  const others = existingTasks.filter(
    (x) => x.id !== candidate.id && x.status !== 'selesai' && x.type !== 'deadline'
  );

  for (let i = 0; i < 24; i++) {
    const s = currentStart;
    const e = currentStart + duration;
    let blockerEnd = null;

    others.forEach((o) => {
      getTaskIntervals(o, s - DAY, e + DAY).forEach(([b1, b2]) => {
        if (s < b2 + BUFFER_MIN * 60000 && b1 - BUFFER_MIN * 60000 < e) {
          if (!blockerEnd || b2 > blockerEnd) blockerEnd = b2;
        }
      });
    });

    if (!blockerEnd) {
      return s === startMs ? null : { start_time: new Date(s), end_time: new Date(e) };
    }

    currentStart = blockerEnd + BUFFER_MIN * 60000;
    // Round to nearest 15 minutes
    currentStart = Math.ceil(currentStart / (15 * 60000)) * 15 * 60000;
  }

  return null;
}

module.exports = {
  startOfDay,
  getTaskIntervals,
  calculateDayLoad,
  checkConflicts,
  suggestSlot
};
