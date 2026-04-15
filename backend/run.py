import sys
import os
from pathlib import Path
import uvicorn

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from api.main import app

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
