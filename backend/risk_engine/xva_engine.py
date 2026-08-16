import numpy as np

def calculate_xva_and_sacr(
    notional=50_000_000,
    maturity_years=5.0,
    counterparty_spread_bps=140.0,
    own_credit_spread_bps=80.0,
    funding_spread_bps=45.0,
    recovery_rate=0.40
):
    """
    Computes CVA (Credit Valuation Adjustment), DVA (Debit Valuation Adjustment),
    FVA (Funding Valuation Adjustment), Expected Exposure (EE), PFE (99% Potential Future Exposure),
    and Basel SA-CCR (Standardised Approach for Counterparty Credit Risk).
    """
    lgd = 1.0 - recovery_rate # Loss Given Default (0.60)
    time_grid = np.linspace(0.5, maturity_years, int(maturity_years * 2))
    
    # Simulate Expected Positive Exposure (EPE) and Expected Negative Exposure (ENE) profiles
    # Diffusion peak at t ~ maturity / 2
    epe_profile = []
    ene_profile = []
    pfe_profile = []
    
    for t in time_grid:
        diffusion = np.sqrt(t) * notional * 0.04
        epe = diffusion * 0.65
        ene = diffusion * 0.45
        pfe = diffusion * 2.326 # 99% quantile
        epe_profile.append({"tenor_years": round(t, 1), "epe": round(epe, 2)})
        ene_profile.append({"tenor_years": round(t, 1), "ene": round(ene, 2)})
        pfe_profile.append({"tenor_years": round(t, 1), "pfe_99": round(pfe, 2)})
    
    avg_epe = np.mean([p["epe"] for p in epe_profile])
    avg_ene = np.mean([p["ene"] for p in ene_profile])
    
    # 1. Unilateral CVA Calculation: LGD * sum(PD_i * Discount_i * EE_i)
    hazard_rate_cpty = (counterparty_spread_bps / 10_000.0) / lgd
    cva_amount = lgd * hazard_rate_cpty * avg_epe * maturity_years
    
    # 2. DVA Calculation: LGD_own * hazard_rate_own * ENE * T
    hazard_rate_own = (own_credit_spread_bps / 10_000.0) / 0.60
    dva_amount = 0.60 * hazard_rate_own * avg_ene * maturity_years
    
    # 3. FVA (Funding Valuation Adjustment) = Funding Spread * (EPE - ENE) * T
    fva_amount = (funding_spread_bps / 10_000.0) * (avg_epe - avg_ene) * maturity_years
    
    # 4. Total Bilateral Valuation Adjustment (BVA)
    total_xva = cva_amount - dva_amount + fva_amount
    
    # 5. Basel SA-CCR (EAD = alpha * (RC + PFE))
    replacement_cost = 450_000.0 # Positive MTM
    peak_pfe = max([p["pfe_99"] for p in pfe_profile])
    multiplier = 1.0 # Uncollateralized baseline
    add_on = peak_pfe * 0.55 # Supervisory factor adjusted
    ead_sacr = 1.4 * (replacement_cost + multiplier * add_on)
    
    return {
        "status": "COMPUTED",
        "xva_summary": {
            "cva_amount": round(cva_amount, 2),
            "dva_amount": round(dva_amount, 2),
            "fva_amount": round(fva_amount, 2),
            "total_xva_net_charge": round(total_xva, 2),
            "clean_swap_mtm": round(replacement_cost, 2),
            "xva_adjusted_mtm": round(replacement_cost - total_xva, 2)
        },
        "sa_ccr_metrics": {
            "ead_sacr_amount": round(ead_sacr, 2),
            "peak_pfe_99": round(peak_pfe, 2),
            "alpha_multiplier": 1.4,
            "capital_charge_rwa": round(ead_sacr * 0.08 * 12.5, 2)
        },
        "profiles": {
            "epe_profile": epe_profile,
            "pfe_profile": pfe_profile
        }
    }
