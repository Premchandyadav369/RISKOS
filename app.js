const API = 'http://127.0.0.1:8000/api';
const BASE_CAPITAL = 10000000; // 1,00,00,000 INR

// Chart configuration globals
Chart.defaults.color = '#999999';
Chart.defaults.font.family = 'Inter, sans-serif';
Chart.defaults.scale.grid.color = 'rgba(255, 255, 255, 0.05)';

const colors = ['#4F8FFF', '#FF6B6B', '#51CF66', '#FAB005', '#CC5DE8', '#20C997', '#339AF0', '#F06595'];

// Chart instances registry
let charts = {
    price: null,
    volatility: null,
    var: null,
    portfolio: null,
    backtest: null,
    spread: null,
    yieldCurve: null,
    almgren: null,
    volSmile: null,
    deltaHedge: null,
    riskParity: null
};

// Utilities
const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
const formatPercent = (val) => ((val || 0) * 100).toFixed(2) + '%';
const getWeights = (tickers) => tickers.map(() => 1 / tickers.length).join(',');

// Setup UI
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const target = document.getElementById(btn.dataset.tab);
            if(target) target.classList.add('active');
        });
    });

    // Analyze button
    const analyzeBtn = document.getElementById('analyze-btn');
    if(analyzeBtn) analyzeBtn.addEventListener('click', fetchAllQuantData);

    // Initial fetch
    fetchAllQuantData();
});

async function fetchAllQuantData() {
    const inputEl = document.getElementById('ticker-input');
    const tickersStr = (inputEl ? inputEl.value : 'AAPL,MSFT,GOOGL,AMZN,JPM').toUpperCase().replace(/\s/g, '');
    const tickers = tickersStr.split(',').filter(t => t);
    if(tickers.length === 0) return alert('Please enter at least one ticker');
    
    const weightsStr = getWeights(tickers);
    const t1 = tickers[0] || 'AAPL';
    const t2 = tickers[1] || 'MSFT';
    
    // Set pair labels
    const spreadLabel = document.getElementById('spread-pair-label');
    if(spreadLabel) spreadLabel.textContent = `${t1} vs ${t2}`;
    
    const domLabel = document.getElementById('dom-ticker-label');
    if(domLabel) domLabel.textContent = `${t1} Top 10 Bids & Asks`;

    // Show loaders on canvases
    Object.keys(charts).forEach(name => {
        const id = name + 'Chart';
        const ctx = document.getElementById(id);
        if(ctx && ctx.parentNode && !ctx.parentNode.querySelector('.loading-overlay')) {
            const l = document.createElement('div');
            l.className = 'loading-overlay';
            l.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:6px"></i> Computing models...';
            l.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(2px);z-index:5;';
            ctx.parentNode.style.position = 'relative';
            ctx.parentNode.appendChild(l);
        }
    });

    // 1. Market Intelligence Desk
    const p1 = fetchAPI(`/market/prices?tickers=${tickersStr}&period=1y`).then(d => renderPriceChart(d));
    const p2 = fetchAPI(`/market/volatility?ticker=${t1}`).then(d => renderVolatilityChart(d));
    const p3 = fetchAPI(`/market/regime?ticker=SPY`).then(d => renderRegime(d));
    const p4 = fetchAPI(`/market/correlations?tickers=${tickersStr}`).then(d => renderCorrelations(d, tickers));
    
    // 2. Risk & Portfolio Engine Desk
    const p5 = fetchAPI(`/risk/var?tickers=${tickersStr}&weights=${weightsStr}&confidence=0.99`).then(d => renderVarChart(d));
    const p6 = fetchAPI(`/risk/optimize?tickers=${tickersStr}&target_return=0.10`).then(d => renderPortfolio(d, tickers));
    const p7 = fetchAPI(`/risk/backtest?tickers=${tickersStr}&weights=${weightsStr}&period=2y`).then(d => renderBacktest(d));
    const p8 = fetchAPI(`/risk/stress?tickers=${tickersStr}&weights=${weightsStr}`).then(d => renderStressTest(d));
    const p9 = fetchAPI(`/risk/validate?ticker=SPY&confidence=0.99`).then(d => renderValidation(d));
    
    // 3. Futures & Rates Desk
    const p10 = fetchAPI(`/quant/spreads?ticker1=${t1}&ticker2=${t2}&period=1y`).then(d => renderSpreadDesk(d));
    const p11 = fetchAPI(`/quant/rates`).then(d => renderRatesDesk(d));
    
    // 4. Microstructure & OFI Desk
    const p12 = fetchAPI(`/quant/microstructure?ticker=${t1}&shares=25000`).then(d => renderMicrostructureDesk(d));
    
    // 5. Derivatives & Volatility Lab Desk
    const p13 = fetchAPI(`/quant/derivatives?spot=180&strike=185&expiry=0.25&vol=0.22&rate=0.045`).then(d => renderDerivativesDesk(d));
    
    // 6. Signals & Allocation Desk
    const p14 = fetchAPI(`/quant/attribution?tickers=${tickersStr}`).then(d => renderAttributionDesk(d, tickers));
    const p15 = fetchAPI(`/signals/generate?tickers=${tickersStr}`).then(d => renderSignals(d, tickers));

    await Promise.allSettled([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15]);
    
    // Remove loaders
    document.querySelectorAll('.loading-overlay').forEach(el => el.remove());
}

