"""
RISKOS Sovereign Fixed Income: Nelson-Siegel 6-Factor Spline #107
$$y(t) = \beta_0 + \beta_1 \left(\frac{1 - e^{-t/\tau}}{t/\tau}\right) + \beta_2 \left(\frac{1 - e^{-t/\tau}}{t/\tau} - e^{-t/\tau}\right)$$
"""
import math

class NelsonSiegelCurve_107:
    def __init__(self, beta0: float = 0.071, beta1: float = -0.015, beta2: float = 0.008, tau: float = 2.5):
        self.beta0 = beta0
        self.beta1 = beta1
        self.beta2 = beta2
        self.tau = tau

    def zero_rate(self, maturity: float) -> float:
        if maturity <= 0:
            return self.beta0 + self.beta1
        x = maturity / self.tau
        factor1 = (1.0 - math.exp(-x)) / x
        factor2 = factor1 - math.exp(-x)
        return self.beta0 + self.beta1 * factor1 + self.beta2 * factor2
