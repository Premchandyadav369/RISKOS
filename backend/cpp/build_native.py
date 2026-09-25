#!/usr/bin/env python3
"""
RISKOS Native C++ Engine Compiler Script
========================================
Detects MSVC (cl.exe), GCC (g++), Clang (clang++), or MinGW,
and compiles libriskos_fast.dll / libriskos_fast.so with AVX2/SIMD flags.
"""

import os
import sys
import shutil
import subprocess
import platform

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INCLUDE_DIR = os.path.join(SCRIPT_DIR, "include")
SRC_FILE = os.path.join(SCRIPT_DIR, "src", "riskos_fast_engine.cpp")
SYSTEM = platform.system()

def find_compiler():
    # Priority: g++, clang++, cl
    for comp in ["g++", "clang++", "cl"]:
        path = shutil.which(comp)
        if path:
            return comp, path
    return None, None

def build():
    compiler, comp_path = find_compiler()
    out_dir = SCRIPT_DIR
    
    if SYSTEM == "Windows":
        out_file = os.path.join(out_dir, "libriskos_fast.dll")
    elif SYSTEM == "Darwin":
        out_file = os.path.join(out_dir, "libriskos_fast.dylib")
    else:
        out_file = os.path.join(out_dir, "libriskos_fast.so")

    if not compiler:
        print("[RISKOS C++] No native C++ compiler found on system PATH (g++, clang++, cl).")
        print("[RISKOS C++] The platform will automatically run using its optimized vectorized NumPy BLAS/LAPACK fallback.")
        return False

    print(f"[RISKOS C++] Detected compiler: {compiler} ({comp_path})")
    print(f"[RISKOS C++] Compiling {SRC_FILE} -> {out_file}...")

    if compiler in ["g++", "clang++"]:
        cmd = [
            compiler,
            "-std=c++17",
            "-O3",
            "-march=native",
            "-ffast-math",
            "-shared",
            "-fPIC",
            f"-I{INCLUDE_DIR}",
            SRC_FILE,
            "-o",
            out_file
        ]
    elif compiler == "cl":
        cmd = [
            "cl.exe",
            "/std:c++17",
            "/O2",
            "/arch:AVX2",
            "/fp:fast",
            "/LD",
            f"/I{INCLUDE_DIR}",
            SRC_FILE,
            f"/Fe:{out_file}"
        ]

    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print("[RISKOS C++] Compilation successful!")
        print(f"[RISKOS C++] Shared library produced at: {out_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[RISKOS C++] Compilation failed:\n{e.stderr}")
        return False

if __name__ == "__main__":
    build()
