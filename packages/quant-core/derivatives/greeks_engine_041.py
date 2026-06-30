"""
RISKOS Derivatives Lab: Analytical Greeks & Surface Valuation #041
"""
import math

def bsm_call_price(s: float, k: float, t: float, r: float, sigma: float, q: float = 0.0) -> float:
    if t <= 0 or sigma <= 0:
        return max(0.0, s - k)
    d1 = (math.log(s / k) + (r - q + 0.5 * sigma**2) * t) / (sigma * math.sqrt(t))
    d2 = d1 - sigma * math.sqrt(t)
    nd1 = 0.5 * (1.0 + math.erf(d1 / math.sqrt(2.0)))
    nd2 = 0.5 * (1.0 + math.erf(d2 / math.sqrt(2.0)))
    return s * math.exp(-q * t) * nd1 - k * math.exp(-r * t) * nd2

def bsm_delta(s: float, k: float, t: float, r: float, sigma: float, q: float = 0.0) -> float:
    d1 = (math.log(s / k) + (r - q + 0.5 * sigma**2) * t) / (sigma * math.sqrt(t))
    return math.exp(-q * t) * 0.5 * (1.0 + math.erf(d1 / math.sqrt(2.0)))

def bsm_gamma(s: float, k: float, t: float, r: float, sigma: float, q: float = 0.0) -> float:
    d1 = (math.log(s / k) + (r - q + 0.5 * sigma**2) * t) / (sigma * math.sqrt(t))
    phi_d1 = math.exp(-0.5 * d1**2) / math.sqrt(2.0 * math.pi)
    return (math.exp(-q * t) * phi_d1) / (s * sigma * math.sqrt(t))
