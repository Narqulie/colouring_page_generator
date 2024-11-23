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

# Configure logging
logger.info(f"Python version: {sys.version}")
logger.info(f"Python executable: {sys.executable}")
logger.info(f"Python path: {sys.path}")
logger.info("Running generate_image.py")

def setup_openai():
    """Initialize OpenAI client with API key from environment"""
    load_dotenv()
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        logger.error('The OPENAI_API_KEY environment variable is not set')
        return None
        
    OpenAI.api_key = api_key
    return OpenAI()

def generate_dalle_image(client: OpenAI, prompt: str):
    """Generate image using DALL-E 3 API
    
    Args:
        client: OpenAI client instance
        prompt: Text prompt for image generation
        
    Returns:
        Image URL or None if generation failed
    """
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=f"""
            Generate a coloring page for children.
            The coloring page should be based on the prompt: {prompt}.
            Do not add to the prompt, use only it as a basis for the image.
            The image should always be black and white only for colouring.
            The image should be friendly and safe, never scary or violent.
            The image should be detailed, with a lot of different elements to color in.""",
            size="1024x1024",
            quality="standard",
            n=1,
        )
        return response.data[0].url
    except Exception as e:
        logger.error(f"Failed to generate DALL-E image: {e}")
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

def create_colouring_page(prompt: str):
    """Generate a coloring page based on the given prompt using OpenAI's DALL-E 3 model.
    
    Args:
        prompt (str): The prompt to generate the coloring page from.
    
    Returns:
        str: The filename of the saved image, or None if an error occurred.
    """
    logger.info(f"Creating a coloring page with prompt: {prompt}")
    original_prompt = prompt

    if prompt == "Surprise me!":
        logger.info("Generating a random coloring page")
        prompt = "An engaging coloring page for children. The theme could be anything that children would enjoy coloring in. The image should be detailed and intricate, with a lot of different elements to color in."

    # Initialize OpenAI client
    client = setup_openai()
    if not client:
        return None

    try:
        # Generate image
        image_url = generate_dalle_image(client, prompt)
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
