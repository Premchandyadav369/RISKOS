"""
RISKOS Purged and Embargoed Cross-Validation Engine (CPCV)
==========================================================
Implements rigorous financial machine learning cross-validation based on
Marcos López de Prado (2018), "Advances in Financial Machine Learning":

1. PurgedKFold:
   - Purges training samples whose label evaluation window overlaps with the test set.
   - Applies an embargo window immediately following the test set to eliminate
     autoregressive memory and volatility clustering leakage.

2. CombinatorialPurgedCV (CPCV):
   - Given N time splits, selects k splits for testing (N-choose-k combinations).
   - Evaluates multiple combinatorial out-of-sample backtest paths.
   - Computes empirical distribution of out-of-sample performance metrics
     (Sharpe, Sortino, Max Drawdown) to detect backtest overfitting.
"""

import itertools
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Tuple, Generator, Optional, Union


def get_train_times(
    samples_info: pd.Series,
    test_times: pd.Series,
    embargo_pct: float = 0.01
) -> pd.Series:
    """
    Purge training observations whose label spans overlap with test evaluation intervals,
    and apply an embargo window to training observations immediately following test intervals.

    Parameters:
    -----------
    samples_info : pd.Series
        Index: event start time t0. Values: event label end time t1 (prediction horizon).
    test_times : pd.Series
        Index: test set event start times. Values: test set label end times.
    embargo_pct : float
        Fraction of total time series to embargo after each test interval.

    Returns:
    --------
    train_times : pd.Series
        Filtered series of training observation start times and end times.
    """
    train = samples_info.copy(deep=True)
    if train.empty or test_times.empty:
        return train

    # Calculate embargo step duration
    total_duration = samples_info.index[-1] - samples_info.index[0]
    if isinstance(total_duration, pd.Timedelta):
        embargo_dt = pd.Timedelta(days=max(1, int(total_duration.days * embargo_pct)))
    else:
        embargo_dt = max(1, int(len(samples_info) * embargo_pct))

    for test_start, test_end in test_times.items():
        # 1. Purge: overlap occurs if:
        # (train_start <= test_end) and (train_end >= test_start)
        overlap = train[(train.index <= test_end) & (train >= test_start)].index
        train = train.drop(overlap, errors='ignore')

        # 2. Embargo: drop train samples starting within [test_end, test_end + embargo_dt]
        embargo_end = test_end + embargo_dt
        embargoed = train[(train.index > test_end) & (train.index <= embargo_end)].index
        train = train.drop(embargoed, errors='ignore')

    return train


class PurgedKFold:
    """
    Purged and Embargoed K-Fold Cross-Validation for Financial Time Series.

    Attributes:
    -----------
    n_splits : int
        Number of non-overlapping time partitions (K).
    samples_info : pd.Series
        Series where index is observation start time (t0) and value is label end time (t1).
    embargo_pct : float
        Percentage of total sample span to embargo after test fold.
    """
    def __init__(
        self,
        n_splits: int = 5,
        samples_info: Optional[pd.Series] = None,
        embargo_pct: float = 0.01
    ):
        if n_splits < 2:
            raise ValueError(f"n_splits must be >= 2, got {n_splits}")
        self.n_splits = n_splits
        self.samples_info = samples_info
        self.embargo_pct = max(0.0, float(embargo_pct))

    def split(
        self,
        X: Union[pd.DataFrame, pd.Series, np.ndarray],
        y: Optional[Union[pd.DataFrame, pd.Series, np.ndarray]] = None,
        groups: Optional[Any] = None
    ) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        """
        Generates train and test index splits with purging and embargoing.
        """
        n_samples = len(X)
        indices = np.arange(n_samples)

        # Fallback if samples_info not provided: assume 1-step labels with integer index
        if self.samples_info is None:
            if isinstance(X, (pd.DataFrame, pd.Series)):
                samples_info = pd.Series(X.index, index=X.index)
            else:
                samples_info = pd.Series(indices, index=indices)
        else:
            samples_info = self.samples_info

        # Partition indices into K equal contiguous blocks
        fold_bounds = [(int(fold[0]), int(fold[-1])) for fold in np.array_split(indices, self.n_splits) if len(fold) > 0]

        for test_start_idx, test_end_idx in fold_bounds:
            test_indices = indices[test_start_idx:test_end_idx + 1]
            test_times = samples_info.iloc[test_indices]

            # Determine purged train times
            train_times = get_train_times(samples_info, test_times, embargo_pct=self.embargo_pct)
            train_indices = np.where(samples_info.index.isin(train_times.index))[0]

            yield train_indices, test_indices


