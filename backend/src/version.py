"""Version information for the application.

Priority order:
  1. RENDER_GIT_COMMIT env var (set by Render at runtime)
  2. build_info.json (written at Docker build time)
  3. Static fallback version (1.5.1)
"""

import json
import os
from pathlib import Path

__version__ = "1.5.1"

# 1 — Render runtime env var (most reliable for deployed builds)
render_commit = os.getenv("RENDER_GIT_COMMIT")
if render_commit:
    __version__ = f"{__version__}-{render_commit[:7]}"
else:
    # 2 — Docker build-time info
    build_info_path = Path(__file__).parent.parent / "build_info.json"
    try:
        with open(build_info_path) as f:
            info = json.load(f)
        git_hash = info.get("git_hash")
        if git_hash:
            __version__ = f"{__version__}-{git_hash[:7]}"
    except (FileNotFoundError, json.JSONDecodeError):
        pass
