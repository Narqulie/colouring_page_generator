import os
import sys
from datetime import datetime
from io import BytesIO
from dotenv import load_dotenv
from loguru import logger
from src.helpers import log_generated_images, load_metadata, save_metadata
from openai import OpenAI
import requests
from PIL import Image
import replicate
from typing import Optional
from pathlib import Path
import time

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent.parent
LOG_DIR = PROJECT_ROOT / "logs"
IMAGES_DIR = PROJECT_ROOT / "images"
METADATA_FILE = PROJECT_ROOT / "image_metadata.json"

# Configure logger with both file and console output
logger.remove()  # Remove default handler
logger.add(sys.stderr, level="INFO", colorize=True)  # Console output
logger.add(
    LOG_DIR / "debug.log",
    level="DEBUG",
    rotation="10 MB",
    compression="zip",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}",
)

# Ensure directories exist
LOG_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)

def setup_replicate() -> Optional[bool]:
    """Initialize Replicate with API token from environment"""
    logger.info("🔑 Setting up Replicate API...")
    try:
        load_dotenv()
        api_token = os.getenv("REPLICATE_API_TOKEN")
        if not api_token:
            logger.error("❌ REPLICATE_API_TOKEN environment variable is not set")
            return None
            
        # Set the token in the environment
        os.environ["REPLICATE_API_TOKEN"] = api_token
        
        # Test the token by making a simple API call to list models
        try:
            replicate.models.get("black-forest-labs/flux-1.1-pro")
            logger.info("✅ Replicate API token validated")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to validate Replicate API token: {e}")
            return None
            
    except Exception as e:
        logger.error(f"❌ Error setting up Replicate: {e}")
        return None