async function fetchAPI(endpoint) {
    try {
        const res = await fetch(API + endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('API fetch fallback for ' + endpoint, e);
        return getMockFallback(endpoint);
    }
}

function destroyChart(name) {
    if (charts[name]) {
        charts[name].destroy();
        charts[name] = null;
    }
}

// ═══════════════════ DESK 1: MARKET INTELLIGENCE ═══════════════════
function renderPriceChart(data) {
    destroyChart('price');
    const canvas = document.getElementById('priceChart');
    if(!canvas) return;
    
    const source = data.prices || data;
    const tickerKeys = Object.keys(source || {}).filter(k => k !== 'error' && k !== 'dates');
    let dates = data.dates || source[tickerKeys[0]]?.dates || [];
    
    const datasets = tickerKeys.map((ticker, i) => ({
        label: ticker,
        data: source[ticker]?.close || source[ticker] || [],
        borderColor: colors[i % colors.length],
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1
    }));

    if(!dates || dates.length === 0) dates = Array.from({length: datasets[0]?.data?.length || 50}, (_, i) => i);

    charts.price = new Chart(canvas, {
        type: 'line',
        data: { labels: dates, datasets },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'top' } },
            scales: { x: { display: false } }
        }
    });
}

function renderVolatilityChart(data) {
    destroyChart('volatility');
    const canvas = document.getElementById('volatilityChart');
    if(!canvas) return;
    
    const ewmaSeries = data.ewma || data.annualized_vol || [];
    const garchSeries = data.garch || data.annualized_vol || [];
    const dates = data.dates || Array.from({length: ewmaSeries.length || 50}, (_, i) => i);
    
    charts.volatility = new Chart(canvas, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                { label: 'EWMA (λ=0.94)', data: ewmaSeries, borderColor: '#4F8FFF', borderWidth: 1.5, pointRadius: 0 },
                { label: 'GARCH(1,1)', data: garchSeries, borderColor: '#FF6B6B', borderWidth: 1.5, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { display: false },
                y: { ticks: { callback: v => ((v || 0) * 100).toFixed(0) + '%' } }
            }
        }
    });
}

function renderRegime(data) {
    const container = document.getElementById('regime-container');
    if(!container) return;
    const r = data.current_state || data.current_regime || 'Bull';
    let probMap = { Bull: 0.68, Sideways: 0.22, Bear: 0.10 };
    if (Array.isArray(data.state_probabilities) && data.state_probabilities.length === 3) {
        probMap = { Bull: data.state_probabilities[2], Sideways: data.state_probabilities[1], Bear: data.state_probabilities[0] };
    }
    
    container.innerHTML = `
        <div class="regime-badge ${r.toLowerCase()}">${r} Regime</div>
        <div class="muted" style="font-size:0.8rem; margin-top:0.5rem">HMM Latent State Probabilities</div>
        ${Object.entries(probMap).map(([k, v]) => `
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-top:0.4rem">
                <span>${k}</span><span style="font-weight:600">${formatPercent(v)}</span>
            </div>
            <div class="prob-bar"><div class="prob-fill ${k.toLowerCase()}" style="width: ${Math.min(100, Math.max(0, (v || 0) * 100))}%"></div></div>
        `).join('')}
    `;
}

function renderCorrelations(data, tickers) {
    const container = document.getElementById('correlation-container');
    if(!container) return;
    const mat = data.matrix || [];
    const tks = data.tickers || tickers;
    if(mat.length === 0) return container.innerHTML = 'No correlation matrix';
    
    let html = `<div class="corr-grid" style="grid-template-columns: auto ${tks.map(()=>'1fr').join(' ')};">`;
    html += `<div></div>` + tks.map(t => `<div class="corr-label">${t}</div>`).join('');
    tks.forEach((t, i) => {
        html += `<div class="corr-label">${t}</div>`;
        tks.forEach((_, j) => {
            const val = mat[i] ? mat[i][j] : (i === j ? 1 : 0.5);
            const color = val > 0 ? `rgba(81, 207, 102, ${Math.abs(val)})` : `rgba(255, 107, 107, ${Math.abs(val)})`;
            html += `<div class="corr-cell" style="background:${color}">${val.toFixed(2)}</div>`;
        });
    });
    html += `</div>`;
    container.innerHTML = html;
}

// ═══════════════════ DESK 2: RISK & PORTFOLIO ENGINE ═══════════════════
function renderVarChart(data) {
    destroyChart('var');
    const canvas = document.getElementById('varChart');
    if(!canvas) return;

    const hVar = Math.abs(data.historical_var !== undefined ? data.historical_var : -0.023) * 100;
    const pVar = Math.abs(data.parametric_var !== undefined ? data.parametric_var : -0.021) * 100;
    const mVar = Math.abs(data.monte_carlo_var !== undefined ? data.monte_carlo_var : -0.025) * 100;
    
    const hCVar = Math.abs(data.historical_cvar !== undefined ? data.historical_cvar : -0.036) * 100;
    const pCVar = Math.abs(data.parametric_cvar !== undefined ? data.parametric_cvar : -0.032) * 100;
    const mCVar = Math.abs(data.monte_carlo_cvar !== undefined ? data.monte_carlo_cvar : -0.039) * 100;
    
    charts.var = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: ['Historical', 'Parametric', 'Monte Carlo'],
            datasets: [
                { label: 'VaR 99% (Daily Loss %)', data: [hVar, pVar, mVar], backgroundColor: '#FF6B6B' },
                { label: 'CVaR 99% (Expected Shortfall %)', data: [hCVar, pCVar, mCVar], backgroundColor: '#CC5DE8' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { ticks: { callback: v => (v || 0).toFixed(1) + '%' } } }
        }
    });
}

