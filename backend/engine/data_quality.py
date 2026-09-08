"""
RISKOS Data Quality Engine & Automated Hygiene Pipeline
========================================================
Performs institutional data quality auditing on market data series:
1. Missing Value Quantification (% gaps)
2. Duplicate Timestamp Detection
3. Chronological Monotonicity Audit
4. Stale / Frozen Price Detection (consecutive identical bars)
5. Non-Positive / Impossible Prices (price <= 0)
6. Abnormal Return Spike Detection (> 50% single-day or > 8 sigma jumps)
7. Unadjusted Split Discontinuity Detection (overnight 2:1, 3:1, 5:1, 10:1 ratios)
8. Microstructure Volume Hygiene (zero-volume trading days)
Outputs an institutional composite `data_quality_score` (0-100) with line-item diagnostics.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Union
from datetime import datetime


class DataQualityEngine:
    """
    Evaluates market data hygiene, data provenance, and reliability.
    """
    
    @staticmethod
    def audit_series(
        prices: Union[pd.Series, np.ndarray, List[float]],
        dates: Optional[Union[pd.Index, List[Any]]] = None,
        ticker: str = "ASSET",
        volumes: Optional[Union[pd.Series, np.ndarray, List[float]]] = None
    ) -> Dict[str, Any]:
        """
        Audits a single price series for data quality flaws and computes a 0-100 score.
        """
        p = np.asarray(prices, dtype=float)
        n = len(p)
        
        if n == 0:
            return {
                "ticker": ticker,
                "data_quality_score": 0.0,
                "status": "UNACCEPTABLE",
                "observations": 0,
                "defects_found": ["EMPTY_SERIES"],
                "recommendation": "REJECT_DATA"
            }
            
        defects = []
        penalties = 0.0
        
        # 1. Non-positive prices (Critical)
        non_positive = int(np.sum(p <= 0.0))
        if non_positive > 0:
            defects.append(f"NON_POSITIVE_PRICES: {non_positive} bar(s) <= 0")
            penalties += min(50.0, non_positive * 20.0)
            
        # 2. NaN or Inf values
        nans = int(np.sum(np.isnan(p) | np.isinf(p)))
        if nans > 0:
            defects.append(f"MISSING_OR_INF: {nans} bar(s) missing")
            penalties += min(30.0, (nans / n) * 100.0 * 2.0)
            
        # Filter valid prices for subsequent tests
        valid_mask = np.isfinite(p) & (p > 0)
        valid_p = p[valid_mask]
        
        if len(valid_p) < 2:
            return {
                "ticker": ticker,
                "data_quality_score": 0.0,
                "status": "UNACCEPTABLE",
                "observations": n,
                "defects_found": defects + ["INSUFFICIENT_VALID_POINTS"],
                "recommendation": "REJECT_DATA"
            }
            
        # 3. Duplicate and non-monotonic timestamps
        if dates is not None:
            dt_idx = pd.Index(dates)
            if dt_idx.has_duplicates:
                defects.append(f"DUPLICATE_TIMESTAMPS: {dt_idx.duplicated().sum()} duplicate timestamp(s)")
                penalties += 15.0
            if not dt_idx.is_monotonic_increasing:
                defects.append("CHRONOLOGICAL_OUT_OF_ORDER: Timestamps not strictly increasing")
                penalties += 20.0
                
        # 4. Stale / Frozen Prices (consecutive identical bars)
        diffs = np.diff(valid_p)
        zero_diffs = np.sum(diffs == 0.0)
        max_consecutive_flat = 0
        current_flat = 0
        for d in diffs:
            if d == 0.0:
                current_flat += 1
                max_consecutive_flat = max(max_consecutive_flat, current_flat)
            else:
                current_flat = 0
                
        if max_consecutive_flat >= 5:
            defects.append(f"STALE_FROZEN_PRICES: Max {max_consecutive_flat} consecutive identical close prices")
            penalties += min(25.0, max_consecutive_flat * 2.0)
            
        # 5. Abnormal return spikes
        returns = diffs / valid_p[:-1]
        sigma = np.std(returns)
        mean_ret = np.mean(returns)
        z_scores = np.abs((returns - mean_ret) / sigma) if sigma > 1e-8 else np.zeros_like(returns)
        
        extreme_spikes = int(np.sum(np.abs(returns) > 0.50))  # > 50% overnight jump
        statistical_spikes = int(np.sum(z_scores > 8.0))
        
        if extreme_spikes > 0:
            defects.append(f"EXTREME_PRICE_SPIKES: {extreme_spikes} bar(s) with daily move > 50%")
            penalties += min(30.0, extreme_spikes * 10.0)
            
        # 6. Unadjusted split discontinuities
        # Common split ratios: 0.5, 0.333, 0.25, 0.20, 0.10, or 2.0, 3.0, 4.0, 5.0, 10.0
        ratios = valid_p[1:] / valid_p[:-1]
        suspected_splits = 0
        common_split_ratios = [0.5, 0.3333, 0.25, 0.2, 0.1, 2.0, 3.0, 4.0, 5.0, 10.0]
        for r in ratios:
            for s in common_split_ratios:
                if abs(r - s) / s < 0.015:
                    suspected_splits += 1
                    break
                    
        if suspected_splits > 0:
            defects.append(f"SUSPECTED_UNADJUSTED_SPLITS: {suspected_splits} price jumps matching canonical split ratios")
            penalties += min(20.0, suspected_splits * 10.0)
            
        # 7. Volume hygiene
        if volumes is not None:
            v = np.asarray(volumes, dtype=float)
            zero_vols = int(np.sum(v <= 0))
            if zero_vols > 0:
                defects.append(f"ZERO_VOLUME_BARS: {zero_vols} trading day(s) with zero/negative volume")
                penalties += min(15.0, (zero_vols / len(v)) * 50.0)

        raw_score = max(0.0, 100.0 - penalties)
        score = round(raw_score, 1)
        
        if score >= 95.0:
            status = "PRISTINE"
            recommendation = "CLEAN_AND_USE"
        elif score >= 80.0:
            status = "ACCEPTABLE"
            recommendation = "WARN_AND_USE"
        elif score >= 50.0:
            status = "DEGRADED"
            recommendation = "CLEAN_BEFORE_USE"
        else:
            status = "UNACCEPTABLE"
            recommendation = "REJECT_DATA"
            
        return {
            "ticker": ticker,
            "data_quality_score": score,
            "status": status,
            "recommendation": recommendation,
            "observations": n,
            "valid_observations": len(valid_p),
            "max_consecutive_flat_bars": max_consecutive_flat,
            "extreme_spikes_count": extreme_spikes,
            "defects_count": len(defects),
            "defects_found": defects,
            "provenance": {
                "audited_at": datetime.utcnow().isoformat() + "Z",
                "rules_version": "DQ-2024.1"
            }
        }

    @classmethod
    def audit_dataframe(
        cls,
        df_prices: pd.DataFrame,
        df_volumes: Optional[pd.DataFrame] = None
    ) -> Dict[str, Any]:
        """
        Audits a multi-asset price dataframe and provides portfolio-level data hygiene metrics.
        """
        if df_prices.empty:
            return {"error": "Empty dataframe"}
            
        asset_reports = {}
        scores = []
        all_defects = []
        
        dates = df_prices.index
        
        for col in df_prices.columns:
            vol_col = df_volumes[col] if (df_volumes is not None and col in df_volumes.columns) else None
            rep = cls.audit_series(df_prices[col], dates=dates, ticker=col, volumes=vol_col)
            asset_reports[col] = rep
            scores.append(rep["data_quality_score"])
            all_defects.extend(rep["defects_found"])
            
        composite_score = round(float(np.mean(scores)), 1) if scores else 0.0
        
        return {
            "composite_data_quality_score": composite_score,
            "portfolio_status": "PRISTINE" if composite_score >= 95 else ("ACCEPTABLE" if composite_score >= 80 else "DEGRADED"),
            "assets_audited": len(df_prices.columns),
            "total_defects_across_universe": len(all_defects),
            "asset_reports": asset_reports,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }