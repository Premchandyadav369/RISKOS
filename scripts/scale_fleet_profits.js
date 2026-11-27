const fs = require('fs');
const path = require('path');

const SCALED_STATS = {
  'BOT-IN-01': { pnl: 1873500, cap: 4500000, alpha: 24500, trades: 138, win: 84.4, sharpe: 3.82, pf: 3.44, dd: -0.42 },
  'BOT-IN-02': { pnl: 1452000, cap: 4000000, alpha: 19800, trades: 98, win: 86.2, sharpe: 4.15, pf: 3.65, dd: -0.35 },
  'BOT-IN-03': { pnl: 1134000, cap: 3500000, alpha: 16400, trades: 74, win: 78.5, sharpe: 3.42, pf: 3.10, dd: -0.58 },
  'BOT-IN-04': { pnl: 1289000, cap: 4500000, alpha: 18900, trades: 82, win: 94.0, sharpe: 4.65, pf: 4.20, dd: -0.22 },
  'BOT-IN-05': { pnl: 860000, cap: 3000000, alpha: 12500, trades: 92, win: 82.2, sharpe: 3.58, pf: 3.25, dd: -0.45 },
  'BOT-IN-06': { pnl: 776000, cap: 3000000, alpha: 11400, trades: 68, win: 81.0, sharpe: 3.25, pf: 2.95, dd: -0.48 },
  'BOT-IN-07': { pnl: 984000, cap: 3200000, alpha: 14600, trades: 84, win: 77.4, sharpe: 3.15, pf: 2.88, dd: -0.62 },
  'BOT-IN-08': { pnl: 728000, cap: 3000000, alpha: 10800, trades: 72, win: 84.5, sharpe: 3.65, pf: 3.40, dd: -0.38 },
  'BOT-IN-09': { pnl: 1460000, cap: 4000000, alpha: 21500, trades: 112, win: 88.1, sharpe: 4.22, pf: 3.92, dd: -0.32 },
  'BOT-IN-10': { pnl: 1928000, cap: 4800000, alpha: 28200, trades: 124, win: 82.2, sharpe: 3.74, pf: 3.35, dd: -0.52 },

  'BOT-US-01': { pnl: 2336000, cap: 5500000, alpha: 32400, trades: 154, win: 85.5, sharpe: 4.05, pf: 3.75, dd: -0.45 },
  'BOT-US-02': { pnl: 1968000, cap: 5000000, alpha: 29200, trades: 142, win: 81.8, sharpe: 3.65, pf: 3.35, dd: -0.55 },
  'BOT-US-03': { pnl: 1364000, cap: 4000000, alpha: 18500, trades: 88, win: 84.0, sharpe: 3.72, pf: 3.32, dd: -0.38 },
  'BOT-US-04': { pnl: 1512000, cap: 4200000, alpha: 21800, trades: 96, win: 82.6, sharpe: 3.58, pf: 3.28, dd: -0.44 },
  'BOT-US-05': { pnl: 1056000, cap: 3500000, alpha: 15400, trades: 78, win: 79.8, sharpe: 3.35, pf: 2.95, dd: -0.50 },
  'BOT-US-06': { pnl: 952000, cap: 3200000, alpha: 13800, trades: 84, win: 77.2, sharpe: 3.18, pf: 2.85, dd: -0.58 },
  'BOT-US-07': { pnl: 2968000, cap: 6500000, alpha: 44200, trades: 216, win: 98.6, sharpe: 5.82, pf: 5.10, dd: -0.15 },
  'BOT-US-08': { pnl: 1684000, cap: 4000000, alpha: 24100, trades: 168, win: 93.5, sharpe: 5.15, pf: 4.60, dd: -0.25 },
  'BOT-US-09': { pnl: 1580000, cap: 4500000, alpha: 22500, trades: 104, win: 81.4, sharpe: 3.55, pf: 3.15, dd: -0.48 },
  'BOT-US-10': { pnl: 1248000, cap: 3200000, alpha: 18200, trades: 114, win: 87.0, sharpe: 4.15, pf: 3.85, dd: -0.35 },
  'BOT-US-11': { pnl: 2356000, cap: 5500000, alpha: 33900, trades: 158, win: 86.4, sharpe: 4.18, pf: 3.88, dd: -0.42 },

  'BOT-EG-IN-01': { pnl: 2728000, cap: 5500000, alpha: 38200, trades: 172, win: 86.2, sharpe: 4.18, pf: 3.85, dd: -0.38 },
  'BOT-EG-IN-02': { pnl: 1856000, cap: 4500000, alpha: 26400, trades: 126, win: 87.5, sharpe: 4.22, pf: 3.90, dd: -0.32 },
  'BOT-EG-IN-03': { pnl: 1432000, cap: 3800000, alpha: 20800, trades: 94, win: 81.0, sharpe: 3.48, pf: 3.18, dd: -0.45 },
  'BOT-EG-IN-04': { pnl: 1284000, cap: 4800000, alpha: 19100, trades: 88, win: 95.5, sharpe: 4.85, pf: 4.45, dd: -0.20 },
  'BOT-EG-IN-05': { pnl: 992000, cap: 3200000, alpha: 14800, trades: 86, win: 83.5, sharpe: 3.65, pf: 3.25, dd: -0.42 },
  'BOT-EG-IN-06': { pnl: 864000, cap: 3000000, alpha: 12600, trades: 74, win: 81.0, sharpe: 3.38, pf: 3.05, dd: -0.46 },
  'BOT-EG-IN-07': { pnl: 1088000, cap: 3400000, alpha: 16200, trades: 86, win: 78.5, sharpe: 3.24, pf: 2.92, dd: -0.52 },
  'BOT-EG-IN-08': { pnl: 792000, cap: 3000000, alpha: 11800, trades: 76, win: 85.0, sharpe: 3.78, pf: 3.48, dd: -0.35 },
  'BOT-EG-IN-09': { pnl: 1576000, cap: 4200000, alpha: 23400, trades: 118, win: 89.2, sharpe: 4.45, pf: 4.10, dd: -0.28 },
  'BOT-EG-IN-10': { pnl: 2056000, cap: 5000000, alpha: 30400, trades: 132, win: 82.0, sharpe: 3.72, pf: 3.38, dd: -0.48 },

  'BOT-EG-US-01': { pnl: 2500000, cap: 6000000, alpha: 36500, trades: 164, win: 87.0, sharpe: 4.28, pf: 3.95, dd: -0.40 },
  'BOT-EG-US-02': { pnl: 1016000, cap: 3500000, alpha: 15400, trades: 82, win: 78.5, sharpe: 3.26, pf: 2.92, dd: -0.50 },
  'BOT-EG-US-03': { pnl: 1472000, cap: 4200000, alpha: 21800, trades: 98, win: 85.5, sharpe: 3.85, pf: 3.45, dd: -0.36 },
  'BOT-EG-US-04': { pnl: 1592000, cap: 4400000, alpha: 23800, trades: 106, win: 83.5, sharpe: 3.65, pf: 3.32, dd: -0.42 },
  'BOT-EG-US-05': { pnl: 1140000, cap: 3800000, alpha: 17500, trades: 84, win: 80.0, sharpe: 3.42, pf: 3.08, dd: -0.48 },
  'BOT-EG-US-06': { pnl: 2096000, cap: 5200000, alpha: 31400, trades: 148, win: 83.5, sharpe: 3.85, pf: 3.45, dd: -0.44 },
  'BOT-EG-US-07': { pnl: 3180000, cap: 7000000, alpha: 48500, trades: 242, win: 98.8, sharpe: 5.95, pf: 5.25, dd: -0.12 },
  'BOT-EG-US-08': { pnl: 1392000, cap: 3500000, alpha: 20800, trades: 102, win: 74.0, sharpe: 3.18, pf: 2.82, dd: -0.55 },
  'BOT-EG-US-09': { pnl: 1780000, cap: 4400000, alpha: 26500, trades: 122, win: 94.5, sharpe: 5.22, pf: 4.80, dd: -0.22 },
  'BOT-EG-US-10': { pnl: 1336000, cap: 3400000, alpha: 19400, trades: 112, win: 88.0, sharpe: 4.25, pf: 3.92, dd: -0.32 }
};

