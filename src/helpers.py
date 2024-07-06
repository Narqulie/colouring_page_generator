from datetime import datetime
from loguru import logger
now = datetime.now()


def log_generated_images(file, prompt):
    imagestr = f"{now},{file},{prompt}\n"
    logger.info(f"Logging generated image: {imagestr}")
