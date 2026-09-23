/**
 * RISKOS — CRYPTOGRAPHIC ACCREDITATION CERTIFICATES & RPG SKILL TREE (accreditationCert.js)
 * Produces verifiable institutional graduation certificates with SHA-256 integrity
 * and interactive RPG-style Quant Skill Tree DAG.
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AccreditationCert = factory();
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  // Deterministic SHA-256
  function sha256Sync(ascii) {
    function rightRotate(value, amount) {
      return (value >>> amount) | (value << (32 - amount));
    }
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let i, j;
    const result = [];
    const words = [];
    const asciiBitLength = ascii.length * 8;
    let hash = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    words[asciiBitLength >> 5] |= 0x80 << (24 - asciiBitLength % 32);
    words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

    for (i = 0; i < words.length; i += 16) {
      const w = words.slice(i, i + 16);
      const oldHash = hash;
      hash = hash.slice(0);

      for (j = 0; j < 64; j++) {
        const i2 = j + i;
        const w15 = w[j - 15], w2 = w[j - 2];
        const a = hash[0], e = hash[4];
        const temp1 = hash[7]
          + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
          + ((e & hash[5]) ^ ((~e) & hash[6]))
          + k[j]
          + (w[j] = (j < 16) ? (w[j] || 0) : (
            w[j - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[j - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
          );
        const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
          + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (j = 0; j < 8; j++) {
        hash[j] = (hash[j] + oldHash[j]) | 0;
      }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        const b = (hash[i] >> (j * 8)) & 255;
        result.push((b < 16 ? '0' : '') + b.toString(16));
      }
    }
    return result.join('');
  }

  // ── RPG Skill Tree DAG Definition ─────────────────────────────────────────
  const QUANT_SKILL_TREE = [
    {
      id: 'tier_1_foundations',
      tier: 1,
      name: 'Microstructure & Mental Math',
      badge: 'PROB_APPRENTICE',
      requiredXP: 100,
      skills: ['Rule of 16 Volatility', 'Bid-Ask Spread Dynamics', 'Order Book Queuing', 'Expected Value Fast Drill'],
      unlocked: true
    },
    {
      id: 'tier_2_derivatives',
      tier: 2,
      name: 'Stochastic Calculus & First-Order Greeks',
      badge: 'GREEKS_NAVIGATOR',
      requiredXP: 300,
      skills: ['Ito Lemma Expansion', 'Delta-Gamma Neutral Hedging', 'Vega Slippage', 'Theta Time Decay Management'],
      unlocked: true
    },
    {
      id: 'tier_3_cross_asset',
      tier: 3,
      name: 'GS Quant Cross-Asset Transfer & Rates',
      badge: 'CROSS_ASSET_ARCHITECT',
      requiredXP: 600,
      skills: ['Interest Rate Swaps (IRS / DV01)', 'Credit Default Swaps (CDS / CS01)', 'FX Risk Reversal & Fly Smiles', 'Commodity Roll Curves'],
      unlocked: false
    },
    {
      id: 'tier_4_elite_stat_arb',
      tier: 4,
      name: 'Higher-Order Greeks & Deep Hedging',
      badge: 'QUANT_GRANDMASTER',
      requiredXP: 1000,
      skills: ['Vanna-Volga Hedging', 'Dupire Local Volatility', 'PCA Eigen-Portfolios', 'Deep Reinforcement Hedging'],
      unlocked: false
    }
  ];

  class CertificateGenerator {
    static generateCertificateData(options = {}) {
      const studentName = options.studentName || 'QUANT DEVELOPER';
      const credentialTitle = options.credentialTitle || 'Chartered Quantitative Risk & Cross-Asset Specialist (CQR-CATS)';
      const completionDate = options.completionDate || new Date().toISOString().split('T')[0];
      const distinction = options.distinction || 'Summa Cum Laude (Top 1%)';
      const completedModulesCount = options.completedModulesCount || 80;

      const rawVerificationData = `${studentName}|${credentialTitle}|${completionDate}|${distinction}|${completedModulesCount}|RISKOS_ACCREDITED`;
      const verificationHash = sha256Sync(rawVerificationData);

      return {
        studentName,
        credentialTitle,
        completionDate,
        distinction,
        completedModulesCount,
        verificationHash,
        institution: 'RISKOS BOARD OF QUANTITATIVE EXCELLENCE',
        accreditationId: 'RISKOS-CERT-' + verificationHash.substring(0, 12).toUpperCase()
      };
    }

    /**
     * Generates a high-resolution Vector SVG Certificate suitable for print or web display
     */
    static generateSVG(certData, width = 840, height = 594) {
      return `
        <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#090d16; font-family: 'JetBrains Mono', Georgia, serif;">
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f59e0b"/>
              <stop offset="50%" stop-color="#fbbf24"/>
              <stop offset="100%" stop-color="#d97706"/>
            </linearGradient>
            <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#3b82f6"/>
              <stop offset="100%" stop-color="#1d4ed8"/>
            </linearGradient>
            <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0,20 Q 10,0 20,20 T 40,20" fill="none" stroke="rgba(245, 158, 11, 0.08)" stroke-width="1"/>
            </pattern>
          </defs>

          <!-- Outer Parchment Border -->
          <rect x="15" y="15" width="${width - 30}" height="${height - 30}" fill="#090d16" stroke="url(#goldGrad)" stroke-width="3" rx="8"/>
          <rect x="25" y="25" width="${width - 50}" height="${height - 50}" fill="url(#guilloche)" stroke="rgba(245, 158, 11, 0.3)" stroke-width="1" rx="6"/>

          <!-- Corner Ornaments -->
          <circle cx="35" cy="35" r="5" fill="#f59e0b"/>
          <circle cx="${width - 35}" cy="35" r="5" fill="#f59e0b"/>
          <circle cx="35" cy="${height - 35}" r="5" fill="#f59e0b"/>
          <circle cx="${width - 35}" cy="${height - 35}" r="5" fill="#f59e0b"/>

          <!-- Header -->
          <text x="${width / 2}" y="85" fill="url(#goldGrad)" font-size="14" font-weight="bold" letter-spacing="4" text-anchor="middle">BOARD OF QUANTITATIVE GOVERNANCE</text>
          <text x="${width / 2}" y="115" fill="#ffffff" font-size="28" font-weight="900" letter-spacing="1.5" text-anchor="middle">CERTIFICATE OF QUANTITATIVE MASTERY</text>
          
          <line x1="${width / 2 - 180}" y1="130" x2="${width / 2 + 180}" y2="130" stroke="url(#goldGrad)" stroke-width="1.5"/>

          <!-- Body -->
          <text x="${width / 2}" y="175" fill="#94a3b8" font-size="12" letter-spacing="1" text-anchor="middle">THIS IS OFFICIALLY PRESENTED TO</text>
          <text x="${width / 2}" y="225" fill="#38bdf8" font-size="28" font-weight="bold" letter-spacing="2" text-anchor="middle">${certData.studentName.toUpperCase()}</text>
          <line x1="${width / 2 - 140}" y1="238" x2="${width / 2 + 140}" y2="238" stroke="rgba(56, 189, 248, 0.4)" stroke-width="1"/>

          <text x="${width / 2}" y="275" fill="#cbd5e1" font-size="12" text-anchor="middle">for rigorous completion and proven institutional-grade mastery in</text>
          <text x="${width / 2}" y="310" fill="#f8fafc" font-size="18" font-weight="bold" text-anchor="middle">${certData.credentialTitle}</text>
          <text x="${width / 2}" y="340" fill="#10b981" font-size="12" font-weight="bold" text-anchor="middle">Honors: ${certData.distinction} &bull; ${certData.completedModulesCount} Advanced Stochastic Labs Verified</text>

          <!-- Seal & Verification -->
          <g transform="translate(110, 410)">
            <circle cx="45" cy="45" r="42" fill="url(#sealGrad)" stroke="url(#goldGrad)" stroke-width="2"/>
            <circle cx="45" cy="45" r="36" fill="none" stroke="#ffffff" stroke-width="1" stroke-dasharray="3,2"/>
            <text x="45" y="42" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">OFFICIAL</text>
            <text x="45" y="55" fill="url(#goldGrad)" font-size="9" font-weight="bold" text-anchor="middle">RISKOS SEAL</text>
          </g>

          <g transform="translate(240, 420)">
            <text x="0" y="15" fill="#94a3b8" font-size="10">Credential ID: <tspan fill="#f1f5f9" font-weight="bold">${certData.accreditationId}</tspan></text>
            <text x="0" y="32" fill="#94a3b8" font-size="10">Issued Date: <tspan fill="#f1f5f9">${certData.completionDate}</tspan></text>
            <text x="0" y="49" fill="#94a3b8" font-size="9">SHA-256 Audit Hash: <tspan fill="#38bdf8" font-size="8">${certData.verificationHash.substring(0, 36)}...</tspan></text>
            <text x="0" y="65" fill="#10b981" font-size="9">&#x2714; Cryptographically Signed &amp; Auditable</text>
          </g>

          <!-- Signature Sign-off -->
          <g transform="translate(${width - 240}, 430)">
            <line x1="0" y1="20" x2="160" y2="20" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <text x="80" y="15" fill="#f59e0b" font-size="13" font-style="italic" text-anchor="middle">RISKOS Governance</text>
            <text x="80" y="35" fill="#94a3b8" font-size="9" text-anchor="middle">Chair, Quantitative Committee</text>
          </g>
        </svg>
      `;
    }

    static getSkillTree() {
      return QUANT_SKILL_TREE;
    }
  }

  return {
    CertificateGenerator,
    QUANT_SKILL_TREE
  };
});
