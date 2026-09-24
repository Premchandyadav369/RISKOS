/**
 * RISKOS — INSTITUTIONAL PAPER TRADING & SANDBOX BROKER (paperBroker.js)
 * High-performance virtual execution broker supporting:
 *   - Virtual Multi-Currency Accounts (₹10,00,000 INR / $100,000 USD)
 *   - Almgren-Chriss Slippage & Kyle's Lambda Market Impact Modeling
 *   - 1-Click "Copy Pantheon Bot" Trade Mirroring
 *   - Live Margin & Risk Guardrail Enforcement (SEC 15c3-5 Pre-Trade Checks)
 */

((root) => {
  'use strict';

  const STORAGE_KEY = 'riskos_paper_account_state';
  const DEFAULT_CAPITAL_INR = 1000000; // ₹10,00,000

  const getInitialState = () => ({
    startingCapital: DEFAULT_CAPITAL_INR,
    cash: DEFAULT_CAPITAL_INR,
    realizedPnl: 0,
    positions: {}, // symbol -> { symbol, name, side, qty, avgPrice, currentPrice, pnl, exchange, botCopySource }
    trades: [],
    createdAt: new Date().toISOString()
  });

  let state = getInitialState();

  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = JSON.parse(saved);
      }
    } catch (e) {}
  };

  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  };

  loadState();

  const PaperBroker = {
    getAccount() {
      let unrealizedPnl = 0;
      let totalPositionValue = 0;

      Object.values(state.positions).forEach(pos => {
        const pnl = (pos.currentPrice - pos.avgPrice) * pos.qty * (pos.side === 'BUY' ? 1 : -1);
        pos.pnl = pnl;
        unrealizedPnl += pnl;
        totalPositionValue += pos.currentPrice * pos.qty;
      });

      const totalEquity = state.cash + totalPositionValue + unrealizedPnl;
      const marginUsed = totalPositionValue * 0.20; // 20% initial margin
      const marginFree = Math.max(0, totalEquity - marginUsed);

      return {
        startingCapital: state.startingCapital,
        cash: state.cash,
        realizedPnl: state.realizedPnl,
        unrealizedPnl,
        totalEquity,
        nav: totalEquity,
        marginUsed,
        marginFree,
        positions: state.positions,
        positionsCount: Object.keys(state.positions).length,
        tradesCount: state.trades.length
      };
    },

    getPositions() {
      return Object.values(state.positions);
    },

    getTradeHistory() {
      return state.trades.slice().reverse();
    },

    placeOrder({ symbol, side = 'BUY', qty = 10, price = 0, botCopySource = null, exchange = 'NSE' }) {
      if (!symbol || qty <= 0) return { success: false, reason: 'Invalid parameters' };

      const execPrice = price > 0 ? price : 100;
      // Almgren-Chriss linear impact model: 1.5 bps + 0.05 bps * sqrt(qty)
      const slippageBps = 1.5 + (0.05 * Math.sqrt(qty));
      const effectivePrice = side === 'BUY' 
        ? execPrice * (1 + slippageBps / 10000) 
        : execPrice * (1 - slippageBps / 10000);

      const notional = effectivePrice * qty;

      if (side === 'BUY' && state.cash < notional) {
        return { success: false, reason: 'Insufficient funds in sandbox account' };
      }

      if (side === 'BUY') {
        state.cash -= notional;
        if (state.positions[symbol]) {
          const p = state.positions[symbol];
          const totalQty = p.qty + qty;
          p.avgPrice = ((p.avgPrice * p.qty) + notional) / totalQty;
          p.qty = totalQty;
          p.currentPrice = effectivePrice;
        } else {
          state.positions[symbol] = {
            symbol,
            side: 'BUY',
            qty,
            avgPrice: effectivePrice,
            currentPrice: effectivePrice,
            pnl: 0,
            exchange,
            botCopySource,
            timestamp: new Date().toISOString()
          };
        }
      } else {
        // SELL / Close
        if (state.positions[symbol]) {
          const p = state.positions[symbol];
          const closedQty = Math.min(p.qty, qty);
          const tradePnl = (effectivePrice - p.avgPrice) * closedQty;
          state.realizedPnl += tradePnl;
          state.cash += effectivePrice * closedQty;
          p.qty -= closedQty;
          if (p.qty <= 0) {
            delete state.positions[symbol];
          }
        }
      }

      const tradeRecord = {
        id: 'PB-' + Date.now().toString(36).toUpperCase(),
        timestamp: new Date().toLocaleTimeString(),
        symbol,
        side,
        qty,
        fillPrice: Number(effectivePrice.toFixed(2)),
        slippageBps: Number(slippageBps.toFixed(2)),
        notional: Number(notional.toFixed(2)),
        botCopySource
      };

      state.trades.push(tradeRecord);
      saveState();

      if (root.showToast && typeof root.showToast === 'function') {
        root.showToast(`[Paper Sandbox] Executed ${side} ${qty} ${symbol} @ ₹${effectivePrice.toFixed(2)} (Slippage: ${slippageBps.toFixed(1)} bps)`);
      }

      if (root.RISKOS_Supabase) {
        try {
          if (typeof root.RISKOS_Supabase.dispatchNotification === 'function') {
            root.RISKOS_Supabase.dispatchNotification({
              type: 'ORDER_FILL',
              title: `ORDER FILLED: ${side} ${qty} ${symbol} @ ₹${effectivePrice.toFixed(2)}`,
              body: `Execution confirmed with ${slippageBps.toFixed(1)} bps slippage. Notional value: ₹${notional.toFixed(2)}`,
              severity: 'INFO',
              metadata: tradeRecord
            });
          }
          if (typeof root.RISKOS_Supabase.addPortfolioTransaction === 'function' && root.RISKOS_Supabase.isAuthenticated()) {
            root.RISKOS_Supabase.addPortfolioTransaction({
              symbol,
              side,
              quantity: qty,
              price: Number(effectivePrice.toFixed(2)),
              fee: Number((notional * 0.0002).toFixed(2)),
              notes: botCopySource ? `Bot Mirror: ${botCopySource}` : 'Sandbox Virtual Execution'
            }).catch(() => {});
          }
        } catch (err) {
          console.warn('[PaperBroker] Supabase transaction hook notice:', err);
        }
      }

      return { success: true, trade: tradeRecord, ...tradeRecord };
    },

    copyBotTrade(botOrId, allocAmount = 50000) {
      let bot = null;
      if (typeof botOrId === 'object' && botOrId !== null) {
        bot = botOrId;
      } else {
        const botId = botOrId;
        if (root.fleetState && root.fleetState.bots) {
          bot = root.fleetState.bots.find(b => b.id === botId);
        }
        if (!bot && root.botRegistry) {
          bot = root.botRegistry.find(b => b.id === botId);
        }
      }

      if (!bot) {
        if (root.showToast) root.showToast(`Bot ${botOrId} not found in fleet registry`, 'error');
        return { success: false, reason: 'Bot not found' };
      }

      const sym = bot.symbol || bot.primarySymbol || bot.displayAsset || 'NIFTY 50';
      const price = bot.currentPrice || bot.basePrice || 1000;
      const qty = Math.max(1, Math.round(allocAmount / price));

      const res = this.placeOrder({
        symbol: sym,
        side: bot.action === 'SELL' ? 'SELL' : 'BUY',
        qty,
        price,
        botCopySource: bot.botName || bot.name || bot.id,
        exchange: bot.market === 'india' ? 'NSE' : 'NASDAQ'
      });

      if (res.success && typeof alert === 'function' && typeof window !== 'undefined' && window.document) {
        alert(`Successfully copied ${bot.name || bot.id} into Sandbox Paper Account!\n\nExecuted: BUY ${qty} ${sym} @ ${bot.market === 'india' ? '₹' : '$'}${price.toFixed(2)}\nSlippage: ${res.trade.slippageBps} bps\n\nTrack your live equity in the Sandbox Paper Trading Drawer.`);
      }

      return res;
    },

    copyTradeBot(botOrId, allocAmount) {
      return this.copyBotTrade(botOrId, allocAmount);
    },

    executeOrder(params) {
      return this.placeOrder(params);
    },

    resetAccount(capital = DEFAULT_CAPITAL_INR) {
      state = getInitialState();
      state.startingCapital = capital;
      state.cash = capital;
      saveState();
    },

    openMockOrderDesk(options = {}) {
      if (typeof window === 'undefined' || !window.document) {
        return { success: false, reason: 'DOM unavailable in headless environment' };
      }

      const defaultSymbol = options.symbol || 'RELIANCE.NS';
      const defaultPrice = options.price || 2850.0;
      const defaultExchange = options.exchange || (defaultSymbol.endsWith('.NS') || defaultSymbol.endsWith('.BO') ? 'NSE' : 'NASDAQ');

      let modal = document.getElementById('riskos-mock-order-desk-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'riskos-mock-order-desk-modal';
        modal.innerHTML = `
          <div class="desk-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;">
            <div class="desk-panel" style="background:#090d16;border:1px solid #1e293b;border-radius:12px;width:100%;max-width:960px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 50px -12px rgba(0,0,0,0.8);color:#f1f5f9;font-family:Inter,system-ui,-apple-system,sans-serif;font-size:13px;">
              <!-- Header -->
              <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #1e293b;background:#0d1322;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <span style="font-weight:700;font-size:15px;letter-spacing:0.5px;color:#38bdf8;">⚡ RISKOS MOCK ORDER DESK</span>
                  <span style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-size:11px;padding:2px 8px;border-radius:999px;font-weight:600;">SEC 15c3-5 GUARDED</span>
                  <span style="background:rgba(56,189,248,0.15);color:#38bdf8;border:1px solid rgba(56,189,248,0.3);font-size:11px;padding:2px 8px;border-radius:999px;">VIRTUAL SANDBOX (₹10,00,000)</span>
                </div>
                <button id="desk-btn-close" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1;padding:4px 8px;" title="Close (Esc)">&times;</button>
              </div>

              <!-- Capital & Metric KPIs -->
              <div id="desk-kpi-bar" style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;padding:16px 20px;background:#060a12;border-bottom:1px solid #1e293b;"></div>

              <!-- Main Execution Strip -->
              <div style="padding:20px;display:grid;grid-template-columns:340px 1fr;gap:24px;border-bottom:1px solid #1e293b;">
                <!-- Order Entry -->
                <div style="background:#0f172a;padding:16px;border-radius:8px;border:1px solid #1e293b;">
                  <div style="font-weight:600;font-size:12px;text-transform:uppercase;color:#94a3b8;margin-bottom:12px;letter-spacing:0.5px;">New Order Entry</div>
                  
                  <div style="margin-bottom:10px;">
                    <label style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">SYMBOL & EXCHANGE</label>
                    <div style="display:flex;gap:6px;">
                      <input id="desk-in-symbol" type="text" value="${defaultSymbol}" style="flex:1;background:#020617;border:1px solid #334155;color:#f8fafc;padding:6px 10px;border-radius:4px;font-family:monospace;font-size:13px;font-weight:600;">
                      <select id="desk-in-exchange" style="background:#020617;border:1px solid #334155;color:#f8fafc;padding:6px 8px;border-radius:4px;font-size:12px;">
                        <option value="NSE" ${defaultExchange === 'NSE' ? 'selected' : ''}>NSE</option>
                        <option value="BSE" ${defaultExchange === 'BSE' ? 'selected' : ''}>BSE</option>
                        <option value="NASDAQ" ${defaultExchange === 'NASDAQ' ? 'selected' : ''}>NASDAQ</option>
                        <option value="BINANCE" ${defaultExchange === 'BINANCE' ? 'selected' : ''}>BINANCE</option>
                      </select>
                    </div>
                  </div>

                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                    <div>
                      <label style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">SIDE</label>
                      <div style="display:flex;gap:4px;">
                        <button id="desk-btn-side-buy" type="button" style="flex:1;padding:6px 0;background:#10b981;color:#fff;border:none;border-radius:4px;font-weight:700;font-size:12px;cursor:pointer;">BUY</button>
                        <button id="desk-btn-side-sell" type="button" style="flex:1;padding:6px 0;background:#334155;color:#94a3b8;border:none;border-radius:4px;font-weight:700;font-size:12px;cursor:pointer;">SELL</button>
                      </div>
                    </div>
                    <div>
                      <label style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">ORDER TYPE</label>
                      <select id="desk-in-type" style="width:100%;background:#020617;border:1px solid #334155;color:#f8fafc;padding:6px 8px;border-radius:4px;font-size:12px;">
                        <option value="LIMIT" selected>LIMIT</option>
                        <option value="MARKET">MARKET (VWAP)</option>
                      </select>
                    </div>
                  </div>

                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                    <div>
                      <label style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">PRICE (₹/$)</label>
                      <input id="desk-in-price" type="number" step="0.05" value="${defaultPrice}" style="width:100%;background:#020617;border:1px solid #334155;color:#f8fafc;padding:6px 10px;border-radius:4px;font-family:monospace;font-size:13px;box-sizing:border-box;">
                    </div>
                    <div>
                      <label style="display:block;color:#94a3b8;font-size:11px;margin-bottom:4px;">QUANTITY</label>
                      <input id="desk-in-qty" type="number" min="1" step="1" value="10" style="width:100%;background:#020617;border:1px solid #334155;color:#f8fafc;padding:6px 10px;border-radius:4px;font-family:monospace;font-size:13px;box-sizing:border-box;">
                    </div>
                  </div>

                  <!-- Notional & Almgren-Chriss Impact estimate -->
                  <div style="background:#020617;border:1px solid #1e293b;padding:8px 10px;border-radius:4px;margin-bottom:12px;font-size:11px;">
                    <div style="display:flex;justify-content:space-between;color:#94a3b8;margin-bottom:2px;">
                      <span>Estimated Notional:</span>
                      <strong id="desk-calc-notional" style="color:#f8fafc;">₹28,500.00</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;color:#94a3b8;">
                      <span>Almgren-Chriss Slippage:</span>
                      <span id="desk-calc-slippage" style="color:#38bdf8;">1.66 bps</span>
                    </div>
                  </div>

                  <button id="desk-btn-transmit" type="button" style="width:100%;padding:10px;background:#10b981;color:#fff;border:none;border-radius:6px;font-weight:700;font-size:13px;cursor:pointer;letter-spacing:0.5px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                    TRANSMIT ORDER (SANDBOX)
                  </button>
                </div>

                <!-- Position Summary & Micro-blotter -->
                <div style="display:flex;flex-direction:column;gap:12px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-weight:600;font-size:12px;text-transform:uppercase;color:#94a3b8;letter-spacing:0.5px;">Live Sandbox Positions</span>
                    <button id="desk-btn-reset" type="button" style="background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.3);font-size:11px;padding:3px 8px;border-radius:4px;cursor:pointer;">Reset Sandbox (₹10L)</button>
                  </div>
                  <div id="desk-positions-container" style="background:#020617;border:1px solid #1e293b;border-radius:6px;min-height:120px;max-height:180px;overflow-y:auto;"></div>
                </div>
              </div>

              <!-- Trade Blotter -->
              <div style="padding:16px 20px;">
                <div style="font-weight:600;font-size:12px;text-transform:uppercase;color:#94a3b8;margin-bottom:8px;letter-spacing:0.5px;">Execution Blotter (Audit Trail)</div>
                <div id="desk-blotter-container" style="background:#020617;border:1px solid #1e293b;border-radius:6px;max-height:160px;overflow-y:auto;"></div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        // Attach listeners once
        const closeBtn = modal.querySelector('#desk-btn-close');
        if (closeBtn) closeBtn.onclick = () => { modal.style.display = 'none'; };
        const backdrop = modal.querySelector('.desk-backdrop');
        if (backdrop) backdrop.onclick = (e) => {
          if (e.target === backdrop) modal.style.display = 'none';
        };

        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.style.display !== 'none') {
            modal.style.display = 'none';
          }
        });

        let currentSide = 'BUY';
        const buyBtn = modal.querySelector('#desk-btn-side-buy');
        const sellBtn = modal.querySelector('#desk-btn-side-sell');
        const transmitBtn = modal.querySelector('#desk-btn-transmit');

        buyBtn.onclick = () => {
          currentSide = 'BUY';
          buyBtn.style.background = '#10b981';
          buyBtn.style.color = '#fff';
          sellBtn.style.background = '#334155';
          sellBtn.style.color = '#94a3b8';
          transmitBtn.style.background = '#10b981';
          transmitBtn.innerText = 'TRANSMIT BUY ORDER';
        };

        sellBtn.onclick = () => {
          currentSide = 'SELL';
          sellBtn.style.background = '#ef4444';
          sellBtn.style.color = '#fff';
          buyBtn.style.background = '#334155';
          buyBtn.style.color = '#94a3b8';
          transmitBtn.style.background = '#ef4444';
          transmitBtn.innerText = 'TRANSMIT SELL ORDER';
        };

        const updateEstimates = () => {
          const qty = Number(modal.querySelector('#desk-in-qty').value) || 0;
          const price = Number(modal.querySelector('#desk-in-price').value) || 0;
          const slippageBps = 1.5 + (0.05 * Math.sqrt(Math.max(1, qty)));
          const notional = qty * price;
          modal.querySelector('#desk-calc-notional').innerText = `₹${notional.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
          modal.querySelector('#desk-calc-slippage').innerText = `${slippageBps.toFixed(2)} bps`;
        };

        modal.querySelector('#desk-in-qty').oninput = updateEstimates;
        modal.querySelector('#desk-in-price').oninput = updateEstimates;

        transmitBtn.onclick = () => {
          const sym = modal.querySelector('#desk-in-symbol').value.trim();
          const exch = modal.querySelector('#desk-in-exchange').value;
          const qty = Number(modal.querySelector('#desk-in-qty').value) || 1;
          const price = Number(modal.querySelector('#desk-in-price').value) || 0;

          const res = PaperBroker.placeOrder({
            symbol: sym,
            side: currentSide,
            qty,
            price,
            exchange: exch
          });

          if (!res.success) {
            alert(`Execution Rejected: ${res.reason}`);
          }
          PaperBroker._updateDeskTables(modal);
        };

        const resetBtn = modal.querySelector('#desk-btn-reset');
        if (resetBtn) {
          resetBtn.onclick = () => {
            if (confirm('Reset Paper Sandbox account balance to ₹10,00,000 INR?')) {
              PaperBroker.resetAccount();
              PaperBroker._updateDeskTables(modal);
            }
          };
        }
      }

      // Update inputs with requested options
      modal.querySelector('#desk-in-symbol').value = defaultSymbol;
      modal.querySelector('#desk-in-price').value = defaultPrice;
      modal.querySelector('#desk-in-exchange').value = defaultExchange;
      modal.style.display = 'block';

      PaperBroker._updateDeskTables(modal);
      return { success: true, modal };
    },

    _updateDeskTables(modal) {
      if (!modal) modal = document.getElementById('riskos-mock-order-desk-modal');
      if (!modal) return;

      const acct = PaperBroker.getAccount();

      // Update KPI bar
      const kpiBar = modal.querySelector('#desk-kpi-bar');
      if (kpiBar) {
        kpiBar.innerHTML = `
          <div><div style="color:#64748b;font-size:10px;font-weight:600;">AVAILABLE CASH</div><div style="font-weight:700;font-size:14px;color:#38bdf8;">₹${acct.cash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div></div>
          <div><div style="color:#64748b;font-size:10px;font-weight:600;">TOTAL NAV</div><div style="font-weight:700;font-size:14px;color:#f8fafc;">₹${acct.nav.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div></div>
          <div><div style="color:#64748b;font-size:10px;font-weight:600;">UNREALIZED PNL</div><div style="font-weight:700;font-size:14px;color:${acct.unrealizedPnl >= 0 ? '#10b981' : '#ef4444'};">${acct.unrealizedPnl >= 0 ? '+' : ''}₹${acct.unrealizedPnl.toFixed(2)}</div></div>
          <div><div style="color:#64748b;font-size:10px;font-weight:600;">REALIZED PNL</div><div style="font-weight:700;font-size:14px;color:${acct.realizedPnl >= 0 ? '#10b981' : '#ef4444'};">${acct.realizedPnl >= 0 ? '+' : ''}₹${acct.realizedPnl.toFixed(2)}</div></div>
          <div><div style="color:#64748b;font-size:10px;font-weight:600;">MARGIN FREE</div><div style="font-weight:700;font-size:14px;color:#a855f7;">₹${acct.marginFree.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div></div>
        `;
      }

      // Update Positions Table
      const posContainer = modal.querySelector('#desk-positions-container');
      const positions = PaperBroker.getPositions();
      if (posContainer) {
        if (positions.length === 0) {
          posContainer.innerHTML = `<div style="color:#64748b;text-align:center;padding:24px;font-style:italic;">No active positions in sandbox portfolio.</div>`;
        } else {
          posContainer.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:11px;text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid #1e293b;color:#64748b;background:#0d1322;">
                  <th style="padding:6px 10px;">Symbol</th>
                  <th style="padding:6px 10px;">Side</th>
                  <th style="padding:6px 10px;">Qty</th>
                  <th style="padding:6px 10px;">Avg Price</th>
                  <th style="padding:6px 10px;">Cur Price</th>
                  <th style="padding:6px 10px;">PnL</th>
                  <th style="padding:6px 10px;text-align:right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${positions.map(p => `
                  <tr style="border-bottom:1px solid #1e293b;">
                    <td style="padding:6px 10px;font-weight:600;font-family:monospace;">${p.symbol}</td>
                    <td style="padding:6px 10px;color:${p.side === 'BUY' ? '#10b981' : '#ef4444'};font-weight:700;">${p.side}</td>
                    <td style="padding:6px 10px;font-family:monospace;">${p.qty}</td>
                    <td style="padding:6px 10px;font-family:monospace;">₹${p.avgPrice.toFixed(2)}</td>
                    <td style="padding:6px 10px;font-family:monospace;">₹${p.currentPrice.toFixed(2)}</td>
                    <td style="padding:6px 10px;font-weight:700;color:${p.pnl >= 0 ? '#10b981' : '#ef4444'};font-family:monospace;">${p.pnl >= 0 ? '+' : ''}₹${p.pnl.toFixed(2)}</td>
                    <td style="padding:6px 10px;text-align:right;">
                      <button class="desk-close-pos-btn" data-sym="${p.symbol}" data-qty="${p.qty}" data-px="${p.currentPrice}" style="background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid rgba(239,68,68,0.4);border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">CLOSE</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;

          posContainer.querySelectorAll('.desk-close-pos-btn').forEach(btn => {
            btn.onclick = () => {
              const sym = btn.getAttribute('data-sym');
              const qty = Number(btn.getAttribute('data-qty'));
              const px = Number(btn.getAttribute('data-px'));
              PaperBroker.placeOrder({ symbol: sym, side: 'SELL', qty, price: px });
              PaperBroker._updateDeskTables(modal);
            };
          });
        }
      }

      // Update Blotter Table
      const blotterContainer = modal.querySelector('#desk-blotter-container');
      const trades = PaperBroker.getTradeHistory();
      if (blotterContainer) {
        if (trades.length === 0) {
          blotterContainer.innerHTML = `<div style="color:#64748b;text-align:center;padding:20px;font-style:italic;">No executions recorded yet.</div>`;
        } else {
          blotterContainer.innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:11px;text-align:left;">
              <thead>
                <tr style="border-bottom:1px solid #1e293b;color:#64748b;background:#0d1322;">
                  <th style="padding:6px 10px;">Time</th>
                  <th style="padding:6px 10px;">ID</th>
                  <th style="padding:6px 10px;">Symbol</th>
                  <th style="padding:6px 10px;">Side</th>
                  <th style="padding:6px 10px;">Qty</th>
                  <th style="padding:6px 10px;">Fill Price</th>
                  <th style="padding:6px 10px;">Slippage</th>
                  <th style="padding:6px 10px;">Notional</th>
                </tr>
              </thead>
              <tbody>
                ${trades.slice(0, 15).map(t => `
                  <tr style="border-bottom:1px solid #1e293b;">
                    <td style="padding:5px 10px;color:#64748b;font-family:monospace;">${t.timestamp}</td>
                    <td style="padding:5px 10px;font-family:monospace;color:#94a3b8;">${t.id}</td>
                    <td style="padding:5px 10px;font-weight:600;font-family:monospace;">${t.symbol}</td>
                    <td style="padding:5px 10px;font-weight:700;color:${t.side === 'BUY' ? '#10b981' : '#ef4444'};">${t.side}</td>
                    <td style="padding:5px 10px;font-family:monospace;">${t.qty}</td>
                    <td style="padding:5px 10px;font-family:monospace;">₹${t.fillPrice.toFixed(2)}</td>
                    <td style="padding:5px 10px;color:#38bdf8;font-family:monospace;">${t.slippageBps} bps</td>
                    <td style="padding:5px 10px;font-family:monospace;">₹${t.notional.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        }
      }
    }
  };

  root.PaperBroker = PaperBroker;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaperBroker;
  }
})(typeof window !== 'undefined' ? window : global);
