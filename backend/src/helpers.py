from typing import Dict, Any
from .storage import create_storage

storage = create_storage()


def save_metadata(metadata: Dict[str, Any], metadata_file: str = None) -> None:
    storage.save_metadata(metadata)


def load_metadata(metadata_file: str = None) -> Dict[str, Any]:
    return storage.load_metadata()