class CombinatorialPurgedCV:
    """
    Combinatorial Purged Cross-Validation (CPCV).
    Divides dataset into N groups and tests on k groups at a time.
    Generates N_comb = C(N, k) distinct backtest paths and evaluates out-of-sample
    distribution of metrics.
    """
    def __init__(
        self,
        n_splits: int = 6,
        n_test_splits: int = 2,
        samples_info: Optional[pd.Series] = None,
        embargo_pct: float = 0.01
    ):
        if n_splits <= n_test_splits:
            raise ValueError(f"n_splits ({n_splits}) must be > n_test_splits ({n_test_splits})")
        self.n_splits = n_splits
        self.n_test_splits = n_test_splits
        self.samples_info = samples_info
        self.embargo_pct = max(0.0, float(embargo_pct))

    def split(
        self,
        X: Union[pd.DataFrame, pd.Series, np.ndarray],
        y: Optional[Union[pd.DataFrame, pd.Series, np.ndarray]] = None
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Generates combinatorial splits with purged train indices and test indices.
        """
        n_samples = len(X)
        indices = np.arange(n_samples)

        if self.samples_info is None:
            if isinstance(X, (pd.DataFrame, pd.Series)):
                samples_info = pd.Series(X.index, index=X.index)
            else:
                samples_info = pd.Series(indices, index=indices)
        else:
            samples_info = self.samples_info

        # Partition into N contiguous groups
        group_chunks = np.array_split(indices, self.n_splits)
        group_indices = {i: chunk for i, chunk in enumerate(group_chunks)}

        # Combinations of test groups C(N, k)
        all_combinations = list(itertools.combinations(range(self.n_splits), self.n_test_splits))

        for comb_idx, test_group_ids in enumerate(all_combinations):
            test_indices_list = [group_indices[gid] for gid in test_group_ids if len(group_indices[gid]) > 0]
            if not test_indices_list:
                continue
            test_indices = np.concatenate(test_indices_list)
            test_indices = np.sort(test_indices)
            test_times = samples_info.iloc[test_indices]

            # Purge & embargo training data
            train_times = get_train_times(samples_info, test_times, embargo_pct=self.embargo_pct)
            train_indices = np.where(samples_info.index.isin(train_times.index))[0]

            yield {
                "combination_id": comb_idx,
                "test_groups": list(test_group_ids),
                "train_indices": train_indices,
                "test_indices": test_indices,
                "train_samples": len(train_indices),
                "test_samples": len(test_indices),
                "purged_samples": n_samples - len(train_indices) - len(test_indices)
            }

    def evaluate_cpcv_distribution(
        self,
        returns: Union[pd.Series, pd.DataFrame],
        strategy_evaluator: Any,
        samples_info: Optional[pd.Series] = None
    ) -> Dict[str, Any]:
        """
        Executes CPCV evaluation over all combinatorial paths and computes the empirical
        distribution of performance metrics.

        Parameters:
        -----------
        returns : pd.Series or pd.DataFrame
            Asset or strategy returns.
        strategy_evaluator : callable
            Function taking (train_data, test_data) -> Dict containing 'sharpe', 'total_return', 'max_drawdown'.
        """
        self.samples_info = samples_info or self.samples_info
        all_splits = list(self.split(returns))
        path_results = []

        for split_info in all_splits:
            train_idx = split_info["train_indices"]
            test_idx = split_info["test_indices"]

            if len(train_idx) < 10 or len(test_idx) < 5:
                continue

            train_data = returns.iloc[train_idx] if hasattr(returns, 'iloc') else returns[train_idx]
            test_data = returns.iloc[test_idx] if hasattr(returns, 'iloc') else returns[test_idx]

            try:
                metrics = strategy_evaluator(train_data, test_data)
                path_results.append({
                    "combination_id": split_info["combination_id"],
                    "test_groups": split_info["test_groups"],
                    "sharpe": float(metrics.get("sharpe", 0.0)),
                    "total_return": float(metrics.get("total_return", 0.0)),
                    "max_drawdown": float(metrics.get("max_drawdown", 0.0)),
                    "train_size": len(train_idx),
                    "test_size": len(test_idx)
                })
            except Exception as ex:
                path_results.append({
                    "combination_id": split_info["combination_id"],
                    "error": str(ex)
                })

        valid_sharpes = [r["sharpe"] for r in path_results if "sharpe" in r and not np.isnan(r["sharpe"])]
        valid_returns = [r["total_return"] for r in path_results if "total_return" in r and not np.isnan(r["total_return"])]
        valid_dds = [r["max_drawdown"] for r in path_results if "max_drawdown" in r and not np.isnan(r["max_drawdown"])]

        summary = {
            "n_combinations": len(all_splits),
            "evaluated_paths": len(valid_sharpes),
            "sharpe_distribution": {
                "mean": round(float(np.mean(valid_sharpes)), 4) if valid_sharpes else 0.0,
                "median": round(float(np.median(valid_sharpes)), 4) if valid_sharpes else 0.0,
                "std": round(float(np.std(valid_sharpes)), 4) if valid_sharpes else 0.0,
                "p05": round(float(np.percentile(valid_sharpes, 5)), 4) if valid_sharpes else 0.0,
                "p95": round(float(np.percentile(valid_sharpes, 95)), 4) if valid_sharpes else 0.0,
                "prob_overfitting": round(float(np.mean([s <= 0 for s in valid_sharpes])), 4) if valid_sharpes else 1.0
            },
            "drawdown_distribution": {
                "mean": round(float(np.mean(valid_dds)), 4) if valid_dds else 0.0,
                "worst": round(float(np.min(valid_dds)), 4) if valid_dds else 0.0
            },
            "paths": path_results,
            "provenance": {
                "method": "CombinatorialPurgedCV",
                "n_splits": self.n_splits,
                "n_test_splits": self.n_test_splits,
                "embargo_pct": self.embargo_pct,
                "reference": "Marcos López de Prado (2018), Advances in Financial Machine Learning, Ch. 7 & 12"
            }
        }
        return summary