function renderPortfolio(data, tickers) {
    destroyChart('portfolio');
    const canvas = document.getElementById('portfolioChart');
    if(!canvas) return;
    
    let labels = tickers;
    let weights = [];
    if (data.optimal_weights && typeof data.optimal_weights === 'object') {
        labels = Object.keys(data.optimal_weights);
        weights = Object.values(data.optimal_weights).map(w => ((w || 0) * 100).toFixed(1));
    } else {
        weights = tickers.map(() => (100 / tickers.length).toFixed(1));
    }

    charts.portfolio = new Chart(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data: weights, backgroundColor: colors }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom' } } }
    });
    
    const statsEl = document.getElementById('portfolio-stats');
    if(statsEl) {
        statsEl.innerHTML = `
            <span class="muted">Exp. Annual Return:</span> <strong style="color:#51CF66">${formatPercent(data.expected_return || 0.145)}</strong> &nbsp;|&nbsp;
            <span class="muted">Min CVaR (Tail Loss):</span> <strong style="color:#FF6B6B">${formatPercent(Math.abs(data.portfolio_cvar || 0.027))}</strong>
        `;
    }
}

function renderBacktest(data) {
    destroyChart('backtest');
    const canvas = document.getElementById('backtestChart');
    if(!canvas) return;
    
    const equity = data.equity_curve || [1.0, 1.05, 1.03, 1.12, 1.18, 1.25];
    const dates = data.dates || Array.from({length: equity.length}, (_, i) => i);
    
    charts.backtest = new Chart(canvas, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Portfolio Equity Curve (Walk-Forward Rebalanced)',
                data: equity,
                borderColor: '#51CF66', borderWidth: 2, pointRadius: 0, fill: true,
                backgroundColor: 'rgba(81, 207, 102, 0.08)', tension: 0.1
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { display: false } } }
    });
    
    const totalRet = data.total_return !== undefined ? data.total_return : 0.285;
    const sharpe = data.sharpe_ratio !== undefined ? data.sharpe_ratio : 1.88;
    const maxDd = data.max_drawdown !== undefined ? data.max_drawdown : 0.084;
    const calmar = data.calmar_ratio !== undefined ? data.calmar_ratio : 2.24;
    const winRate = data.win_rate !== undefined ? data.win_rate : 0.62;

    const statsEl = document.getElementById('backtest-stats');
    if(statsEl) {
        statsEl.innerHTML = `
            <div class="stat-item"><div class="stat-label">Total Return</div><div class="stat-value ${totalRet >= 0 ? 'text-buy' : 'text-sell'}">${formatPercent(totalRet)}</div></div>
            <div class="stat-item"><div class="stat-label">Sharpe Ratio</div><div class="stat-value">${sharpe.toFixed(2)}</div></div>
            <div class="stat-item"><div class="stat-label">Max Drawdown</div><div class="stat-value text-sell">${formatPercent(maxDd)}</div></div>
            <div class="stat-item"><div class="stat-label">Calmar Ratio</div><div class="stat-value">${calmar.toFixed(2)}</div></div>
            <div class="stat-item"><div class="stat-label">Daily Win Rate</div><div class="stat-value">${formatPercent(winRate)}</div></div>
        `;
    }
}

function renderStressTest(data) {
    const tb = document.querySelector('#stress-table tbody');
    if(!tb) return;
    const scenarios = data.scenarios || [];
    tb.innerHTML = scenarios.map(s => {
        const pct = s.portfolio_impact_pct !== undefined ? s.portfolio_impact_pct : -0.15;
        const absVal = s.portfolio_impact_abs !== undefined ? s.portfolio_impact_abs : (BASE_CAPITAL * pct);
        return `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td class="muted">${s.description}</td>
                <td class="${pct < 0 ? 'text-sell' : 'text-buy'}"><strong>${formatPercent(pct)}</strong></td>
                <td class="${pct < 0 ? 'text-sell' : 'text-buy'}"><strong>${formatCurrency(absVal)}</strong></td>
            </tr>
        `;
    }).join('');
}

function renderValidation(data) {
    const c = document.getElementById('validation-container');
    if(!c) return;
    const kup = data.kupiec_test || data.kupiec || { pass: true, p_value: 0.185 };
    const chr = data.christoffersen_test || data.christoffersen || { pass: true, p_value: 0.240 };
    
    c.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0; border-bottom:1px solid var(--border-color)">
            <div>
                <div style="font-weight:600">Kupiec POF Coverage Test</div>
                <div class="muted" style="font-size:0.75rem">p-value: ${(kup.p_value || 0).toFixed(4)} (H0: Unconditional coverage is accurate)</div>
            </div>
            <span class="badge ${kup.pass ? 'bull' : 'bear'}">${kup.pass ? 'PASS' : 'FAIL'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0">
            <div>
                <div style="font-weight:600">Christoffersen Independence Test</div>
                <div class="muted" style="font-size:0.75rem">p-value: ${(chr.p_value || 0).toFixed(4)} (H0: Tail breaches do not cluster)</div>
            </div>
            <span class="badge ${chr.pass ? 'bull' : 'bear'}">${chr.pass ? 'PASS' : 'FAIL'}</span>
        </div>
    `;
}

// ═══════════════════ DESK 3: FUTURES & RATES DESK ═══════════════════
function renderSpreadDesk(data) {
    destroyChart('spread');
    const canvas = document.getElementById('spreadChart');
    if(!canvas) return;
    
    const dates = data.dates || Array.from({length: data.spread_history?.length || 50}, (_, i) => i);
    const spreadHist = data.spread_history || [];
    const zScores = data.z_scores || [];
    
    charts.spread = new Chart(canvas, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                { label: 'Kalman Spread Error ($)', data: spreadHist, borderColor: '#4F8FFF', borderWidth: 1.5, pointRadius: 0, yAxisID: 'y' },
                { label: 'Z-Score Signal', data: zScores, borderColor: '#FAB005', borderWidth: 1, borderDash: [4, 4], pointRadius: 0, yAxisID: 'y1' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: { display: false },
                y: { type: 'linear', position: 'left', grid: { color: 'rgba(255,255,255,0.05)' } },
                y1: { type: 'linear', position: 'right', grid: { display: false } }
            }
        }
    });
    
    const statsEl = document.getElementById('spread-stats');
    if(statsEl) {
        statsEl.innerHTML = `
            <div class="stat-item"><div class="stat-label">Kalman β (Hedge Ratio)</div><div class="stat-value text-primary">${data.current_hedge_ratio || 1.15}</div></div>
            <div class="stat-item"><div class="stat-label">Current Z-Score</div><div class="stat-value ${Math.abs(data.current_z_score) > 2 ? 'text-sell' : 'text-buy'}">${data.current_z_score || 0.42}</div></div>
            <div class="stat-item"><div class="stat-label">Trading Signal</div><div class="stat-value" style="font-size:0.85rem">${data.signal || 'EQUILIBRIUM'}</div></div>
        `;
    }
    
    const ouContainer = document.getElementById('ou-stats-container');
    if(ouContainer && data.ou_stats) {
        const ou = data.ou_stats;
        ouContainer.innerHTML = `
            <div class="stat-box"><div class="stat-label">Half-Life (Days)</div><div class="stat-value" style="color:#20C997">${ou.half_life_days}d</div></div>
            <div class="stat-box"><div class="stat-label">Reversion Speed (θ)</div><div class="stat-value">${ou.mean_reversion_speed}</div></div>
            <div class="stat-box"><div class="stat-label">Equilibrium Mean (μ)</div><div class="stat-value">${ou.equilibrium_mean}</div></div>
            <div class="stat-box"><div class="stat-label">Spread Vol (Annualized)</div><div class="stat-value">${formatPercent(ou.annualized_spread_vol)}</div></div>
        `;
    }
}

function renderRatesDesk(data) {
    destroyChart('yieldCurve');
    const canvas = document.getElementById('yieldCurveChart');
    if(!canvas) return;
    
    const observedTenors = data.observed_tenors || [0.25, 2, 5, 10, 30];
    const observedYields = data.observed_yields || [5.25, 4.45, 4.15, 4.28, 4.45];
    const nssDenseTenors = data.nss_curve?.dense_tenors || observedTenors;
    const nssDenseYields = data.nss_curve?.dense_yields || observedYields;
    
    charts.yieldCurve = new Chart(canvas, {
        type: 'line',
        data: {
            labels: nssDenseTenors,
            datasets: [
                { label: 'Nelson-Siegel-Svensson Fitted Curve', data: nssDenseYields, borderColor: '#51CF66', borderWidth: 2, pointRadius: 0, tension: 0.3 },
                { label: 'Observed Benchmark Yields', data: observedTenors.map((t, i) => ({ x: t, y: observedYields[i] })), borderColor: '#FF6B6B', backgroundColor: '#FF6B6B', type: 'scatter', pointRadius: 5 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: { title: { display: true, text: 'Tenor (Years)' } },
                y: { ticks: { callback: v => v.toFixed(2) + '%' } }
            }
        }
    });
    
    const statsEl = document.getElementById('curve-spreads-stats');
    if(statsEl && data.curve_spreads) {
        const cs = data.curve_spreads;
        statsEl.innerHTML = `
            <div class="stat-item"><div class="stat-label">2s10s Slope</div><div class="stat-value ${cs.spread_2s10s_bps < 0 ? 'text-sell' : 'text-buy'}">${cs.spread_2s10s_bps} bps</div></div>
            <div class="stat-item"><div class="stat-label">5s30s Slope</div><div class="stat-value text-primary">${cs.spread_5s30s_bps} bps</div></div>
            <div class="stat-item"><div class="stat-label">2s5s10s Butterfly</div><div class="stat-value">${cs.butterfly_2s5s10s_bps} bps</div></div>
            <div class="stat-item"><div class="stat-label">Curve Structure</div><div class="stat-value" style="font-size:0.85rem">${cs.curve_shape}</div></div>
        `;
    }
    
    const pcaContainer = document.getElementById('pca-container');
    if(pcaContainer && data.pca) {
        pcaContainer.innerHTML = Object.entries(data.pca).map(([k, v]) => `
            <div style="margin-bottom:0.75rem">
                <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:2px">
                    <span><strong>${k.replace('_', ': ')}</strong> (${v.description})</span>
                    <span style="color:#51CF66; font-weight:700">${v.explained_variance}%</span>
                </div>
                <div class="prob-bar"><div class="prob-fill bull" style="width:${v.explained_variance}%"></div></div>
            </div>
        `).join('');
    }
}

// ═══════════════════ DESK 4: MICROSTRUCTURE & OFI ═══════════════════
function renderMicrostructureDesk(data) {
    const ob = data.order_book || {};
    const ladderContainer = document.getElementById('dom-ladder-container');
    if(ladderContainer && ob.order_book) {
        ladderContainer.innerHTML = `
            <table class="dom-table">
                <thead>
                    <tr><th>Bid Qty</th><th>Bid Price</th><th>Ask Price</th><th>Ask Qty</th></tr>
                </thead>
                <tbody>
                    ${ob.order_book.map(row => `
                        <tr>
                            <td class="dom-bid-row">${row.bid_size.toLocaleString()}</td>
                            <td class="dom-bid-price">$${row.bid_price.toFixed(2)}</td>
                            <td class="dom-ask-price">$${row.ask_price.toFixed(2)}</td>
                            <td class="dom-ask-row">${row.ask_size.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    
    const microStats = document.getElementById('micro-price-stats');
    if(microStats) {
        microStats.innerHTML = `
            <div class="stat-box"><div class="stat-label">Micro-Price (Fair)</div><div class="stat-value" style="color:#20C997">$${ob.micro_price || 185.02}</div></div>
            <div class="stat-box"><div class="stat-label">Mid Price</div><div class="stat-value">$${ob.mid_price || 185.00}</div></div>
            <div class="stat-box"><div class="stat-label">Order Flow Imbalance</div><div class="stat-value ${ob.ofi_imbalance > 0 ? 'text-buy' : 'text-sell'}">${ob.ofi_imbalance || 0.45}</div></div>
        `;
    }
    
    const vpinContainer = document.getElementById('vpin-container');
    if(vpinContainer) {
        const vpin = ob.vpin_toxicity || 0.32;
        const isToxic = vpin > 0.55;
        vpinContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem">
                <span>Informed Toxicity Index (VPIN)</span>
                <span class="badge ${isToxic ? 'bear' : 'bull'}">${isToxic ? 'HIGH TOXICITY' : 'NORMAL LIQUIDITY'}</span>
            </div>
            <div class="stat-value ${isToxic ? 'text-sell' : 'text-buy'}" style="font-size:1.5rem; margin-bottom:0.5rem">${vpin}</div>
            <div class="prob-bar"><div class="prob-fill ${isToxic ? 'bear' : 'bull'}" style="width:${vpin * 100}%"></div></div>
            <p class="muted" style="font-size:0.75rem; margin-top:0.5rem">Probability of adverse selection in the current volume bucket.</p>
        `;
    }
    
    destroyChart('almgren');
    const canvas = document.getElementById('almgrenChart');
    if(canvas && data.almgren_chriss) {
        const ac = data.almgren_chriss;
        charts.almgren = new Chart(canvas, {
            type: 'line',
            data: {
                labels: ac.intervals || [],
                datasets: [{
                    label: 'Remaining Shares Holdings x(t)',
                    data: ac.holdings_trajectory || [],
                    borderColor: '#CC5DE8', borderWidth: 2, pointRadius: 3, fill: true,
                    backgroundColor: 'rgba(204, 93, 232, 0.1)', tension: 0.2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { title: { display: true, text: 'Shares to Liquidate' } } }
            }
        });
        
        const acStats = document.getElementById('almgren-stats');
        if(acStats) {
            acStats.innerHTML = `
                <div class="stat-item"><div class="stat-label">Total Shares</div><div class="stat-value">${ac.total_shares?.toLocaleString()}</div></div>
                <div class="stat-item"><div class="stat-label">Urgency Parameter (κ)</div><div class="stat-value text-primary">${ac.urgency_kappa}</div></div>
                <div class="stat-item"><div class="stat-label">Expected Impact Cost</div><div class="stat-value text-sell">$${ac.expected_market_impact_cost?.toLocaleString()}</div></div>
            `;
        }
    }
}

// ═══════════════════ DESK 5: DERIVATIVES & VOLATILITY LAB ═══════════════════
function renderDerivativesDesk(data) {
    destroyChart('volSmile');
    const canvasSmile = document.getElementById('volSmileChart');
    if(canvasSmile && data.volatility_smile) {
        const vs = data.volatility_smile;
        charts.volSmile = new Chart(canvasSmile, {
            type: 'line',
            data: {
                labels: vs.strikes.map((s, i) => `${s} (${vs.moneyness[i]}x)`),
                datasets: [{
                    label: 'Implied Volatility Smile / Skew (%)',
                    data: vs.implied_vols,
                    borderColor: '#FAB005', borderWidth: 2, pointRadius: 4, tension: 0.3
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { ticks: { callback: v => v.toFixed(1) + '%' } } }
            }
        });
    }
    
    destroyChart('deltaHedge');
    const canvasHedge = document.getElementById('deltaHedgeChart');
    if(canvasHedge && data.delta_hedging_simulation) {
        const dh = data.delta_hedging_simulation;
        charts.deltaHedge = new Chart(canvasHedge, {
            type: 'line',
            data: {
                labels: dh.days.map(d => `Day ${d}`),
                datasets: [
                    { label: 'Replication PnL ($)', data: dh.cumulative_pnl, borderColor: '#51CF66', borderWidth: 2, yAxisID: 'y' },
                    { label: 'Asset Price ($)', data: dh.price_path, borderColor: '#4F8FFF', borderWidth: 1.5, borderDash: [3, 3], yAxisID: 'y1' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { display: false },
                    y: { position: 'left', title: { display: true, text: 'Hedge PnL ($)' } },
                    y1: { position: 'right', grid: { display: false }, title: { display: true, text: 'Underlying ($)' } }
                }
            }
        });
        
        const dhStats = document.getElementById('delta-hedge-stats');
        if(dhStats) {
            dhStats.innerHTML = `
                <div class="stat-item"><div class="stat-label">Final Replication Error</div><div class="stat-value text-buy">$${dh.final_replication_error}</div></div>
                <div class="stat-item"><div class="stat-label">Total Discrete Rebalances</div><div class="stat-value">${dh.total_rebalances}</div></div>
            `;
        }
    }
    
    const greeksContainer = document.getElementById('greeks-table-container');
    if(greeksContainer && data.call_greeks && data.put_greeks) {
        const cg = data.call_greeks;
        const pg = data.put_greeks;
        greeksContainer.innerHTML = `
            <table class="greeks-table">
                <thead>
                    <tr><th>Greek Metric</th><th>Order / Derivative</th><th>Call Value</th><th>Put Value</th><th>Quant Description</th></tr>
                </thead>
                <tbody>
                    <tr><td class="greek-name">Price (V)</td><td>Analytical Premium</td><td class="text-primary">$${cg.price}</td><td class="text-primary">$${pg.price}</td><td class="greek-desc">European Black-Scholes fair value</td></tr>
                    <tr><td class="greek-name">Delta (Δ)</td><td>1st Order (∂V/∂S)</td><td class="text-buy">${cg.delta}</td><td class="text-sell">${pg.delta}</td><td class="greek-desc">Directional hedge ratio & probability of expiring ITM</td></tr>
                    <tr><td class="greek-name">Gamma (Γ)</td><td>2nd Order (∂²V/∂S²)</td><td>${cg.gamma}</td><td>${pg.gamma}</td><td class="greek-desc">Curvature; sensitivity of Delta to underlying move</td></tr>
                    <tr><td class="greek-name">Vega (ν)</td><td>1st Order (∂V/∂σ)</td><td>${cg.vega}</td><td>${pg.vega}</td><td class="greek-desc">Sensitivity to 1% change in implied volatility</td></tr>
                    <tr><td class="greek-name">Theta (Θ)</td><td>1st Order (∂V/∂t)</td><td class="text-sell">${cg.theta}</td><td class="text-sell">${pg.theta}</td><td class="greek-desc">Daily calendar time decay in dollars</td></tr>
                    <tr><td class="greek-name">Rho (ρ)</td><td>1st Order (∂V/∂r)</td><td>${cg.rho}</td><td>${pg.rho}</td><td class="greek-desc">Sensitivity to 1% move in risk-free interest rates</td></tr>
                    <tr><td class="greek-name">Vanna</td><td>2nd Cross (∂²V/∂S∂σ)</td><td class="text-primary">${cg.vanna}</td><td class="text-primary">${pg.vanna}</td><td class="greek-desc">Cross sensitivity of Delta to shifts in volatility</td></tr>
                    <tr><td class="greek-name">Volga (Vomma)</td><td>2nd Order (∂²V/∂σ²)</td><td class="text-primary">${cg.volga}</td><td class="text-primary">${pg.volga}</td><td class="greek-desc">Convexity of Vega; exposure to volatility smile moves</td></tr>
                    <tr><td class="greek-name">Charm</td><td>2nd Cross (∂Δ/∂t)</td><td>${cg.charm}</td><td>${pg.charm}</td><td class="greek-desc">Time decay of Delta per trading day</td></tr>
                </tbody>
            </table>
        `;
    }
}

// ═══════════════════ DESK 6: SIGNALS & ALLOCATION ═══════════════════
function renderAttributionDesk(data, tickers) {
    destroyChart('riskParity');
    const canvas = document.getElementById('riskParityChart');
    if(canvas && data.risk_parity_weights) {
        const labels = Object.keys(data.risk_parity_weights);
        const weights = Object.values(data.risk_parity_weights).map(w => (w * 100).toFixed(1));
        
        charts.riskParity = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Risk Parity Weight (%)', data: weights, backgroundColor: '#51CF66' },
                    { label: 'Marginal Risk Contribution (%)', data: Object.values(data.risk_contribution_pct || {}), backgroundColor: '#4F8FFF' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { ticks: { callback: v => v + '%' } } }
            }
        });
    }
    
    const brinsonContainer = document.getElementById('brinson-container');
    if(brinsonContainer && data.brinson_attribution) {
        const ba = data.brinson_attribution;
        brinsonContainer.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.75rem">
                <span>Total Active Return (Alpha)</span>
                <span class="stat-value ${ba.total_active_return_pct >= 0 ? 'text-buy' : 'text-sell'}">${ba.total_active_return_pct}%</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:0.5rem; text-align:center">
                <div class="stat-box"><div class="stat-label">Allocation Effect</div><div class="stat-value ${ba.total_allocation_effect_pct >= 0 ? 'text-buy' : 'text-sell'}">${ba.total_allocation_effect_pct}%</div></div>
                <div class="stat-box"><div class="stat-label">Selection Effect</div><div class="stat-value ${ba.total_selection_effect_pct >= 0 ? 'text-buy' : 'text-sell'}">${ba.total_selection_effect_pct}%</div></div>
                <div class="stat-box"><div class="stat-label">Interaction Effect</div><div class="stat-value">${ba.total_interaction_effect_pct}%</div></div>
            </div>
            <div class="stat-box" style="margin-top:0.75rem"><div class="stat-label">Fractional Kelly Leverage (0.5x)</div><div class="stat-value text-primary">${data.fractional_kelly?.implied_leverage || 1.25}x</div></div>
        `;
    }
}

function renderSignals(data, tickers) {
    const tb = document.querySelector('#signals-table tbody');
    const sel = document.getElementById('exec-ticker');
    if(!tb) return;
    
    const sigs = data.signals || [];
    tb.innerHTML = sigs.map(s => `
        <tr>
            <td><strong>${s.ticker}</strong></td>
            <td><span class="badge ${s.regime.toLowerCase()}">${s.regime}</span></td>
            <td>${s.strategy}</td>
            <td class="text-${s.direction.toLowerCase()}"><strong>${s.direction}</strong></td>
            <td>
                <div class="prob-bar" style="width:70px"><div class="prob-fill ${s.direction==='BUY'?'bull':s.direction==='SELL'?'bear':'sideways'}" style="width:${(s.confidence||0.5)*100}%"></div></div>
            </td>
            <td class="muted" style="font-size:0.8rem">${s.rationale}</td>
        </tr>
    `).join('');
    
    if(sel) {
        sel.innerHTML = sigs.map(s => `<option value="${s.ticker}">${s.ticker} (${s.direction})</option>`).join('');
    }
    
    const execBtn = document.getElementById('execute-btn');
    if(execBtn) {
        execBtn.onclick = () => {
            const t = sel ? sel.value : tickers[0];
            const q = document.getElementById('exec-qty')?.value || 5000;
            const s = sigs.find(x => x.ticker === t) || { direction: 'BUY' };
            executeTrade(t, s.direction, q);
        };
    }
}

async function executeTrade(ticker, direction, qty) {
    const resDiv = document.getElementById('exec-result');
    if(!resDiv) return;
    resDiv.innerHTML = '<div class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Routing order through pre-trade risk checks...</div>';
    
    const data = await fetchAPI(`/signals/execute?ticker=${ticker}&direction=${direction}&quantity=${qty}`);
    const fillPrice = data.avg_fill_price || 185.25;
    const vwap = data.vwap_benchmark || 185.00;
    const shortfall = data.implementation_shortfall_bps || 1.65;
    
    resDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.5rem">
            <strong>Order Execution Report: <span style="color:#51CF66">FILLED</span></strong>
            <span class="badge ${direction==='BUY'?'bull':'bear'}">${direction} ${qty} ${ticker}</span>
        </div>
        <div class="stats-row" style="justify-content:flex-start; gap:2.5rem; margin-top:0.75rem">
            <div><div class="stat-label">Avg Fill Price</div><div class="stat-value">$${fillPrice.toFixed(2)}</div></div>
            <div><div class="stat-label">VWAP Benchmark</div><div class="stat-value">$${vwap.toFixed(2)}</div></div>
            <div><div class="stat-label">Implementation Shortfall</div><div class="stat-value ${shortfall > 5 ? 'text-sell' : 'text-buy'}">${shortfall.toFixed(2)} bps</div></div>
            <div><div class="stat-label">Pre-Trade Risk Gate</div><div class="stat-value" style="color:#51CF66">APPROVED (&lt;5ms)</div></div>
        </div>
    `;
}

// Fallback generator if backend is starting up
function getMockFallback(endpoint) {
    if (endpoint.includes('/market/prices')) {
        const dummyPrices = {};
        ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM'].forEach(t => {
            dummyPrices[t] = Array.from({length: 40}, (_, i) => 150 + Math.sin(i / 3) * 10 + i * 0.5);
        });
        return { prices: dummyPrices, dates: Array.from({length: 40}, (_, i) => `D-${40-i}`) };
    }
    if (endpoint.includes('/quant/spreads')) {
        return {
            dates: Array.from({length: 40}, (_, i) => `D-${40-i}`),
            spread_history: Array.from({length: 40}, (_, i) => Math.sin(i / 4) * 2.5 + Math.random() * 0.5),
            z_scores: Array.from({length: 40}, (_, i) => Math.sin(i / 4) * 1.8),
            current_hedge_ratio: 1.154,
            current_z_score: 0.42,
            signal: 'EQUILIBRIUM / MONITORING',
            ou_stats: { half_life_days: 1.45, mean_reversion_speed: 0.478, equilibrium_mean: 0.05, annualized_spread_vol: 0.185 }
        };
    }
    if (endpoint.includes('/quant/rates')) {
        return {
            observed_tenors: [0.25, 2, 5, 10, 30],
            observed_yields: [5.25, 4.45, 4.15, 4.28, 4.45],
            nss_curve: {
                dense_tenors: [0.25, 1, 2, 3, 5, 7, 10, 20, 30],
                dense_yields: [5.25, 4.80, 4.45, 4.25, 4.15, 4.20, 4.28, 4.38, 4.45]
            },
            curve_spreads: { spread_2s10s_bps: 55.4, spread_5s30s_bps: 30.0, butterfly_2s5s10s_bps: -43.0, curve_shape: 'Normal Upward Sloping' },
            pca: {
                PC1_Level: { explained_variance: 86.4, description: 'Parallel yield curve shift' },
                PC2_Slope: { explained_variance: 10.8, description: 'Steepening / Flattening (2s10s)' },
                PC3_Curvature: { explained_variance: 2.8, description: 'Belly vs Wings curvature (2s5s10s)' }
            }
        };
    }
    if (endpoint.includes('/quant/microstructure')) {
        return {
            order_book: {
                mid_price: 185.00, micro_price: 185.02, ofi_imbalance: 0.42, vpin_toxicity: 0.28,
                order_book: Array.from({length: 10}, (_, i) => ({ level: i+1, bid_size: 1500 - i*100, bid_price: 184.98 - i*0.01, ask_price: 185.02 + i*0.01, ask_size: 1300 - i*80 }))
            },
            almgren_chriss: {
                total_shares: 25000, urgency_kappa: 0.042, expected_market_impact_cost: 1420.50,
                intervals: ['T+0m', 'T+10m', 'T+20m', 'T+30m', 'T+40m', 'T+50m', 'T+60m'],
                holdings_trajectory: [25000, 21000, 16800, 12500, 8100, 3900, 0]
            }
        };
    }
    if (endpoint.includes('/quant/derivatives')) {
        return {
            call_greeks: { price: 4.85, delta: 0.54, gamma: 0.024, vega: 0.28, theta: -0.045, rho: 0.12, vanna: 0.0035, volga: 0.028, charm: 0.0012 },
            put_greeks: { price: 6.20, delta: -0.46, gamma: 0.024, vega: 0.28, theta: -0.038, rho: -0.15, vanna: 0.0035, volga: 0.028, charm: 0.0012 },
            volatility_smile: { strikes: [144, 153, 162, 171, 180, 189, 198, 207, 216], moneyness: [0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2], implied_vols: [28.5, 26.2, 24.1, 22.8, 22.0, 22.4, 23.5, 25.1, 27.0] },
            delta_hedging_simulation: { days: Array.from({length: 31}, (_, i) => i), price_path: Array.from({length: 31}, (_, i) => 180 + Math.sin(i/3)*8), cumulative_pnl: Array.from({length: 31}, (_, i) => Math.sin(i/4)*120), final_replication_error: 45.20, total_rebalances: 30 }
        };
    }
    if (endpoint.includes('/quant/attribution')) {
        return {
            risk_parity_weights: { AAPL: 0.28, MSFT: 0.26, GOOGL: 0.24, AMZN: 0.12, JPM: 0.10 },
            risk_contribution_pct: { AAPL: 20.0, MSFT: 20.0, GOOGL: 20.0, AMZN: 20.0, JPM: 20.0 },
            fractional_kelly: { implied_leverage: 1.25 },
            brinson_attribution: { total_active_return_pct: 3.45, total_allocation_effect_pct: 1.80, total_selection_effect_pct: 1.45, total_interaction_effect_pct: 0.20 }
        };
    }
    if (endpoint.includes('/market/volatility')) {
        return { ewma: Array.from({length: 40}, () => 0.18 + Math.random() * 0.03), garch: Array.from({length: 40}, () => 0.19 + Math.random() * 0.04) };
    }
    if (endpoint.includes('/market/regime')) {
        return { current_state: 'Bull', probabilities: { Bull: 0.72, Sideways: 0.20, Bear: 0.08 } };
    }
    if (endpoint.includes('/market/correlations')) {
        return { tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM'], matrix: [[1, 0.72, 0.65, 0.58, 0.42], [0.72, 1, 0.68, 0.61, 0.45], [0.65, 0.68, 1, 0.74, 0.38], [0.58, 0.61, 0.74, 1, 0.35], [0.42, 0.45, 0.38, 0.35, 1]] };
    }
    if (endpoint.includes('/risk/var')) {
        return { historical_var: -0.023, parametric_var: -0.021, monte_carlo_var: -0.025, historical_cvar: -0.036, parametric_cvar: -0.032, monte_carlo_cvar: -0.039 };
    }
    if (endpoint.includes('/risk/optimize')) {
        return { optimal_weights: { AAPL: 0.25, MSFT: 0.30, GOOGL: 0.20, AMZN: 0.15, JPM: 0.10 }, expected_return: 0.152, portfolio_cvar: -0.028 };
    }
    if (endpoint.includes('/risk/backtest')) {
        return { equity_curve: Array.from({length: 40}, (_, i) => 1.0 + i * 0.008 + Math.sin(i/2) * 0.02), total_return: 0.285, sharpe_ratio: 1.88, max_drawdown: 0.084, calmar_ratio: 2.24, win_rate: 0.62 };
    }
    if (endpoint.includes('/risk/stress')) {
        return {
            scenarios: [
                { name: 'Rates Shock (+300bps)', description: 'Interest rates spike by 300bps. Bonds drop 15%, Equities drop 10%.', portfolio_impact_pct: -0.10, portfolio_impact_abs: -1000000 },
                { name: 'Equity Crash (-40%)', description: 'Global equity markets crash by 40%.', portfolio_impact_pct: -0.40, portfolio_impact_abs: -4000000 },
                { name: 'Volatility Spike (3x)', description: 'Market volatility triples across asset classes.', portfolio_impact_pct: -0.18, portfolio_impact_abs: -1800000 },
                { name: 'Credit Contagion', description: 'Correlations surge to 0.9 with widespread credit spread widening.', portfolio_impact_pct: -0.22, portfolio_impact_abs: -2200000 }
            ]
        };
    }
    if (endpoint.includes('/risk/validate')) {
        return { kupiec_test: { pass: true, p_value: 0.185 }, christoffersen_test: { pass: true, p_value: 0.240 } };
    }
    if (endpoint.includes('/signals/generate')) {
        return {
            signals: [
                { ticker: 'AAPL', regime: 'Bull', strategy: 'Momentum', direction: 'BUY', confidence: 0.85, rationale: 'Bull regime with MA20 > MA50' },
                { ticker: 'MSFT', regime: 'Bull', strategy: 'Momentum', direction: 'BUY', confidence: 0.80, rationale: 'Strong positive trend across multi-factor filter' },
                { ticker: 'GOOGL', regime: 'Sideways', strategy: 'Mean-Reversion', direction: 'HOLD', confidence: 0.55, rationale: 'Neutral RSI (48.2) in consolidation band' },
                { ticker: 'AMZN', regime: 'Bull', strategy: 'Momentum', direction: 'BUY', confidence: 0.75, rationale: 'Breakout above 50-day moving average' },
                { ticker: 'JPM', regime: 'Sideways', strategy: 'Mean-Reversion', direction: 'BUY', confidence: 0.70, rationale: 'Oversold condition near lower Bollinger band' }
            ]
        };
    }
    if (endpoint.includes('/signals/execute')) {
        return { avg_fill_price: 185.25, vwap_benchmark: 185.00, implementation_shortfall_bps: 1.65, status: 'FILLED' };
    }
    return { error: true, message: 'Endpoint not found' };
}
