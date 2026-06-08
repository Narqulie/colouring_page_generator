from loguru import logger
from typing import Dict, Any
import json


def save_metadata(metadata: Dict[str, Any], metadata_file: str) -> None:
    """
    Save metadata to a JSON file.
    
    Args:
        metadata: Dictionary containing metadata to save
        metadata_file: Path to the metadata file
    """
    logger.info(f"💾 Saving metadata to {metadata_file}")
    
    try:
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info("✅ Metadata saved successfully")
    except Exception as e:
        logger.error(f"❌ Failed to save metadata: {str(e)}")
        raise


def load_metadata(metadata_file: str) -> Dict[str, Any]:
    """
    Load metadata from a JSON file.
    
    Args:
        metadata_file: Path to the metadata file
        
    Returns:
        Dictionary containing the metadata
    """
    logger.info(f"📖 Loading metadata from {metadata_file}")
    
    try:
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        logger.info("✅ Metadata loaded successfully")
        return metadata
    except FileNotFoundError:
        logger.warning(f"⚠️ Metadata file {metadata_file} not found, creating new")
        return {}
    except Exception as e:
        logger.error(f"❌ Failed to load metadata: {str(e)}")
        raise
