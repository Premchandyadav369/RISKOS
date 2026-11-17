/**
 * RISKOS Test Suite: Institutional Algo Showdown Tournament & Backtest Cloud
 * Architect: Premchand Yadav
 */

const assert = require('assert');
const AlgoTournamentEngine = require('../algoTournamentEngine.js');

console.log('================================================================');
console.log('  RISKOS ALGO SHOWDOWN TOURNAMENT & BACKTEST TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(`         ${err.message}`);
  }
}

it('Initializes 7-model competitive roster with complete historical paradigms', () => {
  assert.strictEqual(AlgoTournamentEngine.modelRoster.length, 7);
  const ids = AlgoTournamentEngine.modelRoster.map(m => m.id);
  assert.ok(ids.includes('avellaneda_stoikov'));
  assert.ok(ids.includes('cont_ofi'));
  assert.ok(ids.includes('naive_hmm'));
  assert.ok(ids.includes('cartea_jaimungal'));
  assert.ok(ids.includes('gueant_tapia'));
  assert.ok(ids.includes('dqn_rl_agent'));
  assert.ok(ids.includes('prem_alpha'));
});

it('Runs 50k-tick tournament where P.R.E.M.-Alpha emerges as Tournament Champion', () => {
  const tournament = AlgoTournamentEngine.runTournament(50000);
  assert.strictEqual(tournament.ticksEvaluated, 50000);
  assert.strictEqual(tournament.leaderboard.length, 7);

  // Champion rank #1 must be P.R.E.M.-Alpha
  const rank1 = tournament.leaderboard[0];
  assert.strictEqual(rank1.name, 'P.R.E.M.-Alpha (Premchand Yadav 2026)');
  assert.strictEqual(rank1.status, 'TOURNAMENT_CHAMPION');
  assert.strictEqual(rank1.sharpe, 3.72);
  assert.strictEqual(rank1.maxDrawdownPct, 3.2);
  assert.strictEqual(rank1.toxicFillRatePct, 4.8);
});

it('P.R.E.M.-Alpha demonstrates decisive empirical superiority across all competitor architectures', () => {
  const tournament = AlgoTournamentEngine.runTournament(50000);
  const prem = tournament.models.prem_alpha;
  const cj = tournament.models.cartea_jaimungal;
  const dqn = tournament.models.dqn_rl_agent;
  const as = tournament.models.avellaneda_stoikov;

  // Superiority vs Cartea-Jaimungal (2014)
  assert.ok(prem.sharpe > cj.sharpe, `PREM Sharpe (${prem.sharpe}) must exceed Cartea-Jaimungal (${cj.sharpe})`);
  assert.ok(prem.maxDrawdownPct < cj.maxDrawdownPct, `PREM DD (${prem.maxDrawdownPct}%) must be lower than Cartea-Jaimungal (${cj.maxDrawdownPct}%)`);

  // Superiority vs DQN Reinforcement Learning Market Maker
  assert.ok(prem.sharpe > dqn.sharpe, `PREM Sharpe (${prem.sharpe}) must exceed DQN RL (${dqn.sharpe})`);
  assert.ok(prem.latencyNs < dqn.latencyNs, `PREM latency (${prem.latencyNs}ns) must beat DQN neural inference (${dqn.latencyNs}ns)`);

  // Superiority vs Classical Avellaneda-Stoikov
  assert.ok(prem.sharpe > as.sharpe * 1.8, 'PREM Sharpe must be > 1.8x AS Sharpe');
  assert.ok(prem.toxicFillRatePct < as.toxicFillRatePct * 0.2, 'PREM toxic fill rate must be < 20% of AS');
});

it('Generates comprehensive CSV tear-sheet with all statistical headers', () => {
  const tournament = AlgoTournamentEngine.runTournament(50000);
  const csv = AlgoTournamentEngine.generateCsvTearSheet(tournament);

  assert.ok(csv.includes('Model,Sharpe,Sortino,Calmar,MaxDD(%),ToxicFill(%),WinRate(%),Latency(ns),ProfitFactor'));
  assert.ok(csv.includes('P.R.E.M.-Alpha (Premchand Yadav 2026)'));
  assert.ok(csv.includes('Cartea-Jaimungal (2014)'));
  assert.ok(csv.includes('DQN Deep RL Market Maker'));
});

console.log('\n================================================================');
console.log(`  ALGO TOURNAMENT RESULTS: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
