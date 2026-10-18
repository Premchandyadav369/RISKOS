/**
 * RISKOS — HARDWARE CO-LOCATION & SUB-100-NANOSECOND FPGA/ASIC LATENCY SIMULATOR
 * (hardwareColocationSimulator.js)
 *
 * Simulates ultra-low latency exchange co-location, FPGA/ASIC hardware tick-to-trade
 * processing pipelines, kernel-bypass Solarflare EF_VI / DPDK ring buffers, cross-datacenter
 * line-of-sight microwave links, and top-of-book queue priority race dynamics.
 *
 * Modeled Exchange Datacenters:
 *   1. NYSE_MAHWAH (Mahwah, NJ - NYSE Euronext / Arca)
 *   2. NASDAQ_CARTERET (Carteret, NJ - NASDAQ TotalView-ITCH / OUCH)
 *   3. CBOE_SECAUCUS (Secaucus NY4, NJ - BATS / EDGA / EDGX / Cboe)
 *   4. LSE_SLOUGH (Slough LD4, London - LSE / Turquoise)
 *   5. EUREX_FRANKFURT (Equinix FR2, Frankfurt - Deutsche Börse / T7 Eurex)
 *   6. NSE_BKC (Equinix MB1 / Bandra-Kurla Complex, Mumbai - NSE India / BSE)
 *
 * Execution Latency Tiers:
 *   - TIER 1: FPGA_DIRECT_ATTACH (Sub-100ns pure hardware pipeline: 38ns - 85ns)
 *   - TIER 2: KERNEL_BYPASS_EF_VI (Solarflare Onload C++20 userspace polling: 680ns - 920ns)
 *   - TIER 3: LINUX_KERNEL_SOCKET (Optimized TCP with SO_BUSY_POLL: 8.5µs - 14.8µs)
 *   - TIER 4: CROSS_CAMPUS_MICROWAVE (Millimeter-wave RF line-of-sight: 4.1µs - 6.8µs)
 *   - TIER 5: RETAIL_PUBLIC_CLOUD (AWS us-east-1 to Exchange via fiber/internet: 12.5ms - 32.0ms)
 */