// 1. Update fleet.js
const fleetJsPath = path.resolve(__dirname, '..', 'fleet.js');
let fleetJs = fs.readFileSync(fleetJsPath, 'utf8');

for (const [id, stats] of Object.entries(SCALED_STATS)) {
  const botIdRegex = new RegExp(`id:\\s*'${id}'[\\s\\S]*?(?=id:\\s*'BOT-|\\n  \\];)`, 'm');
  const botMatch = fleetJs.match(botIdRegex);
  if (botMatch) {
    let block = botMatch[0];
    block = block.replace(/allocatedCapINR:\s*\d+,?/, `allocatedCapINR: ${stats.cap},`);
    block = block.replace(/baseDailyAlphaINR:\s*\d+,?/, `baseDailyAlphaINR: ${stats.alpha},`);
    block = block.replace(/realizedPnlINR:\s*\d+,?/, `realizedPnlINR: ${stats.pnl},`);
    block = block.replace(/winRate:\s*[\d\.]+,?/, `winRate: ${stats.win},`);
    block = block.replace(/tradesToday:\s*\d+,?/, `tradesToday: ${stats.trades},`);
    block = block.replace(/sharpe:\s*[\d\.]+,?/, `sharpe: ${stats.sharpe},`);
    block = block.replace(/profitFactor:\s*[\d\.]+,?/, `profitFactor: ${stats.pf},`);
    block = block.replace(/maxDD:\s*[-\d\.]+,?/, `maxDD: ${stats.dd},`);
    fleetJs = fleetJs.replace(botIdRegex, block);
  }
}

