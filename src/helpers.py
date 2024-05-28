import logging
from datetime import datetime

now = datetime.now()

logging.basicConfig(level=logging.INFO)

def log_generated_images(file, prompt):
    imagestr = f"{now},{file},{prompt}\n"
    with open('generated_images.log', 'a') as f:
        f.write(imagestr)
