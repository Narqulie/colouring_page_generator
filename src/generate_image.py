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
    api_token = os.getenv("REPLICATE_API_TOKEN")
    if not api_token:
        logger.error("The REPLICATE_API_TOKEN environment variable is not set")
        return None

    os.environ["REPLICATE_API_TOKEN"] = api_token
    return True


def generate_replicate_image(prompt: str) -> Optional[str]:
    """Generate image using Replicate's Flux model

    Args:
        prompt: Text prompt for image generation, including language context

    Returns:
        str: Image URL or None if generation failed
    """
    try:
        output = replicate.run(
            "black-forest-labs/flux-dev",
            input={
                "prompt": prompt,
                "go_fast": True,
                "guidance": 8,
                "megapixels": "1",
                "num_outputs": 1,
                "aspect_ratio": "1:1",
                "output_format": "webp",
                "output_quality": 80,
                "prompt_strength": 0.8,
                "num_inference_steps": 32,
            },
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
            logger.error(
                f"Failed to download image. Status code: {response.status_code}"
            )
            return None

        return Image.open(BytesIO(response.content))
    except Exception as e:
        logger.error(f"Error downloading/processing image: {e}")
        return None


def create_colouring_page(prompt: str, language: str = "en", output_filename: str | None = None) -> str:
    """Generate a colouring page from a prompt.
    
    Args:
        prompt: The text prompt to generate the image
        language: The language code of the UI (e.g. 'en', 'es', 'de')
        output_filename: Optional specific filename to use
    
    Returns:
        str: Path to the generated image
    """
    logger.info(f"Creating a coloring page with prompt: {prompt} in language: {language}")
    original_prompt = prompt

    if prompt == "Surprise me!":
        logger.info("Generating a random coloring page")
        prompt = "An engaging coloring page for children. The theme could be anything that children would enjoy coloring in."

    # Initialize Replicate
    if not setup_replicate():
        return None

    try:
        # Modify the prompt to include language information
        model_prompt = f"""
                        Generate a black-and-white coloring page for children.  
                        The coloring page should be based on the following description (in {language}): {prompt}.  
                        Note: The text prompt is in {language}, please interpret it accordingly.
                        
                        Guidelines for the design:  
                        1. The image must faithfully represent the description, staying true to the theme while allowing for creative, thematic enhancements.  
                        2. Focus on detailed linework with intricate patterns, textures, and decorative elements on the main subject to make it visually captivating.  
                        3. Include a rich and engaging background relevant to the theme, such as imaginative scenery, complex geometric patterns, or complementary objects.  
                        4. Add dynamic and interesting motifs (e.g., swirling shapes, abstract designs, or small thematic accessories) to enhance variety and depth.  
                        5. Create a mix of bold, large sections for easy coloring and fine, detailed areas for more advanced coloring challenges.  

                        Tone and style:  
                        - The image should have a sophisticated, artistic style while remaining approachable and suitable for children.  
                        - Avoid overly simplistic or overly juvenile designs; instead, aim for a design that feels timeless, artistic, and visually engaging.  
                        - The overall page should offer a sense of wonder and creativity, appealing to both younger and older children.  
                    """

        # Generate image with updated prompt
        image_url = generate_replicate_image(model_prompt)
        if not image_url:
            return None
        logger.debug(f"Image URL received: {image_url}")

        # Download and process image
        img = download_and_process_image(image_url)
        if not img:
            return None

        # Create images directory
        os.makedirs("images", exist_ok=True)

        # Use provided filename or generate one
        if output_filename:
            output_path = os.path.join("images", output_filename)
        else:
            safe_prompt = "".join(
                c for c in original_prompt if c.isalnum() or c in (" ", "_", "-")
            )[:50]
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = os.path.join("images", f"{timestamp}_{safe_prompt}.png")

        logger.debug(f"Attempting to save image to: {output_path}")

        try:
            img.save(output_path)
            logger.info(f"Image successfully saved to {output_path}")
            log_generated_images(output_path, prompt)
            return output_path

        except Exception as save_error:
            logger.error(f"Failed to save image: {save_error}", exc_info=True)
            return None

    except Exception as e:
        logger.exception(f"An error occurred while generating the coloring page: {e}")
        return None
