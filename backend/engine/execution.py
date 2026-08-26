import random
import numpy as np

def simulate_execution(ticker: str, direction: str, quantity: int, vwap_window: int = 20) -> dict:
    if quantity > 100_000:
        return {'status': 'REJECTED', 'error': 'Order exceeds max quantity limit (100k shares)'}
        
    # Dummy base price for simulation
    base_price = 150.0 
    
    if quantity * base_price > 50_000_000:
        return {'status': 'REJECTED', 'error': 'Order exceeds notional limit (50M)'}
        
    fills = []
    slice_qty = quantity // vwap_window
    rem_qty = quantity % vwap_window
    
    total_cost = 0.0
    total_qty = 0
    
    for i in range(vwap_window):
        q = slice_qty + (rem_qty if i == vwap_window - 1 else 0)
        
        # Synthetic slippage: 0.02% max per slice * random factor
        slippage_bps = 2 * random.random()
        price_impact = base_price * (slippage_bps / 10000)
        
        if direction.upper() == 'BUY':
            exec_price = base_price + price_impact
        else:
            exec_price = base_price - price_impact
            
        fills.append({
            'slice': i + 1,
            'quantity': q,
            'price': round(exec_price, 2),
            'slippage_bps': round(slippage_bps, 2)
        })
        
        total_cost += q * exec_price
        total_qty += q
        
    avg_fill_price = total_cost / total_qty if total_qty > 0 else 0
    
    # VWAP benchmark roughly equals base price in this naive sim
    vwap_benchmark = base_price
    
    if direction.upper() == 'BUY':
        is_bps = ((avg_fill_price - vwap_benchmark) / vwap_benchmark) * 10000
    else:
        is_bps = ((vwap_benchmark - avg_fill_price) / vwap_benchmark) * 10000
        
    return {
        'fills': fills,
        'avg_fill_price': round(avg_fill_price, 2),
        'vwap_benchmark': round(vwap_benchmark, 2),
        'implementation_shortfall_bps': round(is_bps, 2),
        'total_cost': round(total_cost, 2),
        'status': 'FILLED'
    }
