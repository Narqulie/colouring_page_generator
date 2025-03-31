from loguru import logger
from typing import List, Dict
from pathlib import Path
from src.helpers import load_metadata


def get_image_filenames(images_folder: str) -> List[Dict]:
    """
    Get a list of image objects with metadata from the specified directory.
    
    Args:
        images_folder: Path to the images directory
        
    Returns:
        List of image objects with metadata
    """
    logger.info(f"📂 Getting image filenames from {images_folder}")
    
    # Get project root directory and paths
    image_path = Path(images_folder)
    metadata_path = image_path.parent / "image_metadata.json"
    
    if not image_path.exists():
        logger.warning(f"⚠️ Image directory {image_path} does not exist")
        return []
    
    # Get metadata
    metadata = load_metadata(str(metadata_path))
    
    # Get only image files that exist
    valid_extensions = {'.png', '.jpg', '.jpeg', '.webp'}
    image_files = []
    
    for f in image_path.iterdir():
        if f.is_file() and f.suffix.lower() in valid_extensions:
            # Only include if the file exists
            if f.exists():
                image_files.append({
                    "filename": f.name,
                    "url": f"/images/{f.name}",
                    "prompt": metadata.get(f.name, {}).get("prompt", ""),
                    "date": metadata.get(f.name, {}).get("created_at", str(f.stat().st_mtime))
                })
            else:
                logger.warning(f"⚠️ Metadata exists for {f.name} but file is missing")
    
    logger.info(f"✅ Found {len(image_files)} images in gallery")
    return image_files
