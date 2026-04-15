import pandas as pd
import numpy as np
from hmmlearn.hmm import GaussianHMM
import warnings

warnings.filterwarnings("ignore")

def detect_regime(returns: pd.Series, n_states: int = 3) -> dict:
    returns = returns.dropna()
    if len(returns) < 50:
        return {"error": "Insufficient data"}
        
    X = returns.values.reshape(-1, 1)
    
    try:
        model = GaussianHMM(n_components=n_states, covariance_type="full", n_iter=1000)
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
            'state_history': state_history[-100:] # Return last 100 for brevity
        }
    except Exception as e:
        return {"error": str(e)}
