import os
from datetime import datetime
from io import BytesIO
from dotenv import load_dotenv
from loguru import logger
from .helpers import save_metadata, load_metadata
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

# Ensure directories exist
LOG_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)


def setup_replicate() -> Optional[bool]:
    """Initialize Replicate with API token from environment"""
    logger.info("Setting up Replicate API...")
    try:
        load_dotenv()
        api_token = os.getenv("REPLICATE_API_TOKEN")
        if not api_token:
            logger.error("REPLICATE_API_TOKEN environment variable is not set")
            return None

        os.environ["REPLICATE_API_TOKEN"] = api_token

        try:
            replicate.models.get("pnickolas1/sdxl-coloringbook")
            logger.info("Replicate API token validated")
            return True
        except Exception as e:
            logger.error(f"Failed to validate Replicate API token: {e}")
            return None

    except Exception as e:
        logger.error(f"Error setting up Replicate: {e}")
        return None


def generate_replicate_image(
    prompt: str, theme: str = "none"
) -> Optional[str]:
    """
    Generate image using Replicate's SDXL coloring-book model.

    Args:
        prompt: The user's prompt describing what to draw
        theme: The art style theme to apply (default: "none")

    Returns:
        The URL of the generated image, or None if generation failed
    """
    logger.info(f"Generating image with prompt: {prompt}, theme: {theme}")

    # Art style definitions
    art_style_prompts = {
        "cartoon": "Playful, exaggerated features with rounded, expressive lines.",
        "cute": "Chubby simplified shapes with soft curves and large expressive eyes.",
        "realistic": "More accurate proportions with fine detail in the outlines.",
        "whimsical": "Flowing imaginative lines with decorative swirls and fantasy elements.",
        "doodle": "Fun sketchy style with engaging patterns and mini-details.",
        "geometric": "Sharp, clean geometric shapes with emphasis on symmetry.",
        "mandala-inspired": "Repetitive decorative patterns with radial symmetry.",
        "storybook": "Classic fairytale illustration style with charming linework.",
        "minimalist": "Clean and airy with minimal details and spacious composition.",
        "comic": "Bold dynamic lines and expressive comic book style.",
    }

    style_prompt = art_style_prompts.get(theme.lower(), "")

    prompt_text = f"""{prompt}

{style_prompt}

Black and white coloring page, in the style of TOK, clean outlines, no shading, no colors, white background"""

    negative_prompt = "shading, colors, grey, gray, photograph, realistic shading, gradients, halftone, dithering, noise, texture"

    try:
        logger.debug("Calling Replicate API...")
        output = replicate.run(
            "pnickolas1/sdxl-coloringbook",
            input={
                "prompt": prompt_text,
                "negative_prompt": negative_prompt,
                "width": 768,
                "height": 1024,
                "num_outputs": 1,
                "scheduler": "K_EULER",
                "num_inference_steps": 30,
                "guidance_scale": 7.5,
                "lora_scale": 0.6,
                "apply_watermark": False,
            },
        )
        logger.debug(f"Raw Replicate API response: {output}")

        if not output or not isinstance(output, list) or len(output) == 0:
            logger.error("Empty response from Replicate")
            return None

        url = str(output[0]).strip()
        if not url.startswith("http"):
            logger.error(f"Invalid URL format: {url}")
            return None

        try:
            response = requests.head(url, timeout=5)
            if response.status_code != 200:
                logger.error(f"URL returned status code {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"URL validation failed: {e}")
            return None

        logger.info(f"Valid image URL received from Replicate: {url}")
        return url

    except Exception as e:
        logger.exception(f"Failed to generate Replicate image: {e}")
        return None


def download_and_process_image(image_url: str):
    """Download and process image from URL"""
    logger.info(f"Downloading image from URL: {image_url}")
    try:
        response = requests.get(image_url)
        if response.status_code != 200:
            logger.error(
                f"Failed to download image. Status code: {response.status_code}"
            )
            return None

        logger.debug("Processing downloaded image...")
        img = Image.open(BytesIO(response.content))
        logger.info("Image successfully downloaded and processed")
        return img
    except Exception as e:
        logger.exception(f"Error downloading/processing image: {e}")
        return None


def create_colouring_page(
    prompt: str,
    theme: str = "none",
    original_prompt: str = None,
) -> Optional[str]:
    """
    Create a colouring page from a prompt.

    Args:
        prompt: The prompt to generate the image from
        theme: The theme of the image (default: "none")
        original_prompt: The original prompt for filename creation (default: None)

    Returns:
        The filename of the created image, or None if creation failed
    """
    if not prompt:
        logger.error("No prompt provided")
        return None

    if original_prompt is None:
        original_prompt = prompt

    logger.info(f"Creating colouring page for prompt: {prompt}, theme: {theme}")

    if not setup_replicate():
        logger.error("Failed to initialize Replicate")
        return None

    IMAGES_DIR.mkdir(exist_ok=True)

    safe_filename = "".join(
        c for c in original_prompt if c.isalnum() or c in (" ", "-", "_")
    ).rstrip()
    safe_filename = f"{safe_filename}_{int(time.time())}.png"

    image_url = generate_replicate_image(prompt, theme)
    if not image_url:
        logger.error("Failed to generate image URL")
        return None

    img = download_and_process_image(image_url)
    if img is None:
        logger.error("Failed to download and process image")
        return None

    output_path = IMAGES_DIR / safe_filename
    img.save(output_path, "PNG", quality=95)
    logger.info(f"Saved image to {output_path}")

    metadata = load_metadata(str(METADATA_FILE))
    metadata[safe_filename] = {
        "prompt": original_prompt,
        "theme": theme,
        "created_at": datetime.now().isoformat(),
        "model_prompt": prompt,
    }
    save_metadata(metadata, str(METADATA_FILE))
    logger.info(f"Updated metadata for {safe_filename}")

    return safe_filename
