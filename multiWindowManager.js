/**
 * RISKOS — MULTI-WINDOW BLOOMBERG TERMINAL & MULTI-MONITOR STUDIO (multiWindowManager.js)
 * High-performance multi-monitor layout orchestrator:
 *   - Detaches specialized quant workstations across secondary & tertiary displays
 *   - Dual, Triple, and Quad-Display Presets (DOM Ladder, 41-Bot Fleet, Stock Lab, Observatory)
 *   - Real-time cross-window synchronization via BroadcastChannel('riskos_multi_window_bus')
 */

((root) => {
  'use strict';

  const CHANNEL_NAME = 'riskos_multi_window_bus';

  class MultiWindowManagerController {
    constructor() {
      this.channel = null;
      this.openWindows = {};
      this._initChannel();
    }

    _initChannel() {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel(CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            this._handleChannelMessage(event.data);
          };
        } catch (e) {}
      }
    }

    _handleChannelMessage(data) {
      if (!data) return;
      if (data.type === 'SYNC_TICKER' && data.symbol) {
        if (root.SecurityMaster && typeof root.SecurityMaster.setCurrentSymbol === 'function') {
          root.SecurityMaster.setCurrentSymbol(data.symbol);
        }
      }
    }

    broadcast(type, payload = {}) {
      if (this.channel) {
        this.channel.postMessage({ type, ...payload, timestamp: Date.now() });
      }
    }

    detachWindow(targetUrl, windowName, width = 1280, height = 800) {
      if (typeof window === 'undefined') return;

      const left = window.screenLeft !== undefined ? window.screenLeft + 50 : 50;
      const top = window.screenTop !== undefined ? window.screenTop + 50 : 50;
      const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;

      const newWin = window.open(targetUrl, windowName, features);
      if (newWin) {
        this.openWindows[windowName] = newWin;
        if (root.SoundFX) root.SoundFX.playFill();
        if (root.showToast) root.showToast(`Detached workspace to external window: ${windowName}`);
      } else {
        alert('Please allow popups in your browser to launch detached multi-monitor windows.');
      }
      return newWin;
    }

    launchDualMonitor() {
      this.detachWindow('hft.html', 'RISKOS_HFT_DOM_WINDOW', 1280, 840);
    }

    launchTripleMonitor() {
      this.detachWindow('hft.html', 'RISKOS_HFT_DOM_WINDOW', 1200, 800);
      setTimeout(() => {
        this.detachWindow('fleet.html', 'RISKOS_FLEET_SWARM_WINDOW', 1200, 800);
      }, 300);
    }

    launchQuadWall() {
      this.detachWindow('hft.html', 'RISKOS_HFT_DOM_WINDOW', 1100, 750);
      setTimeout(() => this.detachWindow('fleet.html', 'RISKOS_FLEET_SWARM_WINDOW', 1100, 750), 250);
      setTimeout(() => this.detachWindow('learn.html?tab=stocklab', 'RISKOS_STOCK_LAB_WINDOW', 1100, 750), 500);
      setTimeout(() => this.detachWindow('observatory.html', 'RISKOS_OBSERVATORY_WINDOW', 1100, 750), 750);
    }

    openMultiWindowModal() {
      if (typeof document === 'undefined') return;
      let modal = document.getElementById('riskosMultiWindowModal');

      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'riskosMultiWindowModal';
        modal.style.cssText = `
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        `;

        modal.innerHTML = `
          <div style="background:#090d16; border:1px solid #1e293b; border-radius:14px; width:100%; max-width:760px; box-shadow:0 25px 60px -15px rgba(0,0,0,0.95); color:#f1f5f9; font-family:Inter,system-ui,sans-serif; max-height:88vh; display:flex; flex-direction:column; overflow:hidden;">
            <!-- Header -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:16px 22px; border-bottom:1px solid #1e293b; background:#0d1322;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-weight:800; font-size:15px; color:#38bdf8;"><i class="fa-solid fa-display"></i> MULTI-MONITOR WORKSPACE STUDIO</span>
                <span style="background:rgba(56,189,248,0.15); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); font-size:11px; padding:2px 8px; border-radius:999px; font-weight:700;">BLOOMBERG TILED LAYOUT</span>
              </div>
              <button id="multiWinCloseBtn" style="background:none; border:none; color:#94a3b8; font-size:22px; cursor:pointer; line-height:1;">&times;</button>
            </div>

            <!-- Body -->
            <div style="padding:22px; overflow-y:auto; display:flex; flex-direction:column; gap:18px;">
              <p style="margin:0; font-size:12px; color:#94a3b8;">
                Detach specialized trading desks into dedicated floating windows to spread across multiple external monitors. All detached windows automatically synchronize market data ticks, order executions, and alerts in real-time.
              </p>

              <!-- Presets Grid -->
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px;">
                <button class="multi-win-preset-card" id="btnPresetDual" style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:14px; text-align:left; cursor:pointer; color:#fff;">
                  <div style="font-size:11px; font-weight:800; color:#38bdf8; margin-bottom:4px;"><i class="fa-solid fa-clone"></i> DUAL MONITOR</div>
                  <div style="font-size:12px; font-weight:700; margin-bottom:4px;">Main + L3 HFT Footprint</div>
                  <div style="font-size:10px; color:#94a3b8;">Detaches HFT DOM Ladder to Display 2.</div>
                </button>

                <button class="multi-win-preset-card" id="btnPresetTriple" style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:14px; text-align:left; cursor:pointer; color:#fff;">
                  <div style="font-size:11px; font-weight:800; color:#10b981; margin-bottom:4px;"><i class="fa-solid fa-table-columns"></i> TRIPLE MONITOR</div>
                  <div style="font-size:12px; font-weight:700; margin-bottom:4px;">Main + DOM + 41 Bots</div>
                  <div style="font-size:10px; color:#94a3b8;">Full trading floor setup across 3 screens.</div>
                </button>

                <button class="multi-win-preset-card" id="btnPresetQuad" style="background:#0f172a; border:1px solid #1e293b; border-radius:8px; padding:14px; text-align:left; cursor:pointer; color:#fff;">
                  <div style="font-size:11px; font-weight:800; color:#c084fc; margin-bottom:4px;"><i class="fa-solid fa-grid-4"></i> QUAD WALL</div>
                  <div style="font-size:12px; font-weight:700; margin-bottom:4px;">Prop Desk Command Wall</div>
                  <div style="font-size:10px; color:#94a3b8;">4 synced windows: Main, HFT, Bots, Lab.</div>
                </button>
              </div>

              <!-- Individual Detach Strips -->
              <div style="background:#020617; border:1px solid #1e293b; border-radius:8px; padding:14px;">
                <div style="font-size:11px; font-weight:800; color:#64748b; text-transform:uppercase; margin-bottom:10px;">Individual Workspace Detach</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                  <button class="detach-single-btn" data-url="hft.html" data-name="RISKOS_HFT" style="padding:8px 12px; background:#0f172a; border:1px solid #334155; border-radius:4px; color:#cbd5e1; font-size:11px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fa-solid fa-bolt-lightning text-cyan"></i> HFT DOM Ladder</span>
                    <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i>
                  </button>
                  <button class="detach-single-btn" data-url="fleet.html" data-name="RISKOS_FLEET" style="padding:8px 12px; background:#0f172a; border:1px solid #334155; border-radius:4px; color:#cbd5e1; font-size:11px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fa-solid fa-robot text-green"></i> 41-Bot Swarm Fleet</span>
                    <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i>
                  </button>
                  <button class="detach-single-btn" data-url="learn.html?tab=stocklab" data-name="RISKOS_STOCKLAB" style="padding:8px 12px; background:#0f172a; border:1px solid #334155; border-radius:4px; color:#cbd5e1; font-size:11px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fa-solid fa-flask-vial text-cyan"></i> 21-Model Stock Lab</span>
                    <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i>
                  </button>
                  <button class="detach-single-btn" data-url="observatory.html" data-name="RISKOS_OBSERVATORY" style="padding:8px 12px; background:#0f172a; border:1px solid #334155; border-radius:4px; color:#cbd5e1; font-size:11px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                    <span><i class="fa-solid fa-satellite-dish text-rose"></i> Global Observatory</span>
                    <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:10px;"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#multiWinCloseBtn').onclick = () => { modal.style.display = 'none'; };
        modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

        modal.querySelector('#btnPresetDual').onclick = () => {
          this.launchDualMonitor();
          modal.style.display = 'none';
        };

        modal.querySelector('#btnPresetTriple').onclick = () => {
          this.launchTripleMonitor();
          modal.style.display = 'none';
        };

        modal.querySelector('#btnPresetQuad').onclick = () => {
          this.launchQuadWall();
          modal.style.display = 'none';
        };

        modal.querySelectorAll('.detach-single-btn').forEach(btn => {
          btn.onclick = () => {
            const url = btn.getAttribute('data-url');
            const name = btn.getAttribute('data-name');
            this.detachWindow(url, name);
          };
        });
      }

      modal.style.display = 'flex';
      if (root.SoundFX) root.SoundFX.playChime();
    }
  }

  const instance = new MultiWindowManagerController();
  root.MultiWindowManager = instance;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }

  // Auto-bind triggers
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('#btnMultiWindowLayout, .open-multi-window-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          instance.openMultiWindowModal();
        });
      });
    });
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
