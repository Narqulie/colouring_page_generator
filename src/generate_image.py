import os
import sys
from datetime import datetime
from io import BytesIO
from dotenv import load_dotenv
from loguru import logger
from src.helpers import log_generated_images
from openai import OpenAI
import requests
from PIL import Image
import replicate
from typing import Optional

# Configure logging
logger.info(f"Python version: {sys.version}")
logger.info(f"Python executable: {sys.executable}")
logger.info(f"Python path: {sys.path}")
logger.info("Running generate_image.py")

def setup_replicate() -> Optional[bool]:
    """Initialize Replicate with API token from environment
    
    Returns:
        bool: True if setup successful, None if failed
    """
    load_dotenv()
    api_token = os.getenv('REPLICATE_API_TOKEN')
    if not api_token:
        logger.error('The REPLICATE_API_TOKEN environment variable is not set')
        return None
    
    os.environ['REPLICATE_API_TOKEN'] = api_token
    return True

def generate_replicate_image(prompt: str) -> Optional[str]:
    """Generate image using Replicate's Flux model
    
    Args:
        prompt: Text prompt for image generation
        
    Returns:
        str: Image URL or None if generation failed
    """
    try:
        output = replicate.run(
            "black-forest-labs/flux-dev",
            input={
                "prompt": f"""
                Generate a coloring page for children.
                The coloring page should be based on the prompt: {prompt}
                Do not add to the prompt, use only it as a basis for the image.
                The image should always be black and white only for colouring.
                The image should be friendly and safe, never scary or violent.
                The image should be detailed, with a lot of different elements to color in.
                
                Enhance the design by:
                - Adding intricate patterns, textures, and small decorative elements
                - Including complementary background elements
                - Featuring playful and imaginative accessories
                - Creating a balance of large and small coloring areas
                """,
                "go_fast": True,
                "guidance": 3.5,
                "megapixels": "1",
                "num_outputs": 1,
                "aspect_ratio": "1:1",
                "output_format": "webp",
                "output_quality": 80,
                "prompt_strength": 0.8,
                "num_inference_steps": 28
            }
        )
        
        if output and isinstance(output, list):
            return output[0]  # Return first image URL
        return None
        
    except Exception as e:
        logger.error(f"Failed to generate Replicate image: {e}")
        return None

def download_and_process_image(image_url: str):
    """Download and open image from URL
    
    Args:
        image_url: URL of image to download
        
    Returns:
        PIL Image object or None if download failed
    """
    try:
        response = requests.get(image_url)
        if response.status_code != 200:
            logger.error(f"Failed to download image. Status code: {response.status_code}")
            return None
            
        return Image.open(BytesIO(response.content))
    except Exception as e:
        logger.error(f"Error downloading/processing image: {e}")
        return None

def create_colouring_page(prompt: str) -> Optional[str]:
    """Generate a coloring page based on the given prompt using Replicate's Flux model.
    
    Args:
        prompt (str): The prompt to generate the coloring page from.
    
    Returns:
        Optional[str]: The filename of the saved image, or None if an error occurred.
    """
    logger.info(f"Creating a coloring page with prompt: {prompt}")
    original_prompt = prompt

    if prompt == "Surprise me!":
        logger.info("Generating a random coloring page")
        prompt = "An engaging coloring page for children. The theme could be anything that children would enjoy coloring in."

    # Initialize Replicate
    if not setup_replicate():
        return None

    try:
        # Generate image
        image_url = generate_replicate_image(prompt)
        if not image_url:
            return None
        logger.debug(f"Image URL received: {image_url}")
        
        # Download and process image
        img = download_and_process_image(image_url)
        if not img:
            return None

        # Create images directory and save image
        os.makedirs('images', exist_ok=True)
        
        safe_prompt = ''.join(c for c in original_prompt if c.isalnum() or c in (' ', '_', '-'))[:50]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join('images', f"{timestamp}_{safe_prompt}.png")
        
        logger.debug(f"Attempting to save image to: {filename}")
        
        try:
            img.save(filename)
            logger.info(f"Image successfully saved to {filename}")
            log_generated_images(filename, prompt)
            return filename
            
        except Exception as save_error:
            logger.error(f"Failed to save image: {save_error}", exc_info=True)
            return None

    except Exception as e:
        logger.exception(f"An error occurred while generating the coloring page: {e}")
        return None
