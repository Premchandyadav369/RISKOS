import numpy as np
from scipy.stats import norm

def black_scholes_greeks(S: float, K: float, T: float, r: float, sigma: float, option_type: str = 'call') -> dict:
    """
    Computes analytical European Option price and all 1st and 2nd order Cross-Greeks:
    Delta, Gamma, Vega, Theta, Rho, Vanna, Volga (Vomma), Charm (dDelta/dt).
    """
    T = max(T, 1e-4)
    sigma = max(sigma, 1e-4)
    S = max(S, 1e-4)
    
    d1 = (np.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    
    pdf_d1 = norm.pdf(d1)
    cdf_d1 = norm.cdf(d1)
    cdf_d2 = norm.cdf(d2)
    
    # 1. Option Price
    if option_type.lower() == 'call':
        price = S * cdf_d1 - K * np.exp(-r * T) * cdf_d2
        delta = cdf_d1
        theta = (- (S * pdf_d1 * sigma) / (2 * np.sqrt(T)) - r * K * np.exp(-r * T) * cdf_d2) / 365.0
        rho = (K * T * np.exp(-r * T) * cdf_d2) / 100.0
    else:
        price = K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
        delta = cdf_d1 - 1.0
        theta = (- (S * pdf_d1 * sigma) / (2 * np.sqrt(T)) + r * K * np.exp(-r * T) * norm.cdf(-d2)) / 365.0
        rho = (-K * T * np.exp(-r * T) * norm.cdf(-d2)) / 100.0
        
    # 2. First & Second Order Greeks
    gamma = pdf_d1 / (S * sigma * np.sqrt(T))
    vega = (S * pdf_d1 * np.sqrt(T)) / 100.0  # Per 1% vol move
    
    # Cross-Greeks (Key for Market Makers)
    # Vanna = dDelta / dVol = - pdf(d1) * d2 / sigma
    vanna = (- pdf_d1 * d2 / sigma) / 100.0
    
    # Volga (Vomma) = dVega / dVol = Vega * (d1 * d2) / sigma
    volga = (vega * d1 * d2 / sigma)
    
    # Charm = dDelta / dt (time decay of delta)
    charm = (pdf_d1 * (2 * r * T - d2 * sigma * np.sqrt(T)) / (2 * T * sigma * np.sqrt(T))) / 365.0
    
    return {
        'price': round(float(price), 2),
        'delta': round(float(delta), 4),
        'gamma': round(float(gamma), 4),
        'vega': round(float(vega), 4),
        'theta': round(float(theta), 4),
        'rho': round(float(rho), 4),
        'vanna': round(float(vanna), 4),
        'volga': round(float(volga), 4),
        'charm': round(float(charm), 4)
    }

def generate_volatility_smile(spot: float = 180.0, atm_vol: float = 0.22, expiry: float = 0.25) -> dict:
    """
    Parametric SVI/cubic volatility smile across strikes (moneyness 0.8 to 1.2).
    """
    moneyness_grid = np.linspace(0.8, 1.2, 9)
    strikes = [round(spot * m, 1) for m in moneyness_grid]
    
    # Typical equity skew: higher IV for OTM puts (downside protection)
    skew = -0.15
    smile_convexity = 0.35
    
    iv_curve = []
    for m in moneyness_grid:
        log_m = np.log(m)
        iv = atm_vol + skew * log_m + smile_convexity * (log_m ** 2)
        iv_curve.append(round(float(max(iv, 0.05) * 100), 2))
        
    return {
        'strikes': strikes,
        'moneyness': [round(float(m), 2) for m in moneyness_grid],
        'implied_vols': iv_curve
    }

def simulate_delta_hedging(
    spot: float = 180.0,
    strike: float = 180.0,
    expiry_days: int = 30,
    vol: float = 0.25,
    rate: float = 0.045,
    cost_bps: float = 5.0
) -> dict:
    """
    Simulates discrete daily dynamic delta-hedging of a short Call option.
    Tracks Gamma PnL vs Theta decay vs transaction costs across the path.
    """
    np.random.seed(101)
    dt = 1.0 / 252.0
    n_days = expiry_days
    
    # Simulate geometric Brownian motion underlying price path
    drift = rate - 0.5 * (vol ** 2)
    daily_shocks = np.random.normal(0, 1, n_days)
    
    price_path = [spot]
    for shock in daily_shocks:
        price_path.append(price_path[-1] * np.exp(drift * dt + vol * np.sqrt(dt) * shock))
        
    pnl_path = [0.0]
    hedge_ratios = []
    
    # Initial Option Premium collected
    t_rem = n_days / 252.0
    init_greeks = black_scholes_greeks(spot, strike, t_rem, rate, vol, 'call')
    option_sold_price = init_greeks['price']
    
    current_shares = init_greeks['delta']
    hedge_ratios.append(current_shares)
    cash = option_sold_price - current_shares * spot
    
    for day in range(1, n_days + 1):
        s_t = price_path[day]
        t_rem = max((n_days - day) / 252.0, 1e-4)
        
        # New target delta
        curr_greeks = black_scholes_greeks(s_t, strike, t_rem, rate, vol, 'call')
        target_delta = curr_greeks['delta']
        hedge_ratios.append(target_delta)
        
        # Rebalance delta
        delta_trade = target_delta - current_shares
        trade_cost = abs(delta_trade) * s_t * (cost_bps / 10000.0)
        
        cash = cash * np.exp(rate * dt) - delta_trade * s_t - trade_cost
        current_shares = target_delta
        
        # Current portfolio value = Cash + Stock value - Current Option liability
        opt_liability = curr_greeks['price']
        portfolio_val = cash + current_shares * s_t - opt_liability
        pnl_path.append(round(float(portfolio_val), 2))
        
    final_spot = price_path[-1]
    final_payoff = max(final_spot - strike, 0)
    final_pnl = cash + current_shares * final_spot - final_payoff
    
    return {
        'days': list(range(n_days + 1)),
        'price_path': [round(float(p), 2) for p in price_path],
        'cumulative_pnl': pnl_path,
        'delta_path': [round(float(d), 3) for d in hedge_ratios],
        'final_replication_error': round(float(final_pnl), 2),
        'total_rebalances': n_days
    }

def analyze_derivatives(spot: float = 180.0, strike: float = 185.0, expiry: float = 0.25, vol: float = 0.22, rate: float = 0.045) -> dict:
    """
    Computes full pricing, 1st/2nd order Greeks, Volatility Skew, and Delta-hedging simulation.
    """
    call_greeks = black_scholes_greeks(spot, strike, expiry, rate, vol, 'call')
    put_greeks = black_scholes_greeks(spot, strike, expiry, rate, vol, 'put')
    vol_smile = generate_volatility_smile(spot, atm_vol=vol, expiry=expiry)
    delta_hedge_sim = simulate_delta_hedging(spot=spot, strike=strike, expiry_days=30, vol=vol, rate=rate)
    
    return {
        'inputs': {'spot': spot, 'strike': strike, 'expiry_yrs': expiry, 'volatility': vol, 'risk_free_rate': rate},
        'call_greeks': call_greeks,
        'put_greeks': put_greeks,
        'volatility_smile': vol_smile,
        'delta_hedging_simulation': delta_hedge_sim
    }
