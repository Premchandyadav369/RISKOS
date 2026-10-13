cmake_minimum_required(VERSION 3.20)
project(riskos_native_core LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(MSVC)
    add_compile_options(/O2 /arch:AVX2 /GL /fp:fast /W4)
    set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} /LTCG")
else()
    add_compile_options(-O3 -march=native -mavx2 -mfma -ffast-math -flto -Wall -Wextra -fPIC)
endif()

add_library(riskos_cpp_core SHARED
    matching_engine.cpp
    simd_options_pricer.cpp
)

set_target_properties(riskos_cpp_core PROPERTIES
    PREFIX "lib"
    OUTPUT_NAME "riskos_cpp_core"
)
