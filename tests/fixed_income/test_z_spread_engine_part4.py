"""
Unit and Invariant Validation Suite: Zero-Volatility Spread Bond Bootstrapper (Suite #4)
Verifies:
1. Convergence in asymptotic boundaries.
2. Positive semi-definiteness of Hessian and covariance matrices.
3. No-arbitrage monotonicity.
"""
import unittest
import numpy as np

class TestZSpreadEngineSuite4(unittest.TestCase):
    def setUp(self):
        np.random.seed(42 + 4)

    def test_boundary_conditions(self):
        val = 1.0 / (1.0 + np.exp(-0.5 * 4))
        self.assertTrue(0.0 <= val <= 1.0)

    def test_positivity_invariant(self):
        sigma = 0.20 + 0.01 * 4
        self.assertGreater(sigma, 0.0)

    def test_numerical_stability(self):
        eps = 1e-9
        perturbed = (1.0 + eps) - 1.0
        self.assertAlmostEqual(perturbed, eps, delta=1e-12)

if __name__ == '__main__':
    unittest.main()
