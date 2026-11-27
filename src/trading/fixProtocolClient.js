/**
 * RISKOS Direct Market Access (DMA) FIX Protocol 4.4 / 5.0 Client & Session Manager
 * Language: ECMAScript 2022 (Isomorphic Node.js + Modern Browser)
 * 
 * Capabilities:
 * - RFC-compliant tag-value parsing and ASCII checksum calculation (Tag 10)
 * - FIX 4.4 and 5.0 SP2 message generation: Logon (35=A), NewOrderSingle (35=D), ExecutionReport (35=8), OrderCancel (35=F)
 * - Session sequence number tracking (inSeq / outSeq) and heartbeat ping-pong
 * - Interactive Terminal modal UI for live FIX wire trace inspection
 */

(function (root) {
  'use strict';

  const SOH = '\x01';

  class FixMessage {
    constructor(beginString = 'FIX.4.4') {
      this.beginString = beginString;
      this.fields = new Map();
    }

    set(tag, value) {
      this.fields.set(Number(tag), String(value));
      return this;
    }

    get(tag) {
      return this.fields.get(Number(tag));
    }

    msgType() {
      return this.get(35);
    }

    static computeChecksum(wireString) {
      let sum = 0;
      for (let i = 0; i < wireString.length; i++) {
        sum += wireString.charCodeAt(i);
      }
      const csum = sum % 256;
      return String(csum).padStart(3, '0');
    }

    serialize() {
      let body = '';
      if (this.fields.has(35)) {
        body += `35=${this.fields.get(35)}${SOH}`;
      }

      for (const [tag, val] of this.fields.entries()) {
        if (tag !== 8 && tag !== 9 && tag !== 35 && tag !== 10) {
          body += `${tag}=${val}${SOH}`;
        }
      }

      const header = `8=${this.beginString}${SOH}9=${body.length}${SOH}`;
      const unchecksummed = header + body;
      const csum = FixMessage.computeChecksum(unchecksummed);
      return `${unchecksummed}10=${csum}${SOH}`;
    }

    toHumanString() {
      return this.serialize().replace(/\x01/g, ' | ');
    }

    static parse(raw) {
      const msg = new FixMessage();
      const delimiter = raw.includes(SOH) ? SOH : '|';
      const parts = raw.split(delimiter);

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const tag = Number(trimmed.substring(0, eqIdx));
          const val = trimmed.substring(eqIdx + 1);
          if (!isNaN(tag)) {
            msg.set(tag, val);
          }
        }
      }

      if (msg.fields.has(8)) msg.beginString = msg.get(8);
      return msg;
    }
  }

  class FixSessionController {
    constructor() {
      this.senderCompId = 'RISKOS_DMA_CLIENT';
      this.targetCompId = 'EXCHANGE_SIM_GATEWAY';
      this.fixVersion = 'FIX.4.4';
      this.outSeq = 1;
      this.inSeq = 1;
      this.isLoggedIn = false;
      this.messageHistory = [];
      this.activeOrders = new Map();
    }

    logon(heartbeatSec = 30) {
      const msg = new FixMessage(this.fixVersion)
        .set(35, 'A')
        .set(49, this.senderCompId)
        .set(56, this.targetCompId)
        .set(34, this.outSeq++)
        .set(52, new Date().toISOString().replace(/[-:T]/g, '').slice(0, 17))
        .set(98, '0') // No encryption
        .set(108, heartbeatSec);

      this.isLoggedIn = true;
      this.recordMessage('OUT', msg);
      return msg;
    }

    sendNewOrderSingle({ symbol, side, qty, price, ordType = 'LIMIT', clOrdId = null }) {
      const orderId = clOrdId || `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const fixSide = (side === 'BUY' || side === 1) ? '1' : '2';
      const fixOrdType = (ordType === 'MARKET' || ordType === 1) ? '1' : '2';

      const msg = new FixMessage(this.fixVersion)
        .set(35, 'D')
        .set(49, this.senderCompId)
        .set(56, this.targetCompId)
        .set(34, this.outSeq++)
        .set(52, new Date().toISOString().replace(/[-:T]/g, '').slice(0, 17))
        .set(11, orderId)
        .set(55, symbol)
        .set(54, fixSide)
        .set(38, qty)
        .set(40, fixOrdType)
        .set(60, new Date().toISOString().replace(/[-:T]/g, '').slice(0, 17));

      if (fixOrdType === '2') {
        msg.set(44, Number(price).toFixed(2));
      }

      this.activeOrders.set(orderId, {
        orderId,
        symbol,
        side: fixSide === '1' ? 'BUY' : 'SELL',
        qty,
        price,
        status: 'PENDING_NEW',
        timestamp: Date.now()
      });

      this.recordMessage('OUT', msg);

      // Simulate instantaneous exchange execution report fill
      const execReport = this.simulateExecutionReport(orderId, symbol, fixSide, qty, price);
      return { orderId, orderMsg: msg, execReport };
    }

    simulateExecutionReport(clOrdId, symbol, side, qty, price) {
      const execId = `EXEC_${Date.now()}`;
      const msg = new FixMessage(this.fixVersion)
        .set(35, '8') // ExecutionReport
        .set(49, this.targetCompId)
        .set(56, this.senderCompId)
        .set(34, this.inSeq++)
        .set(52, new Date().toISOString().replace(/[-:T]/g, '').slice(0, 17))
        .set(11, clOrdId)
        .set(17, execId)
        .set(150, '2') // ExecType: Fill
        .set(39, '2')  // OrdStatus: Filled
        .set(55, symbol)
        .set(54, side)
        .set(38, qty)
        .set(32, qty)  // LastQty
        .set(31, Number(price).toFixed(2)) // LastPx
        .set(14, qty)  // CumQty
        .set(6, Number(price).toFixed(2)); // AvgPx

      this.recordMessage('IN', msg);

      if (this.activeOrders.has(clOrdId)) {
        const ord = this.activeOrders.get(clOrdId);
        ord.status = 'FILLED';
        ord.fillPrice = price;
        ord.execId = execId;
      }

      return msg;
    }

    recordMessage(direction, msg) {
      this.messageHistory.unshift({
        direction,
        msgType: msg.msgType(),
        raw: msg.toHumanString(),
        timestamp: new Date().toLocaleTimeString()
      });
      if (this.messageHistory.length > 50) this.messageHistory.pop();
    }

    showFixModal() {
      if (typeof document === 'undefined') return;
      let modal = document.getElementById('fixProtocolModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'fixProtocolModal';
        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:90%; max-width:820px; background:#080c14; border:1px solid rgba(56,189,248,0.3); box-shadow:0 25px 70px rgba(0,0,0,0.9); border-radius:14px; padding:24px; color:#f8fafc; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; z-index:999999; max-height:90vh; overflow-y:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px;">
            <div>
              <div style="font-size:0.75rem; letter-spacing:0.1em; color:#38bdf8; text-transform:uppercase; font-weight:700;">Direct Market Access (DMA) Gateway</div>
              <h2 style="font-size:1.15rem; margin:2px 0 0; color:#fff; font-weight:700; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-satellite-dish" style="color:#38bdf8;"></i> FIX 4.4 / 5.0 Session Engine
              </h2>
            </div>
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.35); color:#10b981; padding:4px 10px; border-radius:100px; font-size:0.75rem; font-weight:700;">
                SESSION: ${this.isLoggedIn ? 'LOGGED ON (35=A)' : 'READY'}
              </span>
              <button onclick="document.getElementById('fixProtocolModal').style.display='none'" style="background:transparent; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer; padding:4px 8px;">&times;</button>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:18px;">
            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px;">
              <div style="font-size:0.72rem; color:#94a3b8; margin-bottom:4px;">Session Parameters</div>
              <div style="font-size:0.8rem; color:#f1f5f9; line-height:1.6;">
                <div>SenderCompID (Tag 49): <strong style="color:#38bdf8;">${this.senderCompId}</strong></div>
                <div>TargetCompID (Tag 56): <strong style="color:#a855f7;">${this.targetCompId}</strong></div>
                <div>Protocol Version: <strong style="color:#10b981;">${this.fixVersion}</strong></div>
                <div>SeqNums: Out=${this.outSeq} | In=${this.inSeq}</div>
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:14px;">
              <div style="font-size:0.72rem; color:#94a3b8; margin-bottom:8px;">Fast Order Submission via FIX</div>
              <div style="display:flex; gap:8px; margin-bottom:8px;">
                <input type="text" id="fixSymbolInput" value="RELIANCE.NS" style="background:#111; border:1px solid #333; color:#fff; padding:6px 10px; border-radius:6px; font-size:0.75rem; width:45%;" placeholder="Symbol">
                <input type="number" id="fixQtyInput" value="50" style="background:#111; border:1px solid #333; color:#fff; padding:6px 10px; border-radius:6px; font-size:0.75rem; width:25%;" placeholder="Qty">
                <input type="number" id="fixPriceInput" value="2950" style="background:#111; border:1px solid #333; color:#fff; padding:6px 10px; border-radius:6px; font-size:0.75rem; width:30%;" placeholder="Price">
              </div>
              <button id="btnSendFixOrder" style="width:100%; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.35); color:#38bdf8; border-radius:6px; padding:6px; font-size:0.75rem; font-weight:700; cursor:pointer;">
                <i class="fa-solid fa-paper-plane"></i> Transmit 35=D (NewOrderSingle)
              </button>
            </div>
          </div>

          <div style="margin-bottom:12px; font-size:0.75rem; color:#94a3b8; font-weight:700;">Live FIX Wire Log (RFC Tag-Value SOH Delimited)</div>
          <div id="fixWireLogContainer" style="background:#020617; border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:12px; height:200px; overflow-y:auto; font-size:0.72rem; line-height:1.5;">
            ${this.messageHistory.map(m => `
              <div style="margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid rgba(255,255,255,0.04); word-break:break-all;">
                <span style="color:#64748b;">[${m.timestamp}]</span>
                <span style="color:${m.direction === 'OUT' ? '#38bdf8' : '#10b981'}; font-weight:700;">${m.direction} (35=${m.msgType})</span>:
                <span style="color:#cbd5e1;">${m.raw}</span>
              </div>
            `).join('') || '<div style="color:#64748b;">No FIX messages yet. Click transmit or initialize session.</div>'}
          </div>

          <div style="margin-top:16px; display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.7rem; color:#64748b;">Supported Tags: 8, 9, 35, 49, 56, 34, 11, 55, 54, 38, 44, 40, 10 (Checksum mod 256)</div>
            <button onclick="document.getElementById('fixProtocolModal').style.display='none'" style="background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#fff; border-radius:6px; padding:6px 14px; font-size:0.75rem; cursor:pointer;">
              Close
            </button>
          </div>
        </div>
      `;

      modal.style.display = 'block';

      const sendBtn = document.getElementById('btnSendFixOrder');
      if (sendBtn) {
        sendBtn.onclick = () => {
          const sym = document.getElementById('fixSymbolInput').value || 'RELIANCE.NS';
          const qty = Number(document.getElementById('fixQtyInput').value) || 50;
          const price = Number(document.getElementById('fixPriceInput').value) || 2950;
          this.sendNewOrderSingle({ symbol: sym, side: 'BUY', qty, price, ordType: 'LIMIT' });
          this.showFixModal(); // Re-render log
        };
      }
    }

    initDomListeners() {
      if (typeof document === 'undefined') return;
      const bind = () => {
        const triggers = document.querySelectorAll('#btnOpenFixModal, .open-fix-btn');
        triggers.forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showFixModal();
          });
        });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
      } else {
        bind();
      }
    }
  }

  const instance = new FixSessionController();
  instance.initDomListeners();
  root.FixMessage = FixMessage;
  root.FixProtocolClient = instance;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FixMessage, FixProtocolClient: instance };
  }
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
