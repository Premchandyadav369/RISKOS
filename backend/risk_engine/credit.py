from typing import Dict, Any, List

COUNTERPARTIES_DATA = [
    {
        "id": "CP-001",
        "name": "Acme Capital Global",
        "jurisdiction": "US",
        "rating": "A+",
        "pd_pct": 1.45,
        "lgd_pct": 45.0,
        "ead": 25_000_000,
        "sector": "Investment Banking"
    },
    {
        "id": "CP-002",
        "name": "Pacific Tech Holdings",
        "jurisdiction": "US",
        "rating": "BBB",
        "pd_pct": 3.80,
        "lgd_pct": 55.0,
        "ead": 18_500_000,
        "sector": "Technology Enterprise"
    },
    {
        "id": "CP-003",
        "name": "Bharat Infrastructure Ltd",
        "jurisdiction": "India",
        "rating": "BBB+",
        "pd_pct": 2.60,
        "lgd_pct": 50.0,
        "ead": 22_000_000,
        "sector": "Infrastructure & Energy"
    },
    {
        "id": "CP-004",
        "name": "Vanguard Auto Components",
        "jurisdiction": "India",
        "rating": "BB",
        "pd_pct": 6.75,
        "lgd_pct": 60.0,
        "ead": 12_000_000,
        "sector": "Automotive"
    },
    {
        "id": "CP-005",
        "name": "Apex Sovereign Wealth Fund",
        "jurisdiction": "US",
        "rating": "AA",
        "pd_pct": 0.40,
        "lgd_pct": 35.0,
        "ead": 40_000_000,
        "sector": "Sovereign/Institutional"
    }
]

def calculate_credit_risk() -> Dict[str, Any]:
    """
    Computes Credit Risk metrics, Expected Loss (EL), Exposure at Default (EAD), and rating breakdown.
    """
    counterparties = []
    total_ead = 0.0
    total_el = 0.0
    
    for item in COUNTERPARTIES_DATA:
        pd_val = item["pd_pct"] / 100.0
        lgd_val = item["lgd_pct"] / 100.0
        ead_val = item["ead"]
        el_val = pd_val * lgd_val * ead_val
        
        total_ead += ead_val
        total_el += el_val
        
        counterparties.append({
            "id": item["id"],
            "name": item["name"],
            "jurisdiction": item["jurisdiction"],
            "rating": item["rating"],
            "pd_pct": item["pd_pct"],
            "lgd_pct": item["lgd_pct"],
            "ead": ead_val,
            "expected_loss": round(el_val, 2),
            "status": "WATCHLIST" if item["pd_pct"] > 5.0 else ("ELEVATED" if item["pd_pct"] > 2.5 else "STABLE")
        })
        
    avg_pd = sum(c["pd_pct"] for c in counterparties) / len(counterparties)
    weighted_pd = sum(c["pd_pct"] * c["ead"] for c in counterparties) / max(total_ead, 1)
    
    return {
        "total_exposure_ead": round(total_ead, 2),
        "total_expected_loss": round(total_el, 2),
        "weighted_avg_pd_pct": round(weighted_pd, 2),
        "unweighted_avg_pd_pct": round(avg_pd, 2),
        "credit_risk_score": round(min(100.0, (total_el / total_ead) * 1000 + 35), 1),
        "counterparties": counterparties
    }
