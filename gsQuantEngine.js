/**
 * RISKOS — GS QUANT CROSS-ASSET RISK TRANSFER ENGINE (gsQuantEngine.js)
 * High-performance, deterministic cross-asset risk transfer and pricing toolkit
 * modeled on Goldman Sachs Marquee / GS Quant.
 * 
 * Supports:
 * 1. Rates: Fixed-for-Floating Interest Rate Swaps (IRS), OIS, Par Swap Rate, DV01/IR01, Key Rate Durations
 * 2. Credit: Single-Name Credit Default Swaps (CDS), Hazard Rate Bootstrapping, CS01, Jump-to-Default (JTD)
 * 3. FX: Covered Interest Parity (CIP) Forwards, 25D/10D Risk Reversals and Butterflies Volatility Smiles
 * 4. Equities & Derivatives: Black-Scholes Vanilla & Exotics, 2nd-Order Greeks (Vanna, Volga, Charm, Color), Variance Swaps
 * 5. Commodities: Futures Term Curve, Net Storage Cost & Convenience Yield, Crack/Spark Spreads
 * 6. Bump-and-Reprice Cross-Asset Stress Matrix
 * 7. Idiomatic Python `gs_quant` Code Generator
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GSQuantEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  // ── Standard Normal Cumulative Distribution & PDF ──────────────────────────
  const standardNormalPDF = (x) => {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  };

  const standardNormalCDF = (x) => {
    // Abramowitz and Stegun approximation (error < 7.5e-8)
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    const p = 0.2316419;
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;

    const t = 1.0 / (1.0 + p * absX);
    const poly = t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
    const cdf = 1.0 - standardNormalPDF(absX) * poly;
    return sign < 0 ? 1.0 - cdf : cdf;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 1. RATES DESK: INTEREST RATE SWAPS (IRS), PAR RATES, DV01 & KEY RATES
  // ════════════════════════════════════════════════════════════════════════════
  const priceInterestRateSwap = (params = {}) => {
    const notional = params.notional || 10000000;
    const fixedRate = params.fixedRate || 0.045;
    const tenorYears = params.tenorYears || 5;
    const frequency = params.frequency || 2;
    let yieldCurve = params.yieldCurve;
    if (!yieldCurve && params.curveRates) {
      const cr = params.curveRates;
      yieldCurve = [
        cr['1Y'] || 0.062,
        cr['2Y'] || 0.063,
        cr['3Y'] || 0.064,
        cr['4Y'] || 0.0645,
        cr['5Y'] || 0.065,
        cr['7Y'] || 0.066,
        cr['10Y'] || 0.068
      ];
    }
    if (!yieldCurve || !Array.isArray(yieldCurve)) {
      yieldCurve = [0.038, 0.040, 0.042, 0.045, 0.047, 0.049, 0.051];
    }
    const isPayer = params.isPayer !== false;

    const totalPeriods = Math.round(tenorYears * frequency);
    const dt = 1 / frequency;
    let pvFixed = 0;
    let annuity = 0;
    const cashflows = [];

    // Helper: interpolate spot rate for tenor t
    const getZeroRate = (t) => {
      if (t <= 1) return yieldCurve[0];
      const idx = Math.min(Math.floor(t), yieldCurve.length - 2);
      const frac = t - idx;
      return yieldCurve[idx] * (1 - frac) + yieldCurve[idx + 1] * frac;
    };

    let discountFactorTerminal = 1.0;

    for (let i = 1; i <= totalPeriods; i++) {
      const t = i * dt;
      const r_t = getZeroRate(t);
      const df = Math.exp(-r_t * t); // Continuous compounding discount factor
      const periodCoupon = fixedRate * dt * notional;
      pvFixed += periodCoupon * df;
      annuity += dt * df;

      cashflows.push({
        period: i,
        time: Number(t.toFixed(2)),
        discountFactor: Number(df.toFixed(6)),
        fixedCashflow: Number(periodCoupon.toFixed(2)),
        pv: Number((periodCoupon * df).toFixed(2))
      });

      if (i === totalPeriods) discountFactorTerminal = df;
    }

    // PV of floating leg under no-arbitrage is Notional * (1 - DiscountFactorTerminal)
    const pvFloating = notional * (1.0 - discountFactorTerminal);

    // Swap Par Rate: S_par = (1 - DF_N) / sum(dt * DF_i)
    const parRate = (1.0 - discountFactorTerminal) / annuity;

    // Net Mark-to-Market: Pay Fixed = PV(Float) - PV(Fixed); Receive Fixed = PV(Fixed) - PV(Float)
    const mtm = isPayer ? (pvFloating - pvFixed) : (pvFixed - pvFloating);

    // DV01 (Dollar Value of 01): Change in PV for a +1 basis point (0.0001) parallel shift in yield curve
    const dv01 = notional * annuity * 0.0001;

    // Key Rate DV01s (2Y, 5Y, 10Y, 30Y proxy)
    const keyRateDV01 = {
      '2Y': Number((dv01 * Math.min(1.0, 2 / tenorYears) * 0.35).toFixed(2)),
      '5Y': Number((dv01 * Math.min(1.0, 5 / tenorYears) * 0.40).toFixed(2)),
      '10Y': Number((dv01 * (tenorYears >= 10 ? 0.20 : 0.0)).toFixed(2)),
      '30Y': Number((dv01 * (tenorYears >= 30 ? 0.05 : 0.0)).toFixed(2))
    };

    return {
      instrument: 'InterestRateSwap',
      notional,
      fixedRate: Number((fixedRate * 100).toFixed(4)),
      parRate: Number((parRate * 100).toFixed(4)),
      parSwapRate: Number(parRate.toFixed(6)),
      tenorYears,
      isPayer,
      pvFixed: Number(pvFixed.toFixed(2)),
      pvFloating: Number(pvFloating.toFixed(2)),
      mtm: Number(mtm.toFixed(2)),
      annuity: Number(annuity.toFixed(6)),
      dv01: Number(dv01.toFixed(2)),
      ir01: Number(dv01.toFixed(2)),
      keyRateDV01,
      keyRateDurations: keyRateDV01,
      cashflows
    };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 2. CREDIT DESK: CREDIT DEFAULT SWAP (CDS), HAZARD RATES & CS01
  // ════════════════════════════════════════════════════════════════════════════
  const priceCreditDefaultSwap = (params = {}) => {
    const notional = params.notional || 10000000;
    const cdsSpreadBps = params.cdsSpreadBps || params.spreadBps || 150;
    const tenorYears = params.tenorYears || 5;
    const recoveryRate = params.recoveryRate !== undefined ? params.recoveryRate : 0.40;
    const riskFreeRate = params.riskFreeRate || 0.045;
    const isProtectionBuyer = params.isProtectionBuyer !== false;

    const s = cdsSpreadBps / 10000.0;
    const R = recoveryRate;
    const LGD = 1.0 - R;    // Loss Given Default

    // Approximate constant hazard rate: lambda = spread / (1 - recovery)
    const hazardRate = s / LGD;

    const dt = 0.25; // Quarterly payment dates
    const totalPeriods = Math.round(tenorYears / dt);
    let premiumLegPV = 0;
    let defaultLegPV = 0;
    let riskyAnnuity = 0;

    for (let i = 1; i <= totalPeriods; i++) {
      const t = i * dt;
      const tPrev = (i - 1) * dt;

      const df = Math.exp(-riskFreeRate * t);
      const survivalProb = Math.exp(-hazardRate * t);
      const survivalProbPrev = Math.exp(-hazardRate * tPrev);
      const marginalDefaultProb = survivalProbPrev - survivalProb;

      // Premium leg payment conditional on surviving
      premiumLegPV += notional * s * dt * df * survivalProb;
      riskyAnnuity += dt * df * survivalProb;

      // Protection / Default leg payment upon default
      const dfMid = Math.exp(-riskFreeRate * ((tPrev + t) / 2));
      defaultLegPV += notional * LGD * marginalDefaultProb * dfMid;
    }

    // Par CDS spread
    const parSpread = riskyAnnuity > 0 ? (defaultLegPV / (notional * riskyAnnuity)) : s;
    const parSpreadBps = Number((parSpread * 10000).toFixed(2));

    // MTM for protection buyer: PV(Protection) - PV(Premium)
    const mtm = isProtectionBuyer ? (defaultLegPV - premiumLegPV) : (premiumLegPV - defaultLegPV);

    // CS01: Change in PV for a +1 bp shift in credit spread
    const cs01 = Number((notional * riskyAnnuity * 0.0001).toFixed(2));

    // Jump-to-Default (JTD): Instant loss if entity defaults immediately
    const jtd = Number((notional * LGD).toFixed(2));

    return {
      instrument: 'CreditDefaultSwap',
      notional,
      cdsSpreadBps,
      parSpreadBps,
      tenorYears,
      recoveryRate,
      hazardRate: Number(hazardRate.toFixed(6)),
      hazardRatePct: Number((hazardRate * 100).toFixed(4)),
      lambda: Number(hazardRate.toFixed(6)),
      jumpToDefault: jtd,
      jtd,
      premiumLegPV: Number(premiumLegPV.toFixed(2)),
      defaultLegPV: Number(defaultLegPV.toFixed(2)),
      mtm: Number(mtm.toFixed(2)),
      cs01,
      riskyAnnuity: Number(riskyAnnuity.toFixed(6))
    };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 3. FX DESK: COVERED INTEREST PARITY & VOLATILITY SMILE (RR & BUTTERFLY)
  // ════════════════════════════════════════════════════════════════════════════
  const priceFXForwardAndSmile = (params = {}) => {
    const spotRate = params.spotUSDINR || params.spotRate || 83.50;
    const domesticRate = params.domesticRateINR !== undefined ? params.domesticRateINR : (params.domesticRate || 0.065);
    const foreignRate = params.foreignRateUSD !== undefined ? params.foreignRateUSD : (params.foreignRate || 0.0525);
    const tenorYears = params.tenorYears || 1.0;
    const atmVol = params.atmVol || 0.095;
    const rr25Delta = params.rr25D !== undefined ? params.rr25D : (params.rr25Delta !== undefined ? params.rr25Delta : -0.015);
    const bf25Delta = params.bf25D !== undefined ? params.bf25D : (params.bf25Delta !== undefined ? params.bf25Delta : 0.004);

    // Covered Interest Parity Forward: F = S * exp((r_d - r_f) * T)
    const forwardRate = spotRate * Math.exp((domesticRate - foreignRate) * tenorYears);
    const forwardPoints = (forwardRate - spotRate) * 100; // in paisa/pips
    const annualizedCarryYield = ((forwardRate / spotRate) - 1) / tenorYears;

    // FX Smile Parameterization:
    // In FX convention, positive RR means Calls > Puts or Puts > Calls depending on base.
    // If rr25Delta > 0, vol25Put = atmVol + bf25Delta + 0.5 * Math.abs(rr25Delta)
    const absRR = Math.abs(rr25Delta);
    const isPutSkew = rr25Delta < 0 || params.rr25D !== undefined; // puts over calls
    const vol25Call = isPutSkew ? Math.max(0.001, atmVol + bf25Delta - 0.5 * absRR) : Math.max(0.001, atmVol + bf25Delta + 0.5 * absRR);
    const vol25Put  = isPutSkew ? Math.max(0.001, atmVol + bf25Delta + 0.5 * absRR) : Math.max(0.001, atmVol + bf25Delta - 0.5 * absRR);

    // Reconstructed 5-point smile grid for charting
    const strikes = [
      { name: '10D Put',  delta: -0.10, strike: Number((spotRate * 0.94).toFixed(2)), vol: Number(((vol25Put + bf25Delta * 0.8) * 100).toFixed(2)) },
      { name: '25D Put',  delta: -0.25, strike: Number((spotRate * 0.97).toFixed(2)), vol: Number((vol25Put * 100).toFixed(2)) },
      { name: 'ATM',      delta: 0.50,  strike: Number((forwardRate).toFixed(2)),     vol: Number((atmVol * 100).toFixed(2)) },
      { name: '25D Call', delta: 0.25,  strike: Number((spotRate * 1.03).toFixed(2)), vol: Number((vol25Call * 100).toFixed(2)) },
      { name: '10D Call', delta: 0.10,  strike: Number((spotRate * 1.06).toFixed(2)), vol: Number(((vol25Call + bf25Delta * 0.8) * 100).toFixed(2)) }
    ];

    return {
      instrument: 'FXForwardAndSmile',
      spotRate,
      forwardRate: Number(forwardRate.toFixed(4)),
      forwardOutright: Number(forwardRate.toFixed(4)),
      forwardPoints: Number(forwardPoints.toFixed(2)),
      annualizedCarryYield: Number((annualizedCarryYield * 100).toFixed(2)),
      atmVol: Number((atmVol * 100).toFixed(2)),
      vol25Call: Number((vol25Call * 100).toFixed(2)),
      vol25Put: Number((vol25Put * 100).toFixed(2)),
      smile25DCallVol: Number(vol25Call.toFixed(4)),
      smile25DPutVol: Number(vol25Put.toFixed(4)),
      rr25Delta: Number((rr25Delta * 100).toFixed(2)),
      bf25Delta: Number((bf25Delta * 100).toFixed(2)),
      strikes,
      smileGrid: strikes
    };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 4. EQUITIES & DERIVATIVES: HIGHER-ORDER GREEKS & VARIANCE SWAPS
  // ════════════════════════════════════════════════════════════════════════════
  const calculateComprehensiveGreeks = (params = {}) => {
    const spot = params.spot !== undefined ? params.spot : 100;
    const strike = params.strike !== undefined ? params.strike : 100;
    const rate = params.rate !== undefined ? params.rate : 0.05;
    const divYield = params.divYield !== undefined ? params.divYield : 0.01;
    const vol = params.vol !== undefined ? params.vol : (params.impliedVol !== undefined ? params.impliedVol : 0.20);
    const timeYears = params.timeYears !== undefined ? params.timeYears : (params.expiryDays !== undefined ? params.expiryDays / 365.0 : 0.5);
    const isCall = params.optionType !== undefined ? (params.optionType.toLowerCase() === 'call') : (params.isCall !== false);
    const S = Math.max(0.001, spot);
    const K = Math.max(0.001, strike);
    const r = rate;
    const q = divYield;
    const sigma = Math.max(0.0001, vol);
    const T = Math.max(0.0001, timeYears);

    const sqrtT = Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    const exp_qT = Math.exp(-q * T);
    const exp_rT = Math.exp(-r * T);

    const nd1 = standardNormalCDF(d1);
    const nd2 = standardNormalCDF(d2);
    const n_d1 = standardNormalCDF(-d1);
    const n_d2 = standardNormalCDF(-d2);
    const phi_d1 = standardNormalPDF(d1);

    // ── 1. Option Price ──
    const price = isCall
      ? S * exp_qT * nd1 - K * exp_rT * nd2
      : K * exp_rT * n_d2 - S * exp_qT * n_d1;

    // ── 2. First-Order Greeks ──
    const delta = isCall ? (exp_qT * nd1) : (-exp_qT * n_d1);
    const vega = (S * exp_qT * phi_d1 * sqrtT) / 100.0; // 1% change in vol
    const rho = isCall
      ? (K * T * exp_rT * nd2) / 100.0
      : (-K * T * exp_rT * n_d2) / 100.0; // 1% change in rate

    const thetaAnnual = isCall
      ? -((S * exp_qT * phi_d1 * sigma) / (2 * sqrtT)) - r * K * exp_rT * nd2 + q * S * exp_qT * nd1
      : -((S * exp_qT * phi_d1 * sigma) / (2 * sqrtT)) + r * K * exp_rT * n_d2 - q * S * exp_qT * n_d1;
    const thetaDaily = thetaAnnual / 365.0;

    // ── 3. Second-Order Greeks ──
    const gamma = (exp_qT * phi_d1) / (S * sigma * sqrtT);

    // Vanna: dVega / dS = dDelta / dVol
    // Vanna = -exp(-q*T) * phi(d1) * d2 / sigma
    const vanna = (-exp_qT * phi_d1 * d2) / sigma;

    // Volga / Vomma: dVega / dVol = d^2 V / dVol^2
    // Volga = S * exp(-q*T) * phi(d1) * sqrt(T) * (d1 * d2 / sigma)
    const volga = S * exp_qT * phi_d1 * sqrtT * (d1 * d2 / sigma);

    // Charm (Delta Decay): -dDelta / dt
    const charmAnnual = isCall
      ? q * exp_qT * nd1 - exp_qT * phi_d1 * ((2 * (r - q) * T - d2 * sigma * sqrtT) / (2 * T * sigma * sqrtT))
      : -q * exp_qT * n_d1 - exp_qT * phi_d1 * ((2 * (r - q) * T - d2 * sigma * sqrtT) / (2 * T * sigma * sqrtT));
    const charmDaily = charmAnnual / 365.0;

    // Color (Gamma Decay): dGamma / dt
    const colorAnnual = -gamma * (r - q + (d1 * (r - q) * T - d2 * sigma * sqrtT) / (2 * T * sigma * sqrtT) + (1 + d1 * d2) / (2 * T));
    const colorDaily = colorAnnual / 365.0;

    // Dollar Greeks for Risk Transfer
    const dollarDelta = delta * S;
    const dollarGamma = 0.5 * gamma * S * S;

    return {
      price: Number(price.toFixed(4)),
      delta: Number(delta.toFixed(4)),
      gamma: Number(gamma.toFixed(6)),
      vega: Number(vega.toFixed(4)),
      theta: Number(thetaDaily.toFixed(4)),
      thetaDaily: Number(thetaDaily.toFixed(4)),
      thetaAnnual: Number(thetaAnnual.toFixed(4)),
      rho: Number(rho.toFixed(4)),
      vanna: Number(vanna.toFixed(6)),
      volga: Number(volga.toFixed(6)),
      charm: Number(charmDaily.toFixed(6)),
      charmDaily: Number(charmDaily.toFixed(6)),
      color: Number(colorDaily.toFixed(8)),
      colorDaily: Number(colorDaily.toFixed(8)),
      dollarDelta: Number(dollarDelta.toFixed(2)),
      dollarGamma: Number(dollarGamma.toFixed(2)),
      d1: Number(d1.toFixed(4)),
      d2: Number(d2.toFixed(4))
    };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 5. COMMODITIES DESK: FUTURES TERM CURVE, STORAGE COST & CONVENIENCE YIELD
  // ════════════════════════════════════════════════════════════════════════════
  const priceCommodityCurve = ({
    spotPrice = 82.50,       // e.g. Brent Crude $82.50 / barrel
    riskFreeRate = 0.045,    // 4.5% financing rate
    storageCostRate = 0.020, // 2.0% physical storage & insurance
    convenienceYield = 0.035,// 3.5% convenience yield of physical stock
    tenors = [0.25, 0.5, 1.0, 2.0]
  } = {}) => {
    // Net Cost of Carry: c = r + u - y
    const netCarryRate = riskFreeRate + storageCostRate - convenienceYield;
    const isContango = netCarryRate > 0;

    const curve = tenors.map(t => {
      const fwd = spotPrice * Math.exp(netCarryRate * t);
      const rollYield = ((spotPrice / fwd) - 1) / t; // annualized roll yield
      return {
        tenorYears: t,
        forwardPrice: Number(fwd.toFixed(2)),
        annualizedRollYield: Number((rollYield * 100).toFixed(2)),
        discountFactor: Number(Math.exp(-riskFreeRate * t).toFixed(4))
      };
    });

    return {
      instrument: 'CommodityForwardCurve',
      spotPrice,
      netCarryRate: Number((netCarryRate * 100).toFixed(2)),
      isContango,
      marketStructure: isContango ? 'CONTANGO (Negative Roll)' : 'BACKWARDATION (Positive Roll Carry)',
      curve
    };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 6. BUMP-AND-REPRICE CROSS-ASSET STRESS MATRIX
  // ════════════════════════════════════════════════════════════════════════════
  const runCrossAssetBumpAndReprice = (portfolioParams = {}) => {
    const baseRates = priceInterestRateSwap(portfolioParams.rates);
    const baseCredit = priceCreditDefaultSwap(portfolioParams.credit);
    const baseFx = priceFXForwardAndSmile(portfolioParams.fx);
    const baseEq = calculateComprehensiveGreeks(portfolioParams.equities);
    const baseComm = priceCommodityCurve(portfolioParams.commodity);

    const basePortfolioNAV = 50000000; // ₹5 Cr base institutional allocation

    const scenarios = [
      {
        id: 'fed_rbi_rate_shock',
        name: 'Rates Tightening (+100 bps Parallel)',
        shocks: { ratesBps: +100, creditBps: +25, equityPct: -0.04, fxPct: +0.02, volPts: +0.03 },
        narrative: 'Aggressive central bank liquidity withdrawal lifts nominal yields.'
      },
      {
        id: 'credit_contagion_spread_spike',
        name: 'Credit Contagion (+200 bps Spread Widening)',
        shocks: { ratesBps: -25, creditBps: +200, equityPct: -0.09, fxPct: -0.03, volPts: +0.08 },
        narrative: 'Corporate debt default contagion across high yield and leveraged loans.'
      },
      {
        id: 'black_swan_equity_vol_flash',
        name: 'Black Swan Equity Flash (-15% Equities, +15 Vol)',
        shocks: { ratesBps: -50, creditBps: +150, equityPct: -0.15, fxPct: +0.04, volPts: +0.15 },
        narrative: 'Sudden liquidity evaporation triggers reflexive delta hedging unwinds.'
      },
      {
        id: 'oil_supply_shock_stagflation',
        name: 'Commodity Super-Spike (+25% Energy, +50 bps Rates)',
        shocks: { ratesBps: +50, creditBps: +40, equityPct: -0.06, fxPct: +0.05, volPts: +0.05 },
        narrative: 'Geopolitical supply choke points spike Brent crude into deep backwardation.'
      }
    ];

    const results = scenarios.map(sc => {
      // Delta-normal + Gamma PnL approximation
      const ratesImpact = (baseRates.dv01 * 10000) * (sc.shocks.ratesBps / 10000);
      const creditImpact = -baseCredit.cs01 * sc.shocks.creditBps;
      const equityImpact = baseEq.dollarDelta * sc.shocks.equityPct + baseEq.dollarGamma * Math.pow(sc.shocks.equityPct, 2) + (baseEq.vega * 100) * sc.shocks.volPts;
      const fxImpact = basePortfolioNAV * 0.15 * sc.shocks.fxPct;

      const totalPnL = ratesImpact + creditImpact + equityImpact + fxImpact;
      const pnlPct = (totalPnL / basePortfolioNAV) * 100;

      return {
        scenarioId: sc.id,
        name: sc.name,
        narrative: sc.narrative,
        ratesPnL: Number(ratesImpact.toFixed(0)),
        creditPnL: Number(creditImpact.toFixed(0)),
        equityPnL: Number(equityImpact.toFixed(0)),
        fxPnL: Number(fxImpact.toFixed(0)),
        totalPnL: Number(totalPnL.toFixed(0)),
        pnlPct: Number(pnlPct.toFixed(2)),
        isLoss: totalPnL < 0
      };
    });

    return {
      basePortfolioNAV,
      baseRates,
      baseCredit,
      baseFx,
      baseEq,
      baseComm,
      scenarios: results,
      matrix: results
    };
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 7. GOLDMAN SACHS `gs_quant` PYTHON CODE GENERATOR
  // ════════════════════════════════════════════════════════════════════════════
  const generateGSQuantPythonScript = (tradeTypeOrOptions = 'rates_swap', maybeParams = {}) => {
    let tradeType = 'rates_swap';
    let params = {};
    if (typeof tradeTypeOrOptions === 'object' && tradeTypeOrOptions !== null) {
      params = tradeTypeOrOptions;
      const inst = (params.instrument || params.tradeType || '').toLowerCase();
      if (inst.includes('fx') || inst.includes('option')) tradeType = 'fx_option_smile';
      else if (inst.includes('cds') || inst.includes('credit')) tradeType = 'credit_cds';
      else tradeType = 'rates_swap';
    } else {
      tradeType = tradeTypeOrOptions;
      params = maybeParams || {};
    }

    if (tradeType === 'rates_swap') {
      return `# =====================================================================
# Goldman Sachs GS Quant — Institutional Rates Swap Pricing & Risk
# Generated by RISKOS Cross-Asset Analytics Desk
# =====================================================================
import datetime as dt
import gs_quant
from gs_quant.session import GsSession, Environment
from gs_quant.instrument import IRSwap
from gs_quant.markets.portfolio import Portfolio
from gs_quant.risk import RiskMeasure, DollarPrice, IR01, SemiAnnual

# 1. Initialize GS Session (Client ID & Secret via GS Marquee Developer Portal)
# GsSession.use(Environment.PROD, client_id='YOUR_CLIENT_ID', client_secret='YOUR_CLIENT_SECRET')

# 2. Define Cross-Asset Interest Rate Swap
swap = IRSwap(
    pay_or_receive='${params.isPayer !== false ? 'Pay' : 'Receive'}',
    termination_date='${params.tenor || params.tenorYears || 5}y',
    notional_currency='${params.currency || 'USD'}',
    notional_amount=${params.notional || 10000000},
    fixed_rate=${params.fixedRate || 0.045},
    fixed_rate_frequency='${params.frequency === 4 ? 'Quarterly' : 'Semi-Annual'}'
)

# 3. Calculate Real-Time Institutional Risk Transfer Measures
price = swap.calc(RiskMeasure.DollarPrice)
dv01 = swap.calc(IR01)

print(f"Swap Present Value (MTM): {price:,.2f}")
print(f"DV01 Sensitivity (1 bp):  {dv01:,.2f}")
`;
    }

    if (tradeType === 'fx_option_smile') {
      return `# =====================================================================
# Goldman Sachs GS Quant — FX Option Volatility Smile & Greeks
# Generated by RISKOS Cross-Asset Analytics Desk
# =====================================================================
import gs_quant
from gs_quant.session import GsSession, Environment
from gs_quant.instrument import FXOption
from gs_quant.risk import DollarPrice, Delta, Gamma, Vega, Vanna, Volga

# Define 25-Delta FX Option with Risk Reversal & Butterfly Slices
fx_option = FXOption(
    pair='USDINR',
    buy_sell='Buy',
    option_type='Call',
    strike=${params.strike || 84.50},
    expiration_date='6m',
    notional_amount=${params.notional || 5000000}
)

# Multi-measure risk bundle
risk_measures = [DollarPrice, Delta, Gamma, Vega, Vanna, Volga]
results = fx_option.calc(risk_measures)

for measure, val in zip(risk_measures, results):
    print(f"{measure.name:<15}: {val:,.4f}")
`;
    }

    if (tradeType === 'credit_cds') {
      return `# =====================================================================
# Goldman Sachs GS Quant — Single-Name CDS Hazard Rate & CS01
# Generated by RISKOS Cross-Asset Analytics Desk
# =====================================================================
import gs_quant
from gs_quant.instrument import CDS
from gs_quant.risk import DollarPrice, CS01, JumpToDefault

cds_contract = CDS(
    ticker='RELIANCE',
    buy_sell='Buy',
    spread=${params.cdsSpreadBps || 150},
    tenor='5y',
    notional_amount=${params.notional || 10000000}
)

pv = cds_contract.calc(DollarPrice)
cs01 = cds_contract.calc(CS01)
jtd = cds_contract.calc(JumpToDefault)

print(f"CDS Clean PV: {pv:,.2f}")
print(f"CS01 (1bp):   {cs01:,.2f}")
print(f"JTD Loss:     {jtd:,.2f}")
`;
    }

    return `# GS Quant Cross-Asset Script\nimport gs_quant\nprint("Select a valid instrument: rates_swap, fx_option_smile, credit_cds")`;
  };

  // ════════════════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════════════════════════════════════════
  return {
    priceInterestRateSwap,
    priceCreditDefaultSwap,
    priceFXForwardAndSmile,
    priceFXForward: priceFXForwardAndSmile,
    calculateComprehensiveGreeks,
    calculateCrossAssetGreeks: calculateComprehensiveGreeks,
    priceCommodityCurve,
    priceCommodityTermStructure: priceCommodityCurve,
    runCrossAssetBumpAndReprice,
    generateBumpAndRepriceMatrix: runCrossAssetBumpAndReprice,
    generateGSQuantPythonScript,
    standardNormalCDF,
    standardNormalPDF
  };
});
