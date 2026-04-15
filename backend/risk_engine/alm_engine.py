import numpy as np

def calculate_alm_and_irrbb(
    total_deposits=500_000_000,
    hqla=85_000_000,
    deposit_outflow_pct=15.0,
    rate_shock_bps=200
):
    """
    Asset Liability Management (ALM) & Interest Rate Risk in the Banking Book (IRRBB).
    Computes LCR, NSFR runway, and delta EVE / delta NII under regulatory rate shocks.
    """
    # 1. Basel III Liquidity Coverage Ratio (LCR)
    total_outflows_30d = total_deposits * (deposit_outflow_pct / 100.0) * 0.75 # 75% run-off under stress
    stressed_lcr = (hqla / (total_outflows_30d + 1e-6)) * 100.0
    
    # 2. Net Stable Funding Ratio (NSFR)
    available_stable_funding = total_deposits * 0.85 + 50_000_000 # Equity/long-term debt
    required_stable_funding = (500_000_000 - hqla) * 0.70 + hqla * 0.05
    nsfr = (available_stable_funding / required_stable_funding) * 100.0
    
    # 3. Liquidity Runway (Days until HQLA depletion under continuous run)
    daily_burn_rate = (total_outflows_30d / 30.0)
    liquidity_runway_days = int(hqla / (daily_burn_rate + 1e-6))
    
    # 4. IRRBB: Delta EVE (Economic Value of Equity) & Delta NII (Net Interest Income)
    # Basel regulatory +/- 200 bps parallel shift
    duration_gap = 2.4 # Asset duration (4.2 yrs) - Liability duration (1.8 yrs)
    total_assets = 550_000_000
    delta_rate = rate_shock_bps / 10_000.0 # e.g. +2.00%
    
    delta_eve_pct = -duration_gap * delta_rate * 100.0 # Standard modified duration approximation
    delta_eve_amount = total_assets * (delta_eve_pct / 100.0)
    
    # Delta NII (12-month repricing cash flow gap)
    repricing_gap_12m = 65_000_000 # Rate sensitive assets - Rate sensitive liabilities
    delta_nii_amount = repricing_gap_12m * delta_rate
    delta_nii_pct = (delta_nii_amount / 25_000_000) * 100.0 # Base annual NII
    
    return {
        "status": "COMPUTED",
        "liquidity_metrics": {
            "hqla_amount": hqla,
            "stressed_lcr_pct": round(stressed_lcr, 2),
            "lcr_regulatory_minimum_pct": 100.0,
            "lcr_status": "COMPLIANT" if stressed_lcr >= 100.0 else "DEFICIT_WARNING",
            "nsfr_pct": round(nsfr, 2),
            "nsfr_regulatory_minimum_pct": 100.0,
            "liquidity_runway_days": max(1, liquidity_runway_days)
        },
        "irrbb_metrics": {
            "rate_shock_bps": rate_shock_bps,
            "duration_gap_years": duration_gap,
            "delta_eve_amount": round(delta_eve_amount, 2),
            "delta_eve_pct": round(delta_eve_pct, 2),
            "delta_nii_amount": round(delta_nii_amount, 2),
            "delta_nii_pct": round(delta_nii_pct, 2),
            "regulatory_outlier_threshold_pct": -15.0, # Basel EVE limit
            "irrbb_status": "NORMAL" if delta_eve_pct > -15.0 else "OUTLIER_BREACH"
        }
    }
