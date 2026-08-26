import sys
import os
from pathlib import Path

# Add backend and root directory to sys.path
root_dir = Path(__file__).resolve().parent
backend_dir = root_dir / "backend"

for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

import uvicorn
from api.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"🚀 Starting RISKOS Backend Server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
