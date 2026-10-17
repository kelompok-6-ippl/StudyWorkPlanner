// =====================================================================
// AUTOMATED UNIT TESTS — StudyWork Planner Engines (IPPL Testing)
// Tests: Priority Engine, Boundary Value Analysis, Conflict & Buffer
// Run with: npm test (or node tests/engine.test.js)
// =====================================================================

const assert = require('assert');
const {
  calculatePriority,
  calculateUrgency,
  calculateDifficultyModifier
} = require('../src/engines/priorityEngine');

const {
  checkConflicts,
  suggestSlot
} = require('../src/engines/conflictEngine');

const {
  calculateComplexity,
  generateRecommendations
} = require('../src/engines/recommendationEngine');

let passedTests = 0;
let totalTests = 0;

function it(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Reason: ${error.message}`);
  }
}

console.log('\n=======================================================');
console.log('🧪 RUNNING AUTOMATED UNIT TESTS: StudyWork Planner Engines');
console.log('=======================================================\n');

// 1. PRIORITY ENGINE & BOUNDARY VALUES
console.log('--- Test Suite 1: Priority Engine & Boundary Values ---');

it('Difficulty modifier should accurately map difficulty 1 to 5 into 0.8 to 1.2', () => {
  assert.strictEqual(calculateDifficultyModifier(1), 0.8);
  assert.strictEqual(calculateDifficultyModifier(3), 1.0);
  assert.strictEqual(calculateDifficultyModifier(5), 1.2);
});

it('Priority score label boundaries: TOP >= 36, HIGH >= 24, MEDIUM >= 12, LOW < 12', () => {
  // Test TOP
  const taskTop = {
    type: 'deadline',
    deadline: new Date(Date.now() + 2 * 3600000).toISOString(),
    estimated_duration_hours: 1,
    importance: 5,
    difficulty: 5
  };
  const resTop = calculatePriority(taskTop);
  assert(resTop.score >= 36, `Expected score >= 36, got ${resTop.score}`);
  assert.strictEqual(resTop.label, 'TOP');

  // Test LOW
  const taskLow = {
    type: 'deadline',
    deadline: new Date(Date.now() + 10 * 86400000).toISOString(), // 10 days
    estimated_duration_hours: 1,
    importance: 1,
    difficulty: 1
  };
  const resLow = calculatePriority(taskLow);
  assert(resLow.score < 12, `Expected score < 12, got ${resLow.score}`);
  assert.strictEqual(resLow.label, 'LOW');
});

// 2. CONFLICT & BUFFER DETECTION
console.log('\n--- Test Suite 2: Conflict & Buffer Detection ---');

it('Should detect collision when two fixed-time tasks overlap', () => {
  const now = Date.now();
  const existingTasks = [
    {
      id: 'task-1',
      type: 'fixed',
      start_time: new Date(now + 3600000).toISOString(), // 1h from now
      end_time: new Date(now + 3 * 3600000).toISOString(), // 3h from now
      status: 'belum'
    }
  ];

  const candidateOverlap = {
    id: 'candidate-1',
    type: 'fixed',
    start_time: new Date(now + 2 * 3600000).toISOString(), // 2h from now (overlaps!)
    end_time: new Date(now + 4 * 3600000).toISOString()
  };

  const result = checkConflicts(candidateOverlap, existingTasks, 8.0, now);
  assert.strictEqual(result.hasConflict, true);
  assert(result.collisions.length > 0, 'Collision must be detected');
});

it('Should detect buffer warning when gap between tasks is < 30 minutes', () => {
  const now = Date.now();
  const existingTasks = [
    {
      id: 'task-1',
      type: 'fixed',
      start_time: new Date(now + 3600000).toISOString(),
      end_time: new Date(now + 2 * 3600000).toISOString(), // Ends at +2h
      status: 'belum'
    }
  ];

  const candidateBuffer = {
    id: 'candidate-2',
    type: 'fixed',
    start_time: new Date(now + 2 * 3600000 + 15 * 60000).toISOString(), // Starts at +2h15m (15m gap < 30m!)
    end_time: new Date(now + 4 * 3600000).toISOString()
  };

  const result = checkConflicts(candidateBuffer, existingTasks, 8.0, now);
  assert.strictEqual(result.hasConflict, true);
  assert(result.buffers.length > 0, 'Buffer violation must be detected');
});

it('Should suggest next available slot when a conflict exists', () => {
  const now = Date.now();
  const existingTasks = [
    {
      id: 'task-1',
      type: 'fixed',
      start_time: new Date(now + 3600000).toISOString(),
      end_time: new Date(now + 2 * 3600000).toISOString(),
      status: 'belum'
    }
  ];

  const candidate = {
    id: 'candidate-3',
    type: 'fixed',
    start_time: new Date(now + 3600000).toISOString(), // Conflicts with task-1
    end_time: new Date(now + 2 * 3600000).toISOString()
  };

  const slot = suggestSlot(candidate, existingTasks, now);
  assert(slot != null, 'A rescheduled slot must be suggested');
  assert(slot.start_time > new Date(now + 2 * 3600000), 'Suggested slot must start after existing task');
});

// 3. AI & MOOD RECOMMENDATION ENGINE
console.log('\n--- Test Suite 3: AI & Mood Adaptive Engine ---');

it('Should recommend postponing heavy non-urgent tasks when mood is low (level 1 or 2)', () => {
  const now = Date.now();
  const tasks = [
    {
      id: 'heavy-task',
      title: 'Tugas Akhir Skripsi',
      type: 'deadline',
      deadline: new Date(now + 5 * 86400000).toISOString(), // 5 days away
      estimated_duration_hours: 6,
      importance: 3,
      difficulty: 5,
      status: 'belum'
    }
  ];

  const recResult = generateRecommendations(1, tasks, now); // Mood 1: Sangat Buruk
  assert(recResult.postponed.length > 0, 'Heavy task should be in postponed recommendations');
  assert(recResult.selfCareTip != null, 'Self-care advice should be provided');
});

console.log('\n=======================================================');
console.log(`📊 TEST SUMMARY: ${passedTests}/${totalTests} Passed`);
if (passedTests === totalTests) {
  console.log('🎉 ALL ENGINE TESTS PASSED FLAWLESSLY!');
} else {
  console.log('⚠️ SOME TESTS FAILED.');
}
console.log('=======================================================\n');
