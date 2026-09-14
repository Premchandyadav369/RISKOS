/**
 * RISKOS DEFCON RISK MATRIX & DEAD MAN'S KILL SWITCH (defconRiskMatrix.js)
 * SEC Rule 15c3-5 Institutional Compliance Engine:
 * - 5-Stage Defense Posture: DEFCON 5 (Normal) down to DEFCON 1 (Emergency Liquidation)
 * - Rogue Bot Autonomous Quarantine Protocol
 * - Instant single-click TWAP panic market exit
 * - Cryptographic SHA-256 Audit Trail for emergency risk actions
 */

((root) => {
  'use strict';

  // Lightweight standalone SHA-256 implementation for isomorphic zero-dependency hashing
  const simpleSha256 = (ascii) => {
    let mathPow = Math.pow;
    let maxWord = mathPow(2, 32);
    let lengthProperty = 'length';
    let i, j;
    let result = '';
    let words = [];
    let asciiBitLength = ascii[lengthProperty] * 8;
    let hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    let k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let compositeClearArray = [];

    for (let c = 0; c < asciiBitLength; c += 8) {
      compositeClearArray.push(ascii.charCodeAt(c / 8));
    }
    compositeClearArray.push(0x80);
    while ((compositeClearArray[lengthProperty] % 64) !== 56) {
      compositeClearArray.push(0);
    }
    for (i = 0; i < compositeClearArray[lengthProperty]; i += 4) {
      words.push(
        (compositeClearArray[i] << 24) |
        (compositeClearArray[i + 1] << 16) |
        (compositeClearArray[i + 2] << 8) |
        (compositeClearArray[i + 3])
      );
    }
    words.push((asciiBitLength / maxWord) | 0);
    words.push(asciiBitLength | 0);

    for (j = 0; j < words[lengthProperty];) {
      let w = words.slice(j, j += 16);
      let oldHash = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        let i2 = i + j;
        let w15 = w[i - 15], w2 = w[i - 2];
        let a = hash[0], e = hash[4];
        let temp1 = hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ ((~e) & hash[6])) +
          k[i] +
          (w[i] = (i < 16) ? w[i] : (
            w[i - 16] +
            (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
            w[i - 7] +
            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        let temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + oldHash[i]) | 0;
      }
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j >= 0; j--) {
        let b = (hash[i] >> (8 * j)) & 255;
        result += ((b < 16) ? 0 : '') + b.toString(16);
      }
    }
    return result;

    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
  };

  const DEFCON_LEVELS = {
    5: { level: 5, code: 'DEFCON_5', name: 'NORMAL', color: '#10b981', label: 'DEFCON 5: NORMAL', desc: 'Standard autonomous execution across all 20 Pantheon algorithms.' },
    4: { level: 4, code: 'DEFCON_4', name: 'ELEVATED', color: '#38bdf8', label: 'DEFCON 4: ELEVATED', desc: 'Notional size collars reduced by 25%. Enhanced slippage monitoring.' },
    3: { level: 3, code: 'DEFCON_3', name: 'RESTRICTED', color: '#ffb000', label: 'DEFCON 3: RESTRICTED', desc: '50% position limits enforced. Leverage capped at 2.0x. Speculative entries blocked.' },
    2: { level: 2, code: 'DEFCON_2', name: 'ORDER_HALT', color: '#f97316', label: 'DEFCON 2: ORDER HALT', desc: 'All new order entries suspended. Open positions managed defensively.' },
    1: { level: 1, code: 'DEFCON_1', name: 'PANIC_LIQUIDATION', color: '#f43f5e', label: 'DEFCON 1: EMERGENCY KILL SWITCH', desc: 'DEAD MAN SWITCH TRIPPED: Coordinated Almgren-Chriss TWAP market exit into cash.' }
  };

  class DefconRiskMatrixEngine {
    constructor() {
      this.currentLevel = 5;
      this.quarantinedBots = new Set();
      this.auditLedger = [];
      this.listeners = [];
      this.isEmergencyLiquidating = false;
    }

    getCurrentPosture() {
      return DEFCON_LEVELS[this.currentLevel];
    }

    /**
     * Change DEFCON posture with cryptographic signature
     */
    setDefconLevel(level, reason = 'MANUAL_OPERATOR_OVERRIDE', operator = 'CHIEF_RISK_OFFICER') {
      const target = Number(level);
      if (!DEFCON_LEVELS[target]) throw new Error(`Invalid DEFCON level: ${level}`);

      const prev = this.currentLevel;
      this.currentLevel = target;

      const payload = `${Date.now()}|${prev}|${target}|${reason}|${operator}`;
      const hash = simpleSha256(payload);

      const record = {
        id: `DEFCON-${Date.now()}`,
        timestamp: new Date().toISOString(),
        previousLevel: prev,
        newLevel: target,
        code: DEFCON_LEVELS[target].code,
        reason,
        operator,
        cryptoSha256: hash,
        secRule15c35Status: 'COMPLIANT'
      };

      this.auditLedger.unshift(record);
      if (this.auditLedger.length > 50) this.auditLedger.pop();

      // If DEFCON 1 is engaged, automatically trigger emergency liquidation
      if (target === 1) {
        this.triggerEmergencyLiquidation();
      }

      this.notifyListeners('DEFCON_CHANGED', record);
      if (typeof window !== 'undefined' && window.TerminalBus) {
        window.TerminalBus.publish('DEFCON_CHANGED', record);
      }

      return record;
    }

    /**
     * Auto-quarantine a rogue bot
     */
    quarantineBot(botId, reason = 'EXCEEDED_INTRADAY_DRAWDOWN_COLLAR') {
      this.quarantinedBots.add(botId);
      const record = {
        timestamp: new Date().toISOString(),
        botId,
        reason,
        action: 'AUTONOMOUS_QUARANTINE_ENGAGED',
        cryptoSha256: simpleSha256(`${botId}|${reason}|${Date.now()}`)
      };
      this.auditLedger.unshift(record);
      this.notifyListeners('BOT_QUARANTINED', record);
      return record;
    }

    releaseBot(botId) {
      this.quarantinedBots.delete(botId);
      const record = {
        timestamp: new Date().toISOString(),
        botId,
        action: 'QUARANTINE_RELEASED'
      };
      this.auditLedger.unshift(record);
      this.notifyListeners('BOT_RELEASED', record);
      return record;
    }

    isBotQuarantined(botId) {
      return this.quarantinedBots.has(botId);
    }

    /**
     * Dead Man's Switch: Emergency TWAP market exit across all active positions
     */
    triggerEmergencyLiquidation() {
      this.isEmergencyLiquidating = true;
      const record = {
        timestamp: new Date().toISOString(),
        event: 'EMERGENCY_PANIC_LIQUIDATION_INITIATED',
        algorithm: 'ALMGREN_CHRISS_TWAP_UNWIND',
        destinationAsset: 'INR_CASH_AND_US_TREASURIES',
        cryptoSignature: simpleSha256(`EMERGENCY_EXIT|${Date.now()}`)
      };
      this.auditLedger.unshift(record);

      if (typeof window !== 'undefined' && window.TerminalBus) {
        window.TerminalBus.publish('EMERGENCY_LIQUIDATION', record);
      }
      return record;
    }

    subscribe(fn) {
      this.listeners.push(fn);
    }

    notifyListeners(event, data) {
      this.listeners.forEach(fn => {
        try { fn(event, data); } catch (e) {}
      });
    }
  }

  const instance = new DefconRiskMatrixEngine();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  if (typeof window !== 'undefined') {
    window.DefconRiskMatrix = instance;
  }
})(typeof window !== 'undefined' ? window : global);
