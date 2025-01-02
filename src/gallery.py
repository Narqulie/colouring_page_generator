from loguru import logger
from typing import List
from pathlib import Path


def get_image_filenames(images_folder: str) -> List[str]:
    """
    Get a list of image filenames from the specified directory.
    
    Args:
        images_folder: Path to the images directory
        
    Returns:
        List of image filenames
    """
    logger.info(f"Getting image filenames from {images_folder}")
    
    image_path = Path(images_folder)
    if not image_path.exists():
        logger.warning(f"Image directory {images_folder} does not exist")
        return []
    
    # Get only image files
    valid_extensions = {'.png', '.jpg', '.jpeg'}
    image_files = [
        f.name for f in image_path.iterdir() 
        if f.is_file() and f.suffix.lower() in valid_extensions
    ]
    
    logger.info(f"Found {len(image_files)} images in gallery")
    return image_files