((root) => {
  'use strict';

  // ── Global Exchange Topology ────────────────────────────────────────────────
  const DATACENTERS = {
    NYSE_MAHWAH: {
      id: 'NYSE_MAHWAH',
      name: 'Mahwah Data Center (NYSE Euronext / Arca)',
      location: 'Mahwah, New Jersey, USA',
      coordinates: [41.0887, -74.1438],
      matchingEngine: 'NYSE Pillar Matching Engine',
      protocols: ['Pillar Gateway (Binary)', 'ITCH 5.0 Multicast'],
      feedType: 'A/B Feed MoldUDP64',
      baselineFpgaNs: 58.4,
      baselineKernelBypassNs: 740,
      baselineOsSocketUs: 9.8,
      cloudPingMs: 14.2,
      tier1JitterNs: 3.8
    },
    NASDAQ_CARTERET: {
      id: 'NASDAQ_CARTERET',
      name: 'Carteret Data Center (NASDAQ / NOM / BX)',
      location: 'Carteret, New Jersey, USA',
      coordinates: [40.5795, -74.2290],
      matchingEngine: 'NASDAQ INET Core',
      protocols: ['ITCH 5.0 (Multicast)', 'OUCH 4.2 / 5.0 (Binary)'],
      feedType: 'SoupBinTCP / MoldUDP64',
      baselineFpgaNs: 52.6,
      baselineKernelBypassNs: 690,
      baselineOsSocketUs: 8.9,
      cloudPingMs: 12.8,
      tier1JitterNs: 3.2
    },
    CBOE_SECAUCUS: {
      id: 'CBOE_SECAUCUS',
      name: 'Equinix NY4 (Cboe / BATS / EDGA / EDGX)',
      location: 'Secaucus, New Jersey, USA',
      coordinates: [40.7895, -74.0565],
      matchingEngine: 'Cboe Command FX / US Equities',
      protocols: ['BOE 2.0 (Binary)', 'PITCH 2.0 Multicast'],
      feedType: 'PITCH Multicast A/B',
      baselineFpgaNs: 55.2,
      baselineKernelBypassNs: 715,
      baselineOsSocketUs: 9.2,
      cloudPingMs: 13.5,
      tier1JitterNs: 3.5
    },
    LSE_SLOUGH: {
      id: 'LSE_SLOUGH',
      name: 'Equinix LD4 (London Stock Exchange / Turquoise)',
      location: 'Slough, Berkshire, UK',
      coordinates: [51.5105, -0.5950],
      matchingEngine: 'Millennium Exchange LSE',
      protocols: ['MITCH (Multicast ITCH)', 'OUCH Trading Gateway'],
      feedType: 'GTP Multicast Unit B',
      baselineFpgaNs: 61.8,
      baselineKernelBypassNs: 780,
      baselineOsSocketUs: 10.4,
      cloudPingMs: 16.4,
      tier1JitterNs: 4.1
    },
    EUREX_FRANKFURT: {
      id: 'EUREX_FRANKFURT',
      name: 'Equinix FR2 (Deutsche Börse / Eurex T7)',
      location: 'Frankfurt am Main, Germany',
      coordinates: [50.1109, 8.6821],
      matchingEngine: 'T7 High-Speed Matching Engine',
      protocols: ['EMDI (Market Data)', 'ETI (Enhanced Trading Interface)'],
      feedType: 'Eurex Net-Zero Compression',
      baselineFpgaNs: 59.5,
      baselineKernelBypassNs: 755,
      baselineOsSocketUs: 10.1,
      cloudPingMs: 15.9,
      tier1JitterNs: 3.9
    },
    NSE_BKC: {
      id: 'NSE_BKC',
      name: 'Equinix MB1 / Colaba (NSE India / BSE)',
      location: 'Bandra-Kurla Complex & Colaba, Mumbai, India',
      coordinates: [19.0600, 72.8685],
      matchingEngine: 'NSE NEAT / Tick-by-Tick Core',
      protocols: ['NSE TBT Multicast A/B', 'FAST Protocol', 'NOW DMA'],
      feedType: 'TBT 10Gbps Uncompressed Feed',
      baselineFpgaNs: 66.4,
      baselineKernelBypassNs: 820,
      baselineOsSocketUs: 11.2,
      cloudPingMs: 18.5,
      tier1JitterNs: 4.5
    }
  };

  // ── Hardware Tick-To-Trade Pipeline Stages ──────────────────────────────────
  const FPGA_PIPELINE_STAGES = [
    {
      id: 'stage_optics',
      name: 'Physical Optics & SFP28 PHY',
      desc: 'Laser signal arrival, PCS/PMA 64b/66b deserialization into FPGA fabric',
      minNs: 6.2,
      typicalNs: 8.5,
      maxNs: 12.0
    },
    {
      id: 'stage_mac_parse',
      name: '10GbE / 25GbE MAC & Feed Arbiter',
      desc: 'Hardware A/B feed arbitration, packet sequence check, dropping duplicates',
      minNs: 9.4,
      typicalNs: 12.8,
      maxNs: 16.5
    },
    {
      id: 'stage_book_decode',
      name: 'ITCH / Multicast L3 Parser',
      desc: 'Direct binary unpack into register file, Top-of-Book BBO cache update',
      minNs: 11.0,
      typicalNs: 14.6,
      maxNs: 19.2
    },
    {
      id: 'stage_strat_logic',
      name: 'Combinational Alpha & Arb Evaluator',
      desc: 'Pipelined DSP slice evaluation: Avellaneda-Stoikov spread skew & micro-price',
      minNs: 8.5,
      typicalNs: 11.8,
      maxNs: 15.4
    },
    {
      id: 'stage_risk_firewall',
      name: 'Hardware SEC 15c3-5 Pre-Trade Check',
      desc: 'Single-cycle bitmask validator: notional bounds, fat-finger clamp & credit limit',
      minNs: 3.8,
      typicalNs: 5.2,
      maxNs: 7.0
    },
    {
      id: 'stage_tx_dispatch',
      name: 'Direct SFP28 OUCH/FIX TX Dispatch',
      desc: 'Binary frame serialization, CRC32/modulo-256 calculation & optical egress',
      minNs: 6.5,
      typicalNs: 9.1,
      maxNs: 13.0
    }
  ];

  class HardwareColocationSimulator {
    constructor() {
      this.selectedDatacenter = 'NASDAQ_CARTERET';
      this.activeTier = 'FPGA_DIRECT_ATTACH';
      this.history = [];
      this.isBenchmarking = false;
    }

    /**
     * Get all available exchange data centers
     */
    getDatacenters() {
      return DATACENTERS;
    }

    /**
     * Get hardware pipeline stage definitions
     */
    getPipelineStages() {
      return FPGA_PIPELINE_STAGES;
    }

    /**
     * Run high-precision Monte Carlo hardware latency benchmark
     * @param {Object} options
     * @param {string} options.datacenterKey - e.g. 'NASDAQ_CARTERET'
     * @param {string} options.tier - 'FPGA_DIRECT_ATTACH' | 'KERNEL_BYPASS_EF_VI' | 'LINUX_KERNEL_SOCKET' | 'RETAIL_PUBLIC_CLOUD'
     * @param {number} options.packetCount - Number of simulated packet events
     * @param {number} options.competingHftCount - Number of competitor algorithms racing at top-of-book
     */
    runBenchmark(options = {}) {
      const dcKey = options.datacenterKey || this.selectedDatacenter;
      const tier = options.tier || this.activeTier;
      const count = Math.min(100000, Math.max(100, options.packetCount || 5000));
      const competitors = options.competingHftCount || 12;

      const dc = DATACENTERS[dcKey] || DATACENTERS.NASDAQ_CARTERET;
      const latencies = new Float64Array(count);
      const stageBreakdown = FPGA_PIPELINE_STAGES.map(s => ({
        id: s.id,
        name: s.name,
        avgNs: 0,
        minNs: Infinity,
        maxNs: -Infinity
      }));

      let totalLatencySum = 0;
      let topOfBookWins = 0;

      // Base jitter and distribution multipliers based on tier
      for (let i = 0; i < count; i++) {
        let orderLatencyNs = 0;

        if (tier === 'FPGA_DIRECT_ATTACH') {
          // Pure FPGA sub-100ns execution
          let pipelineSum = 0;
          for (let sIdx = 0; sIdx < FPGA_PIPELINE_STAGES.length; sIdx++) {
            const stage = FPGA_PIPELINE_STAGES[sIdx];
            // Normal distribution with log-normal positive tail
            const u1 = Math.max(1e-7, Math.random());
            const u2 = Math.max(1e-7, Math.random());
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            const std = (stage.maxNs - stage.minNs) / 6.0;
            let stageNs = stage.typicalNs + z * std;
            // Occasional micro-tail (1 in 500 packet cache miss or bit slip)
            if (Math.random() < 0.002) stageNs += Math.random() * 8.0;
            stageNs = Math.max(stage.minNs, Math.min(stage.maxNs * 1.4, stageNs));

            stageBreakdown[sIdx].avgNs += stageNs;
            if (stageNs < stageBreakdown[sIdx].minNs) stageBreakdown[sIdx].minNs = stageNs;
            if (stageNs > stageBreakdown[sIdx].maxNs) stageBreakdown[sIdx].maxNs = stageNs;

            pipelineSum += stageNs;
          }
          orderLatencyNs = pipelineSum;

        } else if (tier === 'KERNEL_BYPASS_EF_VI') {
          // Solarflare Onload userspace C++20 ring buffer (680ns - 950ns)
          const base = dc.baselineKernelBypassNs;
          const u1 = Math.max(1e-7, Math.random());
          const u2 = Math.max(1e-7, Math.random());
          const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          orderLatencyNs = base + z * 35.0;
          if (Math.random() < 0.01) orderLatencyNs += Math.random() * 250.0; // PCIe bus contention tail
          orderLatencyNs = Math.max(620, orderLatencyNs);

        } else if (tier === 'LINUX_KERNEL_SOCKET') {
          // Standard Linux TCP socket with SO_BUSY_POLL (8.5µs - 16µs)
          const baseNs = dc.baselineOsSocketUs * 1000;
          const u1 = Math.max(1e-7, Math.random());
          const u2 = Math.max(1e-7, Math.random());
          const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          orderLatencyNs = baseNs + z * 1800.0;
          if (Math.random() < 0.02) orderLatencyNs += Math.random() * 12000.0; // OS interrupt / context switch tail
          orderLatencyNs = Math.max(7500, orderLatencyNs);

        } else if (tier === 'CROSS_CAMPUS_MICROWAVE') {
          // Line-of-sight microwave link (e.g. Mahwah to Carteret: ~4.2µs)
          orderLatencyNs = 4250 + (Math.random() * 450 - 225); // weather/thermal jitter
          if (Math.random() < 0.005) orderLatencyNs += 800; // atmospheric rain fade

        } else {
          // RETAIL_PUBLIC_CLOUD (12.5ms - 35ms)
          const baseMs = dc.cloudPingMs;
          const u1 = Math.max(1e-7, Math.random());
          const u2 = Math.max(1e-7, Math.random());
          const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
          const ms = Math.max(8.0, baseMs + z * 3.5 + (Math.random() < 0.05 ? Math.random() * 15.0 : 0));
          orderLatencyNs = ms * 1000000;
        }

        latencies[i] = orderLatencyNs;
        totalLatencySum += orderLatencyNs;

        // Model Top-of-Book Queue Priority Race:
        // Competitors in co-located rack have latencies drawn from market distribution
        // For FPGA tier, competitor latency distribution has mean ~65ns (some slower, some faster)
        let minCompetitorNs = Infinity;
        for (let c = 0; c < competitors; c++) {
          const compLatency = (tier === 'FPGA_DIRECT_ATTACH')
            ? 52.0 + Math.random() * 35.0
            : (tier === 'KERNEL_BYPASS_EF_VI')
              ? 50.0 + Math.random() * 30.0 // Competitors are on FPGA!
              : 50.0 + Math.random() * 20.0;
          if (compLatency < minCompetitorNs) minCompetitorNs = compLatency;
        }

        if (orderLatencyNs <= minCompetitorNs) {
          topOfBookWins++;
        }
      }

      // Compute percentiles (P50, P90, P99, P99.9)
      latencies.sort();
      const p50 = latencies[Math.floor(count * 0.50)];
      const p90 = latencies[Math.floor(count * 0.90)];
      const p99 = latencies[Math.floor(count * 0.99)];
      const p999 = latencies[Math.floor(count * 0.999)];
      const minLatency = latencies[0];
      const maxLatency = latencies[count - 1];
      const meanLatency = totalLatencySum / count;

      // Finish stage averages
      stageBreakdown.forEach(s => {
        s.avgNs = Number((s.avgNs / count).toFixed(2));
        s.minNs = Number(s.minNs.toFixed(2));
        s.maxNs = Number(s.maxNs.toFixed(2));
      });

      const winRatePct = Number(((topOfBookWins / count) * 100).toFixed(2));
      // Annualized Latency Alpha: In sub-100ns HFT, each 10ns reduction captures ~$450,000/yr in spread capture
      const latencySavingsNs = Math.max(0, 1000 - meanLatency);
      const estimatedAlphaINR = Math.round((winRatePct / 100) * 12500000); // Up to ₹1.25 Cr / desk

      const result = {
        datacenter: dc,
        tier,
        packetCount: count,
        competitors,
        meanLatencyNs: Number(meanLatency.toFixed(2)),
        p50Ns: Number(p50.toFixed(2)),
        p90Ns: Number(p90.toFixed(2)),
        p99Ns: Number(p99.toFixed(2)),
        p999Ns: Number(p999.toFixed(2)),
        minLatencyNs: Number(minLatency.toFixed(2)),
        maxLatencyNs: Number(maxLatency.toFixed(2)),
        winRatePct,
        estimatedAlphaINR,
        isSub100Nanoseconds: meanLatency < 100.0,
        stages: stageBreakdown,
        timestamp: new Date().toISOString()
      };

      this.history.unshift(result);
      if (this.history.length > 20) this.history.pop();
      return result;
    }

    /**
     * Renders and opens the interactive Hardware Co-Location & Latency Workbench Modal
     */
    showColoModal() {
      if (typeof document === 'undefined') return;

      const initialBench = this.runBenchmark({
        datacenterKey: this.selectedDatacenter,
        tier: this.activeTier,
        packetCount: 2000,
        competingHftCount: 10
      });

      let modal = document.getElementById('hardwareColoModal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'hardwareColoModal';
        document.body.appendChild(modal);
      }

      const dcOptions = Object.keys(DATACENTERS).map(k => {
        const d = DATACENTERS[k];
        return `<option value="${k}" ${k === this.selectedDatacenter ? 'selected' : ''}>${d.name}</option>`;
      }).join('');

      modal.innerHTML = `
        <div style="position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:94%; max-width:980px; background:#070b14; border:1px solid rgba(34,211,238,0.35); box-shadow:0 25px 80px rgba(0,0,0,0.95); border-radius:14px; padding:24px; color:#f8fafc; font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace; z-index:999999; max-height:92vh; overflow-y:auto;">
          
          <!-- Header -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:14px; margin-bottom:18px;">
            <div>
              <div style="font-size:0.75rem; letter-spacing:0.12em; color:#22d3ee; text-transform:uppercase; font-weight:700;">Sub-100-Nanosecond Physical Layer Simulation</div>
              <h2 style="font-size:1.25rem; margin:3px 0 0; color:#fff; font-weight:800; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-microchip" style="color:#22d3ee;"></i> Hardware Co-Location &amp; FPGA Tick-to-Trade Workbench
              </h2>
            </div>
            <button onclick="document.getElementById('hardwareColoModal').style.display='none'" style="background:transparent; border:none; color:#94a3b8; font-size:1.4rem; cursor:pointer; padding:4px 8px;">&times;</button>
          </div>

          <!-- Controls Bar -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:18px; background:rgba(255,255,255,0.02); padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
            <div>
              <label style="font-size:0.7rem; color:#94a3b8; display:block; margin-bottom:4px; text-transform:uppercase;">Exchange Co-Lo Data Center</label>
              <select id="coloDcSelect" style="width:100%; background:#0e1626; border:1px solid rgba(255,255,255,0.15); color:#fff; padding:6px 10px; border-radius:6px; font-size:0.8rem;">
                ${dcOptions}
              </select>
            </div>
            <div>
              <label style="font-size:0.7rem; color:#94a3b8; display:block; margin-bottom:4px; text-transform:uppercase;">Execution Architecture Tier</label>
              <select id="coloTierSelect" style="width:100%; background:#0e1626; border:1px solid rgba(255,255,255,0.15); color:#fff; padding:6px 10px; border-radius:6px; font-size:0.8rem;">
                <option value="FPGA_DIRECT_ATTACH" selected>⚡ Tier 1: FPGA Direct MAC Attach (&lt;100ns)</option>
                <option value="KERNEL_BYPASS_EF_VI">🚀 Tier 2: Solarflare EF_VI Kernel Bypass (&lt;1µs)</option>
                <option value="LINUX_KERNEL_SOCKET">⚙️ Tier 3: Linux Kernel Socket (~10µs)</option>
                <option value="CROSS_CAMPUS_MICROWAVE">📡 Tier 4: Line-of-Sight RF Microwave (~4µs)</option>
                <option value="RETAIL_PUBLIC_CLOUD">☁️ Tier 5: Public Cloud Fiber / Web (~15ms)</option>
              </select>
            </div>
            <div>
              <label style="font-size:0.7rem; color:#94a3b8; display:block; margin-bottom:4px; text-transform:uppercase;">Simulated Orders</label>
              <select id="coloPacketsSelect" style="width:100%; background:#0e1626; border:1px solid rgba(255,255,255,0.15); color:#fff; padding:6px 10px; border-radius:6px; font-size:0.8rem;">
                <option value="1000">1,000 Packets (Quick)</option>
                <option value="5000" selected>5,000 Packets (Standard)</option>
                <option value="25000">25,000 Packets (Deep Stress)</option>
              </select>
            </div>
            <div style="display:flex; align-items:flex-end;">
              <button id="btnRunColoBench" style="width:100%; background:linear-gradient(135deg, #0ea5e9, #0284c7); border:none; color:#fff; padding:8px 14px; border-radius:6px; font-weight:700; font-size:0.82rem; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                <i class="fa-solid fa-play"></i> Run Hardware Benchmark
              </button>
            </div>
          </div>

          <!-- Dynamic Results Container -->
          <div id="coloResultsContainer">
            ${this._renderResultHtml(initialBench)}
          </div>

        </div>
      `;

      modal.style.display = 'block';

      // Attach event listeners
      document.getElementById('btnRunColoBench')?.addEventListener('click', () => {
        const dcVal = document.getElementById('coloDcSelect').value;
        const tierVal = document.getElementById('coloTierSelect').value;
        const pktVal = parseInt(document.getElementById('coloPacketsSelect').value, 10);
        this.selectedDatacenter = dcVal;
        this.activeTier = tierVal;
        const res = this.runBenchmark({ datacenterKey: dcVal, tier: tierVal, packetCount: pktVal, competingHftCount: 12 });
        document.getElementById('coloResultsContainer').innerHTML = this._renderResultHtml(res);
      });
    }

    _renderResultHtml(res) {
      const isSub100 = res.meanLatencyNs < 100.0;
      const latencyFormatted = res.meanLatencyNs < 1000
        ? `${res.meanLatencyNs} ns`
        : res.meanLatencyNs < 1000000
          ? `${(res.meanLatencyNs / 1000).toFixed(2)} µs`
          : `${(res.meanLatencyNs / 1000000).toFixed(2)} ms`;

      const p99Formatted = res.p99Ns < 1000
        ? `${res.p99Ns} ns`
        : res.p99Ns < 1000000
          ? `${(res.p99Ns / 1000).toFixed(2)} µs`
          : `${(res.p99Ns / 1000000).toFixed(2)} ms`;

      return `
        <!-- Metrics Grid -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:18px;">
          <div style="background:#0c1220; padding:12px; border-radius:8px; border:1px solid ${isSub100 ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)'};">
            <div style="font-size:0.68rem; color:#94a3b8; text-transform:uppercase;">Tick-To-Trade (Mean)</div>
            <div style="font-size:1.35rem; font-weight:800; color:${isSub100 ? '#10b981' : '#38bdf8'}; margin:2px 0;">${latencyFormatted}</div>
            <div style="font-size:0.7rem; color:${isSub100 ? '#10b981' : '#94a3b8'};">${isSub100 ? '✓ SUB-100ns FPGA ACHIEVED' : 'Non-FPGA Software Tier'}</div>
          </div>
          <div style="background:#0c1220; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:0.68rem; color:#94a3b8; text-transform:uppercase;">P99 Tail Latency</div>
            <div style="font-size:1.35rem; font-weight:800; color:#fbbf24; margin:2px 0;">${p99Formatted}</div>
            <div style="font-size:0.7rem; color:#94a3b8;">Max: ${(res.maxLatencyNs / 1000).toFixed(2)} µs</div>
          </div>
          <div style="background:#0c1220; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:0.68rem; color:#94a3b8; text-transform:uppercase;">Queue Win Probability</div>
            <div style="font-size:1.35rem; font-weight:800; color:${res.winRatePct > 70 ? '#10b981' : res.winRatePct > 40 ? '#38bdf8' : '#f87171'}; margin:2px 0;">${res.winRatePct}%</div>
            <div style="font-size:0.7rem; color:#94a3b8;">vs 12 Co-Lo Competitors</div>
          </div>
          <div style="background:#0c1220; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:0.68rem; color:#94a3b8; text-transform:uppercase;">Annualized Latency Alpha</div>
            <div style="font-size:1.35rem; font-weight:800; color:#10b981; margin:2px 0;">+₹${(res.estimatedAlphaINR / 100000).toFixed(1)} Lakhs</div>
            <div style="font-size:0.7rem; color:#94a3b8;">Captured Top-of-Book Spread</div>
          </div>
        </div>

        <!-- FPGA Hardware Pipeline Waterfall (Tier 1 view) -->
        <div style="background:#090e1a; padding:14px; border-radius:8px; border:1px solid rgba(255,255,255,0.06); margin-bottom:16px;">
          <div style="font-size:0.75rem; color:#22d3ee; font-weight:700; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <span><i class="fa-solid fa-layer-group"></i> FPGA ASIC Tick-to-Trade Hardware Pipeline Breakdown</span>
            <span style="font-size:0.68rem; color:#94a3b8;">Xilinx UltraScale+ / Alveo U50 RTL Logic</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${res.stages.map(s => {
              const pct = Math.max(5, Math.min(100, Math.round((s.avgNs / res.meanLatencyNs) * 100)));
              return `
                <div style="display:grid; grid-template-columns:220px 1fr 75px; align-items:center; gap:10px; font-size:0.72rem;">
                  <div style="color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.name}</div>
                  <div style="background:rgba(255,255,255,0.05); height:8px; border-radius:4px; overflow:hidden;">
                    <div style="background:linear-gradient(90deg, #0ea5e9, #10b981); height:100%; width:${pct}%;"></div>
                  </div>
                  <div style="color:#38bdf8; font-weight:700; text-align:right;">${s.avgNs} ns</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Datacenter Specs Summary -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:rgba(34,211,238,0.04); border:1px solid rgba(34,211,238,0.2); border-radius:6px; font-size:0.72rem;">
          <div><strong style="color:#fff;">Co-Lo Site:</strong> ${res.datacenter.name} &bull; <span style="color:#94a3b8;">${res.datacenter.matchingEngine}</span></div>
          <div><strong style="color:#22d3ee;">Feed:</strong> ${res.datacenter.feedType}</div>
        </div>
      `;
    }
  }

  // Create singleton instance
  const instance = new HardwareColocationSimulator();

  // Export to global scope
  root.HardwareColocationSimulator = instance;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HardwareColocationSimulator, instance, DATACENTERS, FPGA_PIPELINE_STAGES };
  }

})(typeof window !== 'undefined' ? window : global);