def generate_replicate_image(prompt: str, language: str = "en", complexity: str = "medium", theme: str = "none") -> Optional[str]:
    """
    Generate image using Replicate's Flux model
    
    Args:
        prompt: The user's prompt describing what to draw
        language: The language of the prompt (default: "en")
        complexity: The complexity level of the image (default: "medium")
        theme: The art style theme to apply (default: "none")
        
    Returns:
        The URL of the generated image, or None if generation failed
    """
    logger.info(f"🎨 Generating image with prompt: {prompt} in language: {language}, complexity: {complexity}, art style: {theme}")

    # Art style definitions
    art_style_prompts = {
        "cartoon": "Use playful, exaggerated features with rounded lines in a cartoon style.",
        "cute": "Create in kawaii style with simple, chubby shapes and soft lines. Add cute, big eyes where appropriate.",
        "realistic": "Draw with more accurate proportions and fine details, while keeping it suitable for coloring.",
        "whimsical": "Use flowing, imaginative lines in a storybook-like style.",
        "doodle": "Create a fun, hand-drawn sketchy style with engaging patterns.",
        "geometric": "Emphasize sharp, clean geometric shapes with focus on symmetry.",
        "mandala-inspired": "Include kid-friendly repetitive, decorative patterns inspired by mandalas.",
        "storybook": "Draw in classic fairytale illustration style.",
        "minimalist": "Keep it clean and simple with minimal details and clear outlines.",
        "comic": "Use bold lines and dynamic expressions in comic book style, avoiding heavy shading."
    }

    # Get the art style prompt addition
    style_prompt = art_style_prompts.get(theme.lower(), "")

    # Construct the system prompt for coloring page generation
    system_prompt = f"""
        Generate a detailed black-and-white coloring page for children based on the following description ({language}): {prompt}

        Art Style: {style_prompt}

        Key Requirements:
            1.	The image must be a child-friendly coloring page.
            2.	Use only black outlines on a white background—no shading or colors.
            3.	Ensure bold, clear lines for easy coloring.
            4.	Add engaging details and patterns to make coloring fun.
            5.	Keep the design balanced and match the specified complexity: {complexity} (e.g., simple, medium, or detailed).
            6.	Include an appropriate background that complements the main subject.
            7.	Incorporate playful decorative elements to enhance the scene.

        Style Guidelines:
            •	Use clean, smooth lines with a mix of large and small areas to color.
            •	Ensure the main subject is clear and visually appealing to children.
            •	Maintain a well-balanced composition with engaging details.
            •	Keep the overall design suitable for young children, adapting complexity as needed.
    """
    
    try:
        logger.debug("Calling Replicate API...")
        output = replicate.run(
            "black-forest-labs/flux-1.1-pro",
            input={
                "prompt": system_prompt,
                "aspect_ratio": "1:1",
                "output_format": "webp",
                "output_quality": 80,
                "safety_tolerance": 2,
                "prompt_upsampling": True
            },
        )
        logger.debug(f"Raw Replicate API response: {output}")

        # Validate the URL
        if not output:
            logger.error("❌ Empty response from Replicate")
            return None

        url = str(output).strip()
        if not url.startswith('http'):
            logger.error(f"❌ Invalid URL format: {url}")
            return None

        # Test if URL is accessible
        try:
            response = requests.head(url, timeout=5)
            if response.status_code != 200:
                logger.error(f"❌ URL returned status code {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"❌ URL validation failed: {e}")
            return None

        logger.info(f"✅ Valid image URL received from Replicate: {url}")
        return url

    except Exception as e:
        logger.exception(f"❌ Failed to generate Replicate image: {e}")
        return None

def download_and_process_image(image_url: str):
    """Download and process image from URL"""
    logger.info(f"📥 Downloading image from URL: {image_url}")
    try:
        response = requests.get(image_url)
        if response.status_code != 200:
            logger.error(f"❌ Failed to download image. Status code: {response.status_code}")
            return None

        logger.debug("Processing downloaded image...")
        img = Image.open(BytesIO(response.content))
        logger.info("✅ Image successfully downloaded and processed")
        return img
    except Exception as e:
        logger.exception(f"❌ Error downloading/processing image: {e}")
        return None

def create_colouring_page(prompt: str, language: str = "en", complexity: str = "medium", theme: str = "none", original_prompt: str = None) -> Optional[str]:
    """
    Create a colouring page from a prompt.
    
    Args:
        prompt: The prompt to generate the image from
        language: The language of the prompt (default: "en")
        complexity: The complexity level of the image (default: "medium")
        theme: The theme of the image (default: "none")
        original_prompt: The original prompt for filename creation (default: None)
        
    Returns:
        The filename of the created image, or None if creation failed
    """
    if not prompt:
        logger.error("❌ No prompt provided")
        return None
        
    if original_prompt is None:
        original_prompt = prompt
        
    logger.info(f"🎨 Creating colouring page for prompt: {prompt} in language: {language}, complexity: {complexity}, theme: {theme}")
    
    # Initialize Replicate first
    if not setup_replicate():
        logger.error("❌ Failed to initialize Replicate")
        return None
    
    # Create images directory if it doesn't exist
    IMAGES_DIR.mkdir(exist_ok=True)
    
    # Generate a safe filename from the original prompt
    safe_filename = "".join(c for c in original_prompt if c.isalnum() or c in (' ', '-', '_')).rstrip()
    safe_filename = f"{safe_filename}_{int(time.time())}.png"
    
    # First generate the image URL
    image_url = generate_replicate_image(prompt, language, complexity, theme)
    if not image_url:
        logger.error("❌ Failed to generate image URL")
        return None
        
    # Download and process the image
    img = download_and_process_image(image_url)
    if img is None:
        logger.error("❌ Failed to download and process image")
        return None
    
    # Save the image
    output_path = IMAGES_DIR / safe_filename
    img.save(output_path, "PNG", quality=95)
    logger.info(f"✅ Saved image to {output_path}")
    
    # Update metadata
    metadata = load_metadata(str(METADATA_FILE))
    metadata[safe_filename] = {
        "prompt": original_prompt,
        "language": language,
        "complexity": complexity,
        "theme": theme,
        "created_at": datetime.now().isoformat(),
        "model_prompt": prompt
    }
    save_metadata(metadata, str(METADATA_FILE))
    logger.info(f"✅ Updated metadata for {safe_filename}")
    
    return safe_filename
