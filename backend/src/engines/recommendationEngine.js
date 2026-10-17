// =====================================================================
// AI & MOOD ADAPTIVE RECOMMENDATION ENGINE (FR-03, FR-06, FR-08)
// - Matching task complexity with daily energy level
// - Safe postpone recommendation for heavy tasks when mood is low
// - Mental health care tips for low moods
// =====================================================================

const { calculatePriority, getEventTime, getDurationHours } = require('./priorityEngine');

const H = 3600000;

const MOODS = [
  { level: 5, emoji: '😄', label: 'Sangat Baik', range: [3.0, 5.0], energy: 'Energi sangat tinggi' },
  { level: 4, emoji: '🙂', label: 'Baik', range: [2.5, 4.5], energy: 'Energi tinggi' },
  { level: 3, emoji: '😐', label: 'Netral', range: [2.0, 3.5], energy: 'Energi sedang' },
  { level: 2, emoji: '😟', label: 'Buruk', range: [1.0, 2.5], energy: 'Energi rendah' },
  { level: 1, emoji: '😢', label: 'Sangat Buruk', range: [1.0, 1.6], energy: 'Energi sangat rendah' }
];

function calculateComplexity(task) {
  const d = Number(task.difficulty) || 3;
  const durHours = getDurationHours(task);
  const durScore = (Math.min(durHours, 6) / 6) * 5;
  const complexity = d * 0.7 + durScore * 0.3;
  return Math.min(5, Math.max(1, Math.round(complexity * 10) / 10));
}

function generateRecommendations(moodLevel, tasks, now = Date.now()) {
  const currentMood = MOODS.find((m) => m.level === Number(moodLevel)) || MOODS[2];
  const [lo, hi] = currentMood.range;

  const activeTasks = tasks.filter((x) => {
    if (x.status === 'selesai') return false;
    if (x.type === 'fixed' && x.end_time && new Date(x.end_time).getTime() < now) return false;
    return true;
  });

  const recommendedItems = [];
  const postponeItems = [];

  activeTasks.forEach((task) => {
    const c = calculateComplexity(task);
    const p = calculatePriority(task, now);
    const ev = getEventTime(task, now);
    const hoursLeft = ev ? (ev - now) / H : Infinity;

    // Rule: Suggest postpone heavy tasks if mood is low and deadline is far (> 48h)
    if (currentMood.level <= 2 && c >= 3.2 && hoursLeft > 48 && p.label !== 'TOP') {
      postponeItems.push({
        task,
        complexity: c,
        priority: p,
        reason: `Tugas berat (Kompleksitas: ${c}/5), deadline masih ${Math.round(hoursLeft / 24)} hari lagi. Sangat disarankan untuk ditunda sampai energimu memulih.`
      });
      return;
    }

    // Skip heavy non-urgent tasks if mood is 1 (Sangat Buruk)
    if (currentMood.level === 1 && !(p.label === 'TOP' || hoursLeft < 24)) {
      return;
    }

    // Calculate fit distance
    const dist = c < lo ? lo - c : c > hi ? c - hi : 0;
    const fit = Math.max(0, 1 - dist / 2);
    const matchScore = (p.score / 60) * 0.55 + fit * 0.45;

    let explanation;
    if (currentMood.level === 1) {
      explanation = 'Mendesak — selesaikan versi paling ringan dulu (misal 15 menit), lalu istirahat & self-care.';
    } else if (fit >= 0.99 && c >= 3.2) {
      explanation = 'Energimu sedang tinggi — waktu terbaik menyelesaikan tugas yang menantang ini.';
    } else if (fit >= 0.99 && c <= 2.3) {
      explanation = 'Tugas ringan, sangat cocok dan efisien untuk kondisimu saat ini.';
    } else if (fit >= 0.99) {
      explanation = 'Tingkat kesulitannya sangat pas dan seimbang dengan energimu sekarang.';
    } else if (c < lo) {
      explanation = 'Lebih ringan dari kapasitasmu sekarang — bisa diselesaikan cepat sebagai pemanasan.';
    } else {
      explanation = 'Cukup menantang untuk kondisimu, tapi memiliki prioritas yang penting. Pecah jadi sesi kecil.';
    }

    if (p.label === 'TOP') {
      explanation += ' (Prioritas TOP — waktu sudah dekat!)';
    }

    recommendedItems.push({
      task,
      matchScore: Math.round(matchScore * 100),
      complexity: c,
      priority: p,
      reason: explanation
    });
  });

  recommendedItems.sort((a, b) => b.matchScore - a.matchScore);

  let selfCareTip = null;
  if (currentMood.level <= 2) {
    selfCareTip = currentMood.level === 1
      ? 'Kondisimu sedang sangat lelah/stres. Ambil jeda 20 menit, lakukan latihan pernapasan dalam (4-7-8), minum air putih, dan hindari memaksakan tugas berat hari ini.'
      : 'Energimu sedang rendah. Kerjakan tugas ringan terlebih dahulu, dengarkan musik rileks, dan sediakan waktu istirahat sejenak setelah setiap 30 menit bekerja.';
  }

  return {
    mood: currentMood,
    recommendations: recommendedItems.slice(0, 5),
    postponed: postponeItems.slice(0, 3),
    selfCareTip
  };
}

module.exports = {
  MOODS,
  calculateComplexity,
  generateRecommendations
};
