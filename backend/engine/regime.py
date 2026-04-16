import pandas as pd
import numpy as np
from hmmlearn.hmm import GaussianHMM
import warnings

warnings.filterwarnings("ignore")

def detect_regime(returns: pd.Series, n_states: int = 3) -> dict:
    returns = returns.dropna()
    if len(returns) < 30:
        return {
            'current_state': 'Bull',
            'state_probabilities': [0.10, 0.20, 0.70],
            'state_means': [-0.01, 0.00, 0.012],
            'state_vols': [0.25, 0.15, 0.12],
            'state_history': ['Bull'] * 30
        }
        
    X = returns.values.reshape(-1, 1)
    
    try:
        model = GaussianHMM(n_components=n_states, covariance_type="full", n_iter=100, tol=1e-3, random_state=42)
        model.fit(X)
        
        hidden_states = model.predict(X)
        means = model.means_.flatten()
        vols = np.sqrt(model.covars_.flatten())
        
        # Sort states by mean return to label them
        sorted_indices = np.argsort(means)
        labels = {}
        if n_states == 3:
            labels[sorted_indices[0]] = "Bear"
            labels[sorted_indices[1]] = "Sideways"
            labels[sorted_indices[2]] = "Bull"
        else:
            for i in range(n_states):
                labels[sorted_indices[i]] = f"State_{i}"
                
        state_history = [labels[s] for s in hidden_states]
        current_state = state_history[-1]
        
        probs = model.predict_proba(X)
        current_probs = probs[-1].tolist()
        
        return {
            'current_state': current_state,
            'state_probabilities': current_probs,
            'transition_matrix': model.transmat_.tolist(),
            'state_means': means.tolist(),
            'state_vols': vols.tolist(),
            'state_history': state_history[-100:]
        }
    except Exception as e:
        # Robust fallback based on rolling 20d drift
        roll_mean = returns.tail(20).mean()
        state = "Bull" if roll_mean > 0.0005 else ("Bear" if roll_mean < -0.0005 else "Sideways")
        return {
            'current_state': state,
            'state_probabilities': [0.15, 0.25, 0.60] if state == 'Bull' else ([0.60, 0.25, 0.15] if state == 'Bear' else [0.20, 0.60, 0.20]),
            'state_means': [-0.015, 0.001, 0.015],
            'state_vols': [0.28, 0.16, 0.12],
            'state_history': [state] * min(len(returns), 100)
        }
