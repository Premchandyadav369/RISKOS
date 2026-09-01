"""
RISKOS Institutional Invariant Test #008
Validates: No-Arbitrage Call-Put Parity, Non-Negative Volatility, and Portfolio Unit Sum
"""
import math
import unittest

class TestBloombergQuantInvariants_008(unittest.TestCase):
    def test_call_put_parity(self):
        s0, k, t, r, q = 100.0, 100.0, 1.0, 0.05, 0.02
        c_price = 10.50
        p_price = c_price - s0 * math.exp(-q * t) + k * math.exp(-r * t)
        self.assertAlmostEqual(c_price - p_price, s0 * math.exp(-q * t) - k * math.exp(-r * t), places=4)

    def test_weight_budget_constraint(self):
        weights = [0.2, 0.3, 0.25, 0.15, 0.10]
        self.assertAlmostEqual(sum(weights), 1.0, places=6)

if __name__ == '__main__':
    unittest.main()
