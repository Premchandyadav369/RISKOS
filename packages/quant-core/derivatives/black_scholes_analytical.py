import math
import numpy as np

def normal_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))

def normal_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)

class BlackScholesPricer:
    @staticmethod
    def price_and_greeks(s: float, k: float, t: float, r: float, sigma: float, q: float = 0.0):
        t = max(t, 1e-6)
        sigma = max(sigma, 1e-6)
        d1 = (math.log(s / k) + (r - q + 0.5 * sigma * sigma) * t) / (sigma * math.sqrt(t))
        d2 = d1 - sigma * math.sqrt(t)

        nd1, nd2 = normal_cdf(d1), normal_cdf(d2)
        n_neg_d1, n_neg_d2 = normal_cdf(-d1), normal_cdf(-d2)
        pdf_d1 = normal_pdf(d1)

        disc_r = math.exp(-r * t)
        disc_q = math.exp(-q * t)

        call_p = s * disc_q * nd1 - k * disc_r * nd2
        put_p = k * disc_r * n_neg_d2 - s * disc_q * n_neg_d1

        delta_call = disc_q * nd1
        delta_put = -disc_q * n_neg_d1
        gamma = (disc_q * pdf_d1) / (s * sigma * math.sqrt(t))
        vega = s * disc_q * pdf_d1 * math.sqrt(t)
        theta_call = (- (s * disc_q * pdf_d1 * sigma) / (2 * math.sqrt(t)) - r * k * disc_r * nd2 + q * s * disc_q * nd1)
        theta_put = (- (s * disc_q * pdf_d1 * sigma) / (2 * math.sqrt(t)) + r * k * disc_r * n_neg_d2 - q * s * disc_q * n_neg_d1)
        rho_call = k * t * disc_r * nd2
        rho_put = -k * t * disc_r * n_neg_d2

        return {
            "call_price": call_p,
            "put_price": put_p,
            "delta_call": delta_call,
            "delta_put": delta_put,
            "gamma": gamma,
            "vega": vega / 100.0,
            "theta_call": theta_call / 365.0,
            "theta_put": theta_put / 365.0,
            "rho_call": rho_call / 100.0,
            "rho_put": rho_put / 100.0,
            "vanna": -disc_q * pdf_d1 * d2 / sigma,
            "volga": vega * d1 * d2 / sigma
        }
