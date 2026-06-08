"""Version information for the application.

Reads from build_info.json (written at Docker build time) falling back
to a static dev version when the file is absent.
"""

import json
from pathlib import Path

__version__ = "1.5.1"

build_info_path = Path(__file__).parent.parent / "build_info.json"
try:
    with open(build_info_path) as f:
        info = json.load(f)
    git_hash = info.get("git_hash")
    if git_hash:
        __version__ = f"{__version__}-{git_hash[:7]}"
except (FileNotFoundError, json.JSONDecodeError):
    pass
