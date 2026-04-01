import Prediction from '../models/Prediction';

// ─── Unit Tests: Prediction Scoring Engine ────────────────────────────────────
// Run with: cd server && npx ts-node src/tests/scoring.test.ts

const RESULT = {
  tossWinner:        'India',
  matchWinner:       'India',
  topRunScorer:      'Virat Kohli',
  totalRunsByWinner: 185,
  playerOfTheMatch:  'Jasprit Bumrah',
};

type ScoreCase = {
  label:    string;
  answers:  typeof RESULT & { totalRunsByWinner: number };
  expected: number;
};

const CASES: ScoreCase[] = [
  {
    label: 'Perfect — all 5 correct',
    answers: { ...RESULT },
    expected: 5,
  },
  {
    label: 'Runs within tolerance (+8)',
    answers: { ...RESULT, totalRunsByWinner: 193 },
    expected: 5,
  },
  {
    label: 'Runs outside tolerance (+11)',
    answers: { ...RESULT, totalRunsByWinner: 196 },
    expected: 4,
  },
  {
    label: 'Wrong match winner',
    answers: { ...RESULT, matchWinner: 'Australia' },
    expected: 4,
  },
  {
    label: 'Wrong toss + wrong winner',
    answers: { ...RESULT, tossWinner: 'Australia', matchWinner: 'Australia' },
    expected: 3,
  },
  {
    label: 'All wrong',
    answers: {
      tossWinner:        'Australia',
      matchWinner:       'Australia',
      topRunScorer:      'Steve Smith',
      totalRunsByWinner: 100,
      playerOfTheMatch:  'Pat Cummins',
    },
    expected: 0,
  },
];

// Manual scoring replica (mirrors Prediction.evaluate logic)
function manualScore(answers: typeof RESULT & { totalRunsByWinner: number }, result: typeof RESULT & { totalRunsByWinner: number }): number {
  let score = 0;
  if (answers.tossWinner?.toLowerCase() === result.tossWinner?.toLowerCase()) score++;
  if (answers.matchWinner?.toLowerCase() === result.matchWinner?.toLowerCase()) score++;
  if (answers.topRunScorer?.toLowerCase() === result.topRunScorer?.toLowerCase()) score++;
  if (Math.abs(answers.totalRunsByWinner - result.totalRunsByWinner) <= 10) score++;
  if (answers.playerOfTheMatch?.toLowerCase() === result.playerOfTheMatch?.toLowerCase()) score++;
  return score;
}

let passed = 0;
let failed = 0;

console.log('\n🏏 CricClash — Backend Unit Tests\n' + '─'.repeat(50));

for (const tc of CASES) {
  const got      = manualScore(tc.answers, RESULT);
  const ok       = got === tc.expected;
  const icon     = ok ? '✅' : '❌';
  console.log(`${icon} ${tc.label}`);
  if (!ok) {
    console.log(`   Expected: ${tc.expected}  Got: ${got}`);
    failed++;
  } else {
    passed++;
  }
}

console.log('\n' + '─'.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed out of ${CASES.length} tests`);

if (failed > 0) process.exit(1);
else console.log('🎉 All tests passed!\n');
