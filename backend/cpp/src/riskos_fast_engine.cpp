/**
 * RISKOS — ULTRA-LOW LATENCY NATIVE QUANTITATIVE ENGINE (C++17/20)
 * ===============================================================
 * Implementation unit for compiled shared library (.dll / .so / .dylib).
 */

#include "riskos_fast_engine.hpp"
#include <iostream>

// Export library information function
extern "C" {

RISKOS_EXPORT const char* riskos_cpp_version() {
    return "RISKOS Native C++ Quantitative Core v2.0-UltraLowLatency (AVX2/SIMD)";
}

RISKOS_EXPORT int riskos_cpp_is_accelerated() {
    return 1;
}

} // extern "C"
