"""
RISKOS Typed Pydantic API Schemas
=================================
Defines strict request and response contracts for all quantitative endpoints.
Ensures boundary validation, data integrity, and OpenAPI documentation clarity.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# --- Market & Volatility Schemas ---

class QuoteResponse(BaseModel):
    symbol: str
    price: float
    change: float
    change_pct: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[float] = None
    provenance: Optional[str] = "LIVE_OR_SYNTHETIC"
    timestamp: Optional[str] = None


class VolatilityMetrics(BaseModel):
    omega: float
    alpha: float
    beta: float
    annualized_vol: float
    current_vol: float
    conditional_vol: List[float] = []


class RegimeResponse(BaseModel):
    current_state: str
    state_probabilities: List[float]
    transition_matrix: List[List[float]]
    state_means: List[float]
    state_vols: List[float]
    state_history: List[int] = []


# --- Risk & Valuation Schemas ---

class VaRResponse(BaseModel):
    portfolio_return_mean: float
    portfolio_return_std: float
    historical_var: float
    parametric_var: float
    monte_carlo_var: float
    historical_cvar: float
    parametric_cvar: float
    monte_carlo_cvar: float
    confidence_level: float = 0.99
    simulated_returns: Optional[List[float]] = None


class OptimizationRequest(BaseModel):
    tickers: List[str] = Field(default=["AAPL", "MSFT", "GOOGL", "AMZN", "JPM"])
    target_return: float = Field(default=0.10, ge=-1.0, le=5.0)
    max_weight: float = Field(default=0.40, ge=0.01, le=1.0)
    method: str = Field(default="cvar", description="cvar | max_sharpe | min_variance")


class OptimizationResponse(BaseModel):
    optimal_weights: Dict[str, float]
    expected_return: float
    portfolio_risk: float
    method: str
    status: str = "OPTIMAL"


# --- Backtesting Schemas ---

class BaselineBacktestResponse(BaseModel):
    equity_curve: List[float]
    dates: List[str]
    total_return: float
    annualized_return: float
    sharpe_ratio: float
    max_drawdown: float
    calmar_ratio: float
    volatility: float
    win_rate: float


class ResearchBacktestRequest(BaseModel):
    tickers: List[str] = Field(default=["AAPL", "MSFT", "GOOGL"])
    weights: Optional[List[float]] = None
    period: str = Field(default="2y")
    initial_capital: float = Field(default=10_000_000.0, gt=0)
    risk_free_rate: float = Field(default=0.05, ge=0.0, le=0.50)
    commission_bps: float = Field(default=3.0, ge=0.0)
    stt_tax_bps: float = Field(default=10.0, ge=0.0)
    exchange_fee_bps: float = Field(default=0.3, ge=0.0)
    half_spread_bps: float = Field(default=2.5, ge=0.0)
    walk_forward_splits: int = Field(default=1, ge=1, le=10)


class ResearchBacktestResponse(BaseModel):
    engine_type: str
    dates: List[str]
    equity_curve: List[float]
    initial_capital: float
    ending_capital: float
    total_return: float
    cagr: float
    volatility: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    omega_ratio: float
    max_drawdown: float
    win_rate: float
    profit_factor: float
    total_fees_and_slippage: float
    annualized_turnover: float
    mean_slippage_bps: float
    walk_forward_splits: Optional[List[Dict[str, Any]]] = None


# --- Statistical Validation Schemas ---

class ValidationResponse(BaseModel):
    kupiec_pof: Dict[str, Any]
    christoffersen_independence: Dict[str, Any]
    conditional_coverage_joint: Dict[str, Any]
    basel_traffic_light: Dict[str, Any]
    overall_status: str


# --- Forecasting Ensemble Schemas ---

class ForecastEnsembleRequest(BaseModel):
    symbol: str = "RELIANCE"
    horizon: int = Field(default=64, ge=5, le=365)
    weighting_scheme: str = Field(default="regime_conditioned", description="equal | inverse_error | regime_conditioned")


class ForecastEnsembleResponse(BaseModel):
    status: str
    symbol: str
    current_price: float
    horizon_days: int
    weighting_scheme: str
    regime_classification: str
    model_weights: Dict[str, float]
    consensus_trajectory: List[float]
    lower_bound_p10: List[float]
    upper_bound_p90: List[float]
    model_dispersion_std: List[float]
    projected_return_pct: float
    individual_models: Dict[str, Any]
    validation_diagnostics: Dict[str, Any]
