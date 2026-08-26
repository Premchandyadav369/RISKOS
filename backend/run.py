import sys
import os
from pathlib import Path
import uvicorn

# Ensure backend and root directories are in sys.path
backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent

for p in [str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from api.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"🚀 Starting RISKOS Backend Server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
