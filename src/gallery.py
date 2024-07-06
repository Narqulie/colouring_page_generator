import os
from loguru import logger


def get_image_filenames(app):
    logger.info("Getting image filenames")

    """Get a list of image filenames in the 'images' directory."""
    image_dir = os.path.join(app.root_path, 'images')
    logger.info(f"Image directory: {image_dir}")

    if not os.path.exists(image_dir):
        return []
    logger.info("Returning a list of image filenames")
    number_of_files = len([f for f in os.listdir(image_dir) if os.path.isfile(os.path.join(image_dir, f))])
    logger.info(f"Number of files: {number_of_files}")
    return [f for f in os.listdir(image_dir) if os.path.isfile(os.path.join(image_dir, f))]