// Also update the total Realized display formatter in fleet.js to show Crores cleanly when >= 1 Cr
fleetJs = fleetJs.replace(
  /realizedOnlyEl\.textContent = `₹\$\{\(totalRealizedPnl \/ 100000\)\.toFixed\(2\)\}L`;/g,
  "realizedOnlyEl.textContent = totalRealizedPnl >= 10000000 ? `₹${(totalRealizedPnl / 1e7).toFixed(2)} Cr` : `₹${(totalRealizedPnl / 100000).toFixed(2)}L`;"
);
fleetJs = fleetJs.replace(
  /Realized: <strong style="color:#10b981;">₹\$\{\(totalRealizedPnl \/ 100000\)\.toFixed\(2\)\}L<\/strong>/g,
  "Realized: <strong style=\"color:#10b981;\">${totalRealizedPnl >= 10000000 ? '₹' + (totalRealizedPnl / 1e7).toFixed(2) + ' Cr' : '₹' + (totalRealizedPnl / 100000).toFixed(2) + 'L'}</strong>"
);

fs.writeFileSync(fleetJsPath, fleetJs, 'utf8');
console.log('✓ Updated fleet.js with scaled higher profits and Crores formatting');

// 2. Update api/market/fleet.js
const apiFleetPath = path.resolve(__dirname, '..', 'api', 'market', 'fleet.js');
let apiFleet = fs.readFileSync(apiFleetPath, 'utf8');

for (const [id, stats] of Object.entries(SCALED_STATS)) {
  const lineRegex = new RegExp(`\\{\\s*id:\\s*'${id}'[\\s\\S]*?\\},`, 'm');
  const lineMatch = apiFleet.match(lineRegex);
  if (lineMatch) {
    let line = lineMatch[0];
    line = line.replace(/pnl_inr:\s*[\d\.]+,?/, `pnl_inr: ${stats.pnl}.0,`);
    line = line.replace(/win_rate:\s*[\d\.]+,?/, `win_rate: ${stats.win},`);
    line = line.replace(/sharpe:\s*[\d\.]+,?/, `sharpe: ${stats.sharpe},`);
    // Scale unrealized P&L proportionally to ~3.5%
    const unPnl = Math.round(stats.pnl * 0.035);
    line = line.replace(/unrealizedPnlINR:\s*\d+/, `unrealizedPnlINR: ${unPnl}`);
    apiFleet = apiFleet.replace(lineRegex, line);
  }
}
fs.writeFileSync(apiFleetPath, apiFleet, 'utf8');
console.log('✓ Updated api/market/fleet.js with scaled higher profits');

// 3. Update backend/engine/bot_fleet.py
const pyFleetPath = path.resolve(__dirname, '..', 'backend', 'engine', 'bot_fleet.py');
let pyFleet = fs.readFileSync(pyFleetPath, 'utf8');

for (const [id, stats] of Object.entries(SCALED_STATS)) {
  const pyBotRegex = new RegExp(`\\{\\s*"id":\\s*"${id}"[\\s\\S]*?\\},`, 'm');
  const pyBotMatch = pyFleet.match(pyBotRegex);
  if (pyBotMatch) {
    let block = pyBotMatch[0];
    block = block.replace(/"allocated_capital_inr":\s*[\d\.]+,?/, `"allocated_capital_inr": ${stats.cap}.0,`);
    block = block.replace(/"realized_pnl_inr":\s*[\d\.]+,?/, `"realized_pnl_inr": ${stats.pnl}.0,`);
    block = block.replace(/"win_rate":\s*[\d\.]+,?/, `"win_rate": ${(stats.win / 100).toFixed(3)},`);
    block = block.replace(/"sharpe":\s*[\d\.]+,?/, `"sharpe": ${stats.sharpe},`);
    block = block.replace(/"max_drawdown":\s*[-\d\.]+,?/, `"max_drawdown": ${(stats.dd / 100).toFixed(4)},`);
    pyFleet = pyFleet.replace(pyBotRegex, block);
  }
}
fs.writeFileSync(pyFleetPath, pyFleet, 'utf8');
console.log('✓ Updated backend/engine/bot_fleet.py with scaled higher profits');
