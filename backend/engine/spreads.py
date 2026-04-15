import numpy as np
import pandas as pd
from scipy.stats import linregress
from .market import get_prices, get_returns

def kalman_filter_hedge_ratio(y: np.ndarray, x: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Online state-space estimation of hedge ratio beta_t and intercept alpha_t using Kalman Filter.
    Measurement equation: y_t = alpha_t + beta_t * x_t + v_t,  v_t ~ N(0, V_e)
    State equation: theta_t = theta_{t-1} + w_t,             w_t ~ N(0, V_w)
    """
    n = len(y)
    theta = np.zeros((n, 2))  # [alpha, beta]
    
    # State covariance matrix
    R = np.zeros((2, 2))
    P = np.zeros((2, 2))
    
    # Covariance priors
    V_w = 1e-4 * np.eye(2)  # State noise
    V_e = 1e-3              # Measurement noise
    
    # Initial state
    beta_curr = np.zeros(2)
    P_curr = np.eye(2) * 1.0
    
    spread = np.zeros(n)
    
    for t in range(n):
        # Measurement vector: [1, x_t]
        F = np.array([1.0, x[t]])
        
        # Predict state covariance
        P_pred = P_curr + V_w
        
        # Measurement prediction error
        y_hat = np.dot(F, beta_curr)
        error = y[t] - y_hat
        
        # Measurement prediction variance
        Q = np.dot(F, np.dot(P_pred, F)) + V_e
        
        # Kalman Gain
        K = np.dot(P_pred, F) / Q
        
        # Update state
        beta_curr = beta_curr + K * error
        P_curr = P_pred - np.outer(K, np.dot(F, P_pred))
        
        theta[t] = beta_curr
        spread[t] = y[t] - (beta_curr[0] + beta_curr[1] * x[t])
        
    return theta, spread

def fit_ornstein_uhlenbeck(spread: np.ndarray) -> dict:
    """
    Fits discrete Ornstein-Uhlenbeck process:
    S_{t+1} - S_t = theta * (mu - S_t) * dt + sigma * epsilon_t
    Regression: delta_S = a + b * S_t
    theta = -b / dt,  mu = -a / b,  half_life = ln(2) / theta
    """
    if len(spread) < 10:
        return {'half_life_days': 0.0, 'theta': 0.0, 'equilibrium_mean': 0.0, 'sigma': 0.0}
        
    s_t = spread[:-1]
    delta_s = spread[1:] - s_t
    
    slope, intercept, r_value, p_value, std_err = linregress(s_t, delta_s)
    
    dt = 1.0  # Daily data
    theta = -slope / dt
    
    if theta <= 0:
        # Not mean reverting or diverging
        half_life = 999.0
        mu = float(np.mean(spread))
    else:
        half_life = float(np.log(2) / theta)
        mu = float(-intercept / slope)
        
    residuals = delta_s - (intercept + slope * s_t)
    sigma = float(np.std(residuals) * np.sqrt(252))
    
    return {
        'half_life_days': round(min(half_life, 252.0), 2),
        'mean_reversion_speed': round(float(max(theta, 0.0)), 4),
        'equilibrium_mean': round(mu, 4),
        'annualized_spread_vol': round(sigma, 4),
        'r_squared': round(float(r_value**2), 4)
    }

def analyze_spread(ticker1: str = "CL=F", ticker2: str = "BZ=F", period: str = "1y") -> dict:
    """
    Runs full cointegration, Kalman filter dynamic hedge ratio, and OU mean-reversion analysis for pair.
    """
    prices = get_prices([ticker1, ticker2], period=period)
    
    if ticker1 not in prices or ticker2 not in prices:
        # Fallback to standard proxies if future ticker format varies
        p_df = get_prices(["XOM", "CVX"], period=period)
        ticker1, ticker2 = "XOM", "CVX"
        prices = p_df
        
    c1 = np.array(prices[ticker1]['close'])
    c2 = np.array(prices[ticker2]['close'])
    dates = prices[ticker1]['dates']
    
    min_len = min(len(c1), len(c2))
    c1, c2, dates = c1[-min_len:], c2[-min_len:], dates[-min_len:]
    
    # 1. Kalman Filter Hedge Ratio
    theta, spread = kalman_filter_hedge_ratio(c1, c2)
    alphas = theta[:, 0].tolist()
    betas = theta[:, 1].tolist()
    
    # 2. OU Parameters & Half-Life
    ou_stats = fit_ornstein_uhlenbeck(spread)
    
    # 3. Rolling Z-Score
    spread_series = pd.Series(spread)
    rolling_mean = spread_series.rolling(30, min_periods=1).mean()
    rolling_std = spread_series.rolling(30, min_periods=1).std().replace(0, 1e-4)
    z_scores = ((spread_series - rolling_mean) / rolling_std).fillna(0).tolist()
    
    current_z = z_scores[-1] if len(z_scores) > 0 else 0.0
    current_beta = betas[-1] if len(betas) > 0 else 1.0
    
    # Trading Signal
    if current_z > 2.0:
        action = f"SHORT {ticker1} / LONG {round(current_beta, 2)} {ticker2}"
        signal_state = "UPPER_BAND_BREACH"
    elif current_z < -2.0:
        action = f"LONG {ticker1} / SHORT {round(current_beta, 2)} {ticker2}"
        signal_state = "LOWER_BAND_BREACH"
    elif abs(current_z) < 0.5:
        action = "NEUTRAL / MEAN CONVERGENCE"
        signal_state = "EQUILIBRIUM"
    else:
        action = "MONITORING SPREAD"
        signal_state = "WITHIN_BANDS"
        
    return {
        'ticker1': ticker1,
        'ticker2': ticker2,
        'dates': dates,
        'spread_history': [round(float(s), 4) for s in spread],
        'z_scores': [round(float(z), 2) for z in z_scores],
        'dynamic_beta': [round(float(b), 4) for b in betas],
        'current_hedge_ratio': round(float(current_beta), 4),
        'current_z_score': round(float(current_z), 2),
        'signal': action,
        'signal_state': signal_state,
        'ou_stats': ou_stats
    }
