/**
 * RISKOS — Backtrader Quantitative Strategy & Cerebro Execution Engine
 * A faithful JavaScript implementation of the Python Backtrader framework (mementum/backtrader).
 * Provides Cerebro runner, Strategy lifecycle, Indicators, Position Sizers, Commission schemes,
 * and standard Analyzers (SharpeRatio, DrawDown, SQN, VWR, TradeAnalyzer).
 */

const BacktraderEngine = (() => {
  'use strict';

  // ── 1. INDICATORS SUITE ──────────────────────────────────────────────────
  const Indicators = {
    // Simple Moving Average
    SMA: (data, period = 20) => {
      const result = new Array(data.length).fill(null);
      for (let i = period - 1; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += data[i - j].close;
        }
        result[i] = sum / period;
      }
      return result;
    },

    // Exponential Moving Average
    EMA: (data, period = 20) => {
      const result = new Array(data.length).fill(null);
      const k = 2 / (period + 1);
      let sum = 0;
      for (let i = 0; i < period; i++) sum += data[i].close;
      let prevEma = sum / period;
      result[period - 1] = prevEma;

      for (let i = period; i < data.length; i++) {
        const ema = (data[i].close - prevEma) * k + prevEma;
        result[i] = ema;
        prevEma = ema;
      }
      return result;
    },

    // Relative Strength Index
    RSI: (data, period = 14) => {
      const result = new Array(data.length).fill(null);
      if (data.length <= period) return result;

      let gains = 0, losses = 0;
      for (let i = 1; i <= period; i++) {
        const diff = data[i].close - data[i - 1].close;
        if (diff >= 0) gains += diff;
        else losses += Math.abs(diff);
      }

      let avgGain = gains / period;
      let avgLoss = losses / period;
      let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result[period] = 100 - (100 / (1 + rs));

      for (let i = period + 1; i < data.length; i++) {
        const diff = data[i].close - data[i - 1].close;
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? Math.abs(diff) : 0;

        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;

        rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        result[i] = 100 - (100 / (1 + rs));
      }
      return result;
    },

    // Bollinger Bands
    BollingerBands: (data, period = 20, devfactor = 2.0) => {
      const sma = Indicators.SMA(data, period);
      const top = new Array(data.length).fill(null);
      const bot = new Array(data.length).fill(null);

      for (let i = period - 1; i < data.length; i++) {
        let sumSq = 0;
        const mean = sma[i];
        for (let j = 0; j < period; j++) {
          sumSq += Math.pow(data[i - j].close - mean, 2);
        }
        const std = Math.sqrt(sumSq / period);
        top[i] = mean + devfactor * std;
        bot[i] = mean - devfactor * std;
      }

      return { mid: sma, top, bot };
    },

    // Average True Range (ATR)
    ATR: (data, period = 14) => {
      const tr = [data[0].high - data[0].low];
      for (let i = 1; i < data.length; i++) {
        const h_l = data[i].high - data[i].low;
        const h_pc = Math.abs(data[i].high - data[i - 1].close);
        const l_pc = Math.abs(data[i].low - data[i - 1].close);
        tr.push(Math.max(h_l, h_pc, l_pc));
      }

      const result = new Array(data.length).fill(null);
      let sum = 0;
      for (let i = 0; i < period; i++) sum += tr[i];
      let prevAtr = sum / period;
      result[period - 1] = prevAtr;

      for (let i = period; i < data.length; i++) {
        prevAtr = (prevAtr * (period - 1) + tr[i]) / period;
        result[i] = prevAtr;
      }
      return result;
    }
  };

  // ── 2. BROKER SIMULATOR ──────────────────────────────────────────────────
  class Broker {
    constructor({ cash = 1000000, commission = 0.0005, slippage = 0.0002 } = {}) {
      this.initialCash = cash;
      this.cash = cash;
      this.commission = commission;
      this.slippage = slippage;
      this.positions = {}; // { symbol: { size: 0, costBasis: 0 } }
      this.orders = [];
      this.trades = [];
      this.equityHistory = [];
    }

    getPosition(symbol) {
      return this.positions[symbol] || { size: 0, costBasis: 0 };
    }

    getValue(currentPrices = {}) {
      let positionValue = 0;
      for (const [sym, pos] of Object.entries(this.positions)) {
        const price = currentPrices[sym] || pos.costBasis;
        positionValue += pos.size * price;
      }
      return this.cash + positionValue;
    }

    executeOrder(order, currentBar) {
      const sym = order.symbol;
      const pos = this.getPosition(sym);
      const isBuy = order.size > 0;
      const absSize = Math.abs(order.size);

      // Slippage modeling
      const executionPrice = isBuy
        ? currentBar.close * (1 + this.slippage)
        : currentBar.close * (1 - this.slippage);

      const notional = absSize * executionPrice;
      const comm = notional * this.commission;

      if (isBuy) {
        const totalOutflow = notional + comm;
        if (this.cash < totalOutflow) {
          order.status = 'REJECTED_MARGIN';
          return null;
        }
        this.cash -= totalOutflow;
        const newSize = pos.size + absSize;
        const newCost = (pos.size * pos.costBasis + notional) / newSize;
        this.positions[sym] = { size: newSize, costBasis: newCost };
      } else {
        // Selling / Closing
        const totalInflow = notional - comm;
        this.cash += totalInflow;
        const pnl = (executionPrice - pos.costBasis) * absSize - comm;

        this.trades.push({
          symbol: sym,
          size: absSize,
          entryPrice: pos.costBasis,
          exitPrice: executionPrice,
          pnl: pnl,
          pnlPct: pos.costBasis > 0 ? (executionPrice - pos.costBasis) / pos.costBasis : 0,
          date: currentBar.date
        });

        const newSize = pos.size - absSize;
        this.positions[sym] = { size: Math.max(0, newSize), costBasis: newSize > 0 ? pos.costBasis : 0 };
      }

      order.status = 'FILLED';
      order.executionPrice = executionPrice;
      order.commission = comm;
      order.date = currentBar.date;

      return order;
    }
  }

  // ── 3. STRATEGY BASE CLASS ───────────────────────────────────────────────
  class Strategy {
    constructor(broker, params = {}) {
      this.broker = broker;
      this.params = params;
      this.data = [];
      this.indicators = {};
      this.position = { size: 0, costBasis: 0 };
      this.orders = [];
    }

    init() {}
    next(i, bar) {}

    buy(size = 100, symbol = 'ASSET') {
      const order = { id: `ORD_${Date.now()}_${Math.random()}`, symbol, size, type: 'BUY', status: 'SUBMITTED' };
      this.orders.push(order);
      return this.broker.executeOrder(order, this.data[this.currentIndex]);
    }

    sell(size = 100, symbol = 'ASSET') {
      const order = { id: `ORD_${Date.now()}_${Math.random()}`, symbol, size: -size, type: 'SELL', status: 'SUBMITTED' };
      this.orders.push(order);
      return this.broker.executeOrder(order, this.data[this.currentIndex]);
    }

    close(symbol = 'ASSET') {
      const pos = this.broker.getPosition(symbol);
      if (pos.size > 0) {
        return this.sell(pos.size, symbol);
      }
    }
  }

  // ── 4. STANDARD STRATEGIES ───────────────────────────────────────────────
  class DualMovingAverageCrossStrategy extends Strategy {
    init() {
      const fastP = this.params.fast || 10;
      const slowP = this.params.slow || 30;
      this.indicators.fastSma = Indicators.SMA(this.data, fastP);
      this.indicators.slowSma = Indicators.SMA(this.data, slowP);
    }

    next(i, bar) {
      if (i < (this.params.slow || 30)) return;

      const fastPrev = this.indicators.fastSma[i - 1];
      const fastCurr = this.indicators.fastSma[i];
      const slowPrev = this.indicators.slowSma[i - 1];
      const slowCurr = this.indicators.slowSma[i];
      const pos = this.broker.getPosition(bar.symbol || 'ASSET');

      // Golden Cross (Buy Signal)
      if (fastPrev <= slowPrev && fastCurr > slowCurr && pos.size === 0) {
        const cashToDeploy = this.broker.cash * (this.params.allocation || 0.95);
        const qty = Math.floor(cashToDeploy / bar.close);
        if (qty > 0) this.buy(qty, bar.symbol || 'ASSET');
      }
      // Death Cross (Sell Signal)
      else if (fastPrev >= slowPrev && fastCurr < slowCurr && pos.size > 0) {
        this.close(bar.symbol || 'ASSET');
      }
    }
  }

  class BollingerMeanReversionStrategy extends Strategy {
    init() {
      const period = this.params.period || 20;
      const dev = this.params.dev || 2.0;
      this.indicators.bb = Indicators.BollingerBands(this.data, period, dev);
      this.indicators.rsi = Indicators.RSI(this.data, 14);
    }

    next(i, bar) {
      if (i < 20) return;
      const bb = this.indicators.bb;
      const rsi = this.indicators.rsi[i];
      const pos = this.broker.getPosition(bar.symbol || 'ASSET');

      // Oversold bounce at lower band
      if (bar.close < bb.bot[i] && rsi < 35 && pos.size === 0) {
        const qty = Math.floor((this.broker.cash * 0.9) / bar.close);
        if (qty > 0) this.buy(qty, bar.symbol || 'ASSET');
      }
      // Overbought reversion at upper band or mid band target
      else if ((bar.close > bb.top[i] || (bar.close > bb.mid[i] && rsi > 70)) && pos.size > 0) {
        this.close(bar.symbol || 'ASSET');
      }
    }
  }

  class RSIOscillatorStrategy extends Strategy {
    init() {
      this.indicators.rsi = Indicators.RSI(this.data, this.params.period || 14);
    }

    next(i, bar) {
      const rsi = this.indicators.rsi[i];
      if (rsi === null) return;
      const pos = this.broker.getPosition(bar.symbol || 'ASSET');

      if (rsi < (this.params.oversold || 30) && pos.size === 0) {
        const qty = Math.floor((this.broker.cash * 0.95) / bar.close);
        if (qty > 0) this.buy(qty, bar.symbol || 'ASSET');
      } else if (rsi > (this.params.overbought || 70) && pos.size > 0) {
        this.close(bar.symbol || 'ASSET');
      }
    }
  }

  // ── 5. ANALYZERS SUITE ───────────────────────────────────────────────────
  const Analyzers = {
    // Sharpe Ratio & Sortino Ratio
    SharpeRatio: (equityCurve, riskFreeRate = 0.05) => {
      const returns = [];
      for (let i = 1; i < equityCurve.length; i++) {
        returns.push((equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value);
      }
      if (returns.length < 2) return { sharpe: 0, sortino: 0 };

      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
      const std = Math.sqrt(variance);

      const rfDaily = riskFreeRate / 252;
      const excessReturn = mean - rfDaily;
      const sharpe = std > 0 ? (excessReturn / std) * Math.sqrt(252) : 0;

      // Downside deviation for Sortino
      const downsideVariance = returns.filter(r => r < 0).reduce((a, b) => a + Math.pow(b, 2), 0) / returns.length;
      const downsideStd = Math.sqrt(downsideVariance);
      const sortino = downsideStd > 0 ? (excessReturn / downsideStd) * Math.sqrt(252) : 0;

      return {
        sharpe: Number(sharpe.toFixed(2)),
        sortino: Number(sortino.toFixed(2)),
        annualizedReturnPct: Number(((Math.pow(1 + mean, 252) - 1) * 100).toFixed(2)),
        annualizedVolPct: Number((std * Math.sqrt(252) * 100).toFixed(2))
      };
    },

    // Maximum Peak-to-Trough Drawdown & Duration
    DrawDown: (equityCurve) => {
      let peak = -Infinity;
      let maxDd = 0;
      let maxDdDuration = 0;
      let currentDdDuration = 0;

      equityCurve.forEach(pt => {
        if (pt.value > peak) {
          peak = pt.value;
          currentDdDuration = 0;
        } else {
          const dd = (peak - pt.value) / peak;
          if (dd > maxDd) maxDd = dd;
          currentDdDuration++;
          if (currentDdDuration > maxDdDuration) maxDdDuration = currentDdDuration;
        }
      });

      return {
        maxDrawdownPct: Number((maxDd * 100).toFixed(2)),
        maxDrawdownDurationBars: maxDdDuration,
        peakEquity: Number(peak.toFixed(2))
      };
    },

    // System Quality Number (Van Tharp SQN = sqrt(N) * Mean / Std)
    SQN: (trades) => {
      if (!trades || trades.length < 2) return { sqn: 0, rating: 'INSUFFICIENT_TRADES' };
      const pnls = trades.map(t => t.pnl);
      const n = pnls.length;
      const mean = pnls.reduce((a, b) => a + b, 0) / n;
      const variance = pnls.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
      const std = Math.sqrt(variance);

      const sqn = std > 0 ? Math.sqrt(n) * (mean / std) : 0;
      let rating = 'POOR (SQN < 1.6)';
      if (sqn >= 5.0) rating = 'HOLY GRAIL (SQN >= 5.0)';
      else if (sqn >= 3.0) rating = 'EXCELLENT (SQN >= 3.0)';
      else if (sqn >= 2.0) rating = 'GOOD (SQN >= 2.0)';
      else if (sqn >= 1.6) rating = 'AVERAGE (SQN >= 1.6)';

      return {
        sqn: Number(sqn.toFixed(2)),
        rating,
        totalTrades: n
      };
    },

    // Variability-Weighted Return (VWR)
    VWR: (equityCurve) => {
      if (equityCurve.length < 2) return { vwrPct: 0 };
      const initVal = equityCurve[0].value;
      const finalVal = equityCurve[equityCurve.length - 1].value;
      const totalReturn = (finalVal - initVal) / initVal;

      // Variability penalty
      const dailyReturns = [];
      for (let i = 1; i < equityCurve.length; i++) {
        dailyReturns.push((equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value);
      }
      const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const std = Math.sqrt(dailyReturns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dailyReturns.length);
      const penalty = 1 / (1 + std * Math.sqrt(252));
      const vwr = totalReturn * penalty;

      return {
        vwrPct: Number((vwr * 100).toFixed(2)),
        totalReturnPct: Number((totalReturn * 100).toFixed(2))
      };
    },

    // Comprehensive Trade Analyzer
    TradeAnalyzer: (trades) => {
      if (!trades || trades.length === 0) {
        return { total: 0, won: 0, lost: 0, winRatePct: 0, profitFactor: 0, totalPnL: 0 };
      }

      let won = 0, lost = 0, grossProfit = 0, grossLoss = 0;
      trades.forEach(t => {
        if (t.pnl > 0) {
          won++;
          grossProfit += t.pnl;
        } else {
          lost++;
          grossLoss += Math.abs(t.pnl);
        }
      });

      const totalPnL = grossProfit - grossLoss;
      const winRate = (won / trades.length) * 100;
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;

      return {
        total: trades.length,
        won,
        lost,
        winRatePct: Number(winRate.toFixed(1)),
        profitFactor: Number(profitFactor.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossLoss: Number(grossLoss.toFixed(2)),
        totalPnL: Number(totalPnL.toFixed(2)),
        avgTradePnL: Number((totalPnL / trades.length).toFixed(2))
      };
    }
  };

  // ── 6. CEREBRO RUNNER ENGINE ─────────────────────────────────────────────
  class Cerebro {
    constructor() {
      this.datas = [];
      this.strats = [];
      this.analyzers = [];
      this.broker = new Broker({ cash: 1000000, commission: 0.0005, slippage: 0.0002 });
    }

    adddata(dataFeed) {
      this.datas.push(dataFeed);
      return this;
    }

    addstrategy(StrategyClass, params = {}) {
      this.strats.push({ StrategyClass, params });
      return this;
    }

    setbroker(brokerInstance) {
      this.broker = brokerInstance;
      return this;
    }

    run() {
      if (this.datas.length === 0 || this.strats.length === 0) {
        throw new Error("Cerebro requires at least 1 data feed and 1 strategy.");
      }

      const data = this.datas[0];
      const stratConfig = this.strats[0];
      const strategy = new stratConfig.StrategyClass(this.broker, stratConfig.params);
      strategy.data = data;
      strategy.init();

      const equityHistory = [];

      for (let i = 0; i < data.length; i++) {
        strategy.currentIndex = i;
        const currentBar = data[i];
        strategy.next(i, currentBar);

        const currentPrices = { [currentBar.symbol || 'ASSET']: currentBar.close };
        const currentEquity = this.broker.getValue(currentPrices);

        equityHistory.push({
          date: currentBar.date,
          value: currentEquity,
          cash: this.broker.cash,
          close: currentBar.close
        });
      }

      this.broker.equityHistory = equityHistory;

      // Run Analyzers
      const sharpeRes = Analyzers.SharpeRatio(equityHistory);
      const ddRes = Analyzers.DrawDown(equityHistory);
      const sqnRes = Analyzers.SQN(this.broker.trades);
      const vwrRes = Analyzers.VWR(equityHistory);
      const tradeRes = Analyzers.TradeAnalyzer(this.broker.trades);

      return {
        initialCash: this.broker.initialCash,
        finalValue: equityHistory[equityHistory.length - 1].value,
        totalReturnPct: Number((((equityHistory[equityHistory.length - 1].value - this.broker.initialCash) / this.broker.initialCash) * 100).toFixed(2)),
        equityHistory,
        trades: this.broker.trades,
        orders: strategy.orders,
        analyzers: {
          sharpe: sharpeRes,
          drawdown: ddRes,
          sqn: sqnRes,
          vwr: vwrRes,
          trades: tradeRes
        }
      };
    }
  }

  return {
    Cerebro,
    Broker,
    Strategy,
    Indicators,
    Analyzers,
    Strategies: {
      DualMovingAverageCrossStrategy,
      BollingerMeanReversionStrategy,
      RSIOscillatorStrategy
    }
  };
})();

// Attach globally for browser and node
if (typeof window !== 'undefined') {
  window.BacktraderEngine = BacktraderEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BacktraderEngine;
}
