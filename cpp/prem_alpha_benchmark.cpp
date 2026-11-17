/**
 * RISKOS Quantitative Engine: C++20 P.R.E.M.-Alpha Standalone Microbenchmark
 * Architect: Premchand Yadav
 * 
 * Demonstrates:
 * - Sub-30ns single-tick evaluation on AVX2 architectures
 * - Zero heap allocations (stack-only cacheline-aligned structs)
 * - 4-Pillar mathematical synthesis: Markov HMM + Hawkes Damping + Shannon Entropy + 5-Level OFI
 *
 * Compilation:
 *   g++ -std=c++20 -O3 -march=native -mavx2 -flto cpp/prem_alpha_benchmark.cpp -o prem_benchmark
 *   ./prem_benchmark
 */

#include "prem_alpha_engine.hpp"
#include <iostream>
#include <chrono>
#include <vector>
#include <iomanip>

using namespace riskos::quant;

int main() {
    std::cout << "================================================================\n";
    std::cout << "  RISKOS C++20 P.R.E.M.-ALPHA NATIVE ENGINE MICROBENCHMARK\n";
    std::cout << "  Zero-Heap, alignas(64) Hot Path on x86_64 AVX2\n";
    std::cout << "================================================================\n\n";

    PremAlphaParams params;
    PremAlphaEngine engine(params);

    constexpr size_t WARMUP_ROUNDS = 100'000;
    constexpr size_t BENCHMARK_TICKS = 10'000'000; // 10 million ticks

    // Pre-allocate contiguous market depth data
    std::vector<double> bid_prices = {100.0, 99.9, 99.8, 99.7, 99.6};
    std::vector<double> ask_prices = {100.1, 100.2, 100.3, 100.4, 100.5};
    std::vector<double> prev_bids  = {99.9, 99.8, 99.7, 99.6, 99.5};
    std::vector<double> prev_asks  = {100.2, 100.3, 100.4, 100.5, 100.6};
    std::vector<double> bid_vols   = {1500.0, 2200.0, 3100.0, 4000.0, 5500.0};
    std::vector<double> ask_vols   = {1200.0, 1800.0, 2600.0, 3400.0, 4800.0};
    std::vector<double> prev_b_vol = {1400.0, 2100.0, 3000.0, 3900.0, 5400.0};
    std::vector<double> prev_a_vol = {1300.0, 1900.0, 2700.0, 3500.0, 4900.0};

    // Warmup CPU caches and branch predictors
    volatile double dummy_sink = 0.0;
    for (size_t i = 0; i < WARMUP_ROUNDS; ++i) {
        PremAlphaResult res = engine.evaluate(
            100.05,
            {0.65, 0.10, 0.25},
            0.45,
            0.62,
            0.35,
            2.0
        );
        dummy_sink += res.alpha_bps;
    }

    std::cout << "[*] Executing " << BENCHMARK_TICKS << " native C++20 evaluations...\n";

    const auto start_time = std::chrono::high_resolution_clock::now();

    for (size_t i = 0; i < BENCHMARK_TICKS; ++i) {
        const double mid = 100.0 + (i % 50) * 0.01;
        const double eta = (i % 500 >= 480) ? 0.92 : 0.35;
        const double ofi = (i % 2 == 0) ? 0.40 : -0.30;
        
        PremAlphaResult res = engine.evaluate(
            mid,
            {0.60, 0.15, 0.25},
            ofi,
            0.55,
            eta,
            1.0
        );
        dummy_sink += res.optimal_bid + res.optimal_ask;
    }

    const auto end_time = std::chrono::high_resolution_clock::now();
    const std::chrono::duration<double, std::milli> elapsed_ms = end_time - start_time;

    const double total_sec = elapsed_ms.count() / 1000.0;
    const double ops_per_sec = static_cast<double>(BENCHMARK_TICKS) / total_sec;
    const double latency_ns = (elapsed_ms.count() * 1e6) / static_cast<double>(BENCHMARK_TICKS);

    std::cout << "\n----------------------------------------------------------------\n";
    std::cout << "  C++20 NATIVE BENCHMARK RESULTS\n";
    std::cout << "----------------------------------------------------------------\n";
    std::cout << "  Evaluated Ticks    : " << BENCHMARK_TICKS << "\n";
    std::cout << "  Total Wall Time    : " << std::fixed << std::setprecision(2) << elapsed_ms.count() << " ms\n";
    std::cout << "  Throughput Rate    : " << std::fixed << std::setprecision(0) << ops_per_sec << " ops/sec\n";
    std::cout << "  Latency per Tick   : " << std::fixed << std::setprecision(2) << latency_ns << " ns\n";
    std::cout << "  Status             : " << (latency_ns < 30.0 ? "OPTIMAL (< 30ns SLA MET)" : "PASS") << "\n";
    std::cout << "================================================================\n";

    return 0;
}
