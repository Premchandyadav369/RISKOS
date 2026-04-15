import numpy as np

def calculate_ngfs_climate_stress(
    portfolio_equity=10_000_000,
    corporate_debt=15_000_000,
    active_scenario="Disorderly" # Options: "Orderly", "Disorderly", "HotHouse"
):
    """
    Network for Greening the Financial System (NGFS) Climate Stress Testing Engine.
    Models Transition Risk (Carbon Tax) & Physical Risk (Damage/Floods) across corporate portfolios.
    """
    scenarios_data = {
        "Orderly": {
            "name": "Orderly Net Zero 2050",
            "carbon_price_per_ton": 140, # USD / tCO2e
            "global_warming_deg_c": 1.5,
            "transition_loss_pct": -4.2,
            "physical_damage_loss_pct": -1.8,
            "pd_multiplier": 1.15,
            "description": "Immediate, smooth carbon tax trajectory with moderate transition friction and low physical catastrophe."
        },
        "Disorderly": {
            "name": "Disorderly Delayed Transition",
            "carbon_price_per_ton": 280,
            "global_warming_deg_c": 1.8,
            "transition_loss_pct": -12.6,
            "physical_damage_loss_pct": -3.4,
            "pd_multiplier": 1.55,
            "description": "Late, sudden, and abrupt policy tightening causing high stranding of fossil/industrial capital assets."
        },
        "HotHouse": {
            "name": "Hot House World (Current Policies)",
            "carbon_price_per_ton": 25,
            "global_warming_deg_c": 3.4,
            "transition_loss_pct": -1.2,
            "physical_damage_loss_pct": -18.5,
            "pd_multiplier": 2.10,
            "description": "Minimal carbon taxation leading to runaway global heating, acute flood/cyclone damage, and severe collateral impairment."
        }
    }
    
    scen = scenarios_data.get(active_scenario, scenarios_data["Disorderly"])
    
    total_portfolio = portfolio_equity + corporate_debt
    equity_loss = portfolio_equity * (scen["transition_loss_pct"] / 100.0)
    debt_loss = corporate_debt * (scen["physical_damage_loss_pct"] / 100.0 * 0.6)
    total_climate_impairment = abs(equity_loss) + abs(debt_loss)
    
    # High-emitting sector breakdown
    sector_exposures = [
        {"sector": "Energy & Oil/Gas", "carbon_intensity_tco2e_m": 420.0, "impairment_pct": scen["transition_loss_pct"] * 1.8},
        {"sector": "Utilities & Power", "carbon_intensity_tco2e_m": 310.0, "impairment_pct": scen["transition_loss_pct"] * 1.4},
        {"sector": "Heavy Materials & Cement", "carbon_intensity_tco2e_m": 260.0, "impairment_pct": scen["transition_loss_pct"] * 1.2},
        {"sector": "Technology & Services", "carbon_intensity_tco2e_m": 28.0, "impairment_pct": scen["transition_loss_pct"] * 0.3},
        {"sector": "Financial Institutions", "carbon_intensity_tco2e_m": 45.0, "impairment_pct": scen["transition_loss_pct"] * 0.6}
    ]
    
    return {
        "status": "COMPUTED",
        "scenario": scen,
        "portfolio_impact": {
            "total_climate_impairment_dollar": round(total_climate_impairment, 2),
            "portfolio_loss_pct": round((total_climate_impairment / total_portfolio) * 100.0, 2),
            "stressed_pd_multiplier": scen["pd_multiplier"],
            "weighted_average_carbon_intensity_waci": 164.5 # tCO2e / $M Revenue
        },
        "sector_breakdown": sector_exposures
    }
