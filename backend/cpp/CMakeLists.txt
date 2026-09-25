cmake_minimum_required(VERSION 3.14)
project(riskos_fast LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Optimization flags for ultra-low latency execution
if(MSVC)
    add_compile_options(/O2 /arch:AVX2 /GL /W3 /fp:fast)
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} /LTCG")
else()
    add_compile_options(-O3 -march=native -ffast-math -flto -Wall -Wextra -fPIC)
endif()

include_directories(include)

add_library(riskos_fast SHARED
    src/riskos_fast_engine.cpp
    include/riskos_fast_engine.hpp
)

set_target_properties(riskos_fast PROPERTIES
    PREFIX "lib"
    OUTPUT_NAME "riskos_fast"
)

# Standalone C++ benchmark executable
add_executable(bench_cpp_engine src/riskos_fast_engine.cpp)
target_compile_definitions(bench_cpp_engine PRIVATE RISKOS_STANDALONE_BENCH=1)
