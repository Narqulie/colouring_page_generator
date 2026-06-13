import os
import uuid
from datetime import datetime
from dotenv import load_dotenv
from loguru import logger
from .storage import create_storage
import requests
import replicate
from typing import Optional, List, Dict
from pathlib import Path
import time
import threading

PROJECT_ROOT = Path(__file__).parent.parent
LOG_DIR = PROJECT_ROOT / "logs"
LOG_DIR.mkdir(exist_ok=True)

storage = create_storage()

predictions: Dict[str, dict] = {}
_predictions_lock = threading.Lock()


def setup_replicate() -> Optional[bool]:
    logger.info("Setting up Replicate API...")
    try:
        load_dotenv()
        api_token = os.getenv("REPLICATE_API_TOKEN")
        if not api_token:
            logger.error("REPLICATE_API_TOKEN environment variable is not set")
            return None
        os.environ["REPLICATE_API_TOKEN"] = api_token
        try:
            replicate.models.get("black-forest-labs/flux-schnell")
            logger.info("Replicate API token validated")
            return True
        except Exception as e:
            logger.error(f"Failed to validate Replicate API token: {e}")
            return None
    except Exception as e:
        logger.error(f"Error setting up Replicate: {e}")
        return None


def generate_replicate_image(prompt: str) -> Optional[str]:
    logger.info(f"Generating image with prompt: {prompt}")
    prompt_text = f"""{prompt}

Black and white coloring page, in the style of TOK, clean outlines, no shading, no colors, white background"""
    try:
        logger.debug("Calling Replicate API...")
        output = replicate.run(
            "black-forest-labs/flux-schnell",
            input={
                "prompt": prompt_text,
                "num_outputs": 1,
                "num_inference_steps": 4,
                "aspect_ratio": "3:4",
                "output_format": "png",
                "go_fast": True,
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


def download_image(image_url: str) -> Optional[bytes]:
    logger.info(f"Downloading image from URL: {image_url}")
    try:
        response = requests.get(image_url)
        if response.status_code != 200:
            logger.error(f"Failed to download image. Status code: {response.status_code}")
            return None
        return response.content
    except Exception as e:
        logger.exception(f"Error downloading image: {e}")
        return None


STOP_WORDS = frozenset({
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can", "need",
    "this", "that", "these", "those", "its", "it", "all", "very", "just",
    "some", "any", "each", "every", "both", "no", "not", "only", "too",
    "so", "if", "then", "than", "also", "about", "into", "over", "after",
    "before", "between", "under", "above", "below", "up", "down", "out",
    "off", "well", "back", "still", "much", "many", "more", "most",
    "such", "own", "same", "other", "another", "what", "which", "who",
    "whom", "when", "where", "why", "how", "make", "made", "get", "got",
    "like", "want", "draw", "coloring", "colouring", "page", "design",
})


def auto_tags(prompt: str, max_tags: int = 8) -> List[str]:
    words = prompt.lower().split()
    seen = set()
    tags = []
    for w in words:
        clean = w.strip(",.!?;:'\"()[]-")
        if len(clean) >= 4 and clean not in STOP_WORDS and clean not in seen:
            seen.add(clean)
            tags.append(clean)
        if len(tags) >= max_tags:
            break
    return tags


def start_prediction(prompt: str) -> Optional[str]:
    if not setup_replicate():
        logger.error("Failed to initialize Replicate")
        return None

    prompt_text = f"""{prompt}

Black and white coloring page, in the style of TOK, clean outlines, no shading, no colors, white background"""

    try:
        prediction = replicate.predictions.create(
            "black-forest-labs/flux-schnell",
            input={
                "prompt": prompt_text,
                "num_outputs": 1,
                "num_inference_steps": 4,
                "aspect_ratio": "3:4",
                "output_format": "png",
                "go_fast": True,
            },
        )
    except Exception as e:
        logger.exception(f"Failed to start Replicate prediction: {e}")
        return None

    pred_id = uuid.uuid4().hex[:12]
    entry = {
        "replicate_id": prediction.id,
        "status": prediction.status,
        "prompt": prompt,
        "original_prompt": prompt,
        "output_url": None,
        "filename": None,
        "error": None,
        "logs": prediction.logs or "",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }

    with _predictions_lock:
        predictions[pred_id] = entry

    logger.info(f"Started Replicate prediction {prediction.id} (local id: {pred_id})")
    return pred_id


def get_prediction(pred_id: str) -> Optional[dict]:
    with _predictions_lock:
        entry = predictions.get(pred_id)
        if not entry:
            return None

    try:
        prediction = replicate.predictions.get(entry["replicate_id"])
    except Exception as e:
        logger.error(f"Failed to poll Replicate prediction {entry['replicate_id']}: {e}")
        with _predictions_lock:
            entry["status"] = "failed"
            entry["error"] = str(e)
            entry["updated_at"] = datetime.now().isoformat()
        return dict(entry)

    with _predictions_lock:
        entry["status"] = prediction.status
        entry["logs"] = (prediction.logs or "")[-500:]
        entry["updated_at"] = datetime.now().isoformat()

        if prediction.status == "succeeded" and prediction.output:
            url = str(prediction.output[0])
            entry["output_url"] = url

            safe_filename = "".join(
                c for c in entry["original_prompt"] if c.isalnum() or c in (" ", "-", "_")
            ).rstrip()
            safe_filename = f"{safe_filename}_{int(time.time())}.png"

            img_data = download_image(url)
            if img_data:
                storage.save_image(safe_filename, img_data)
                logger.info(f"Saved image to storage: {safe_filename}")

                metadata = storage.load_metadata()
                metadata[safe_filename] = {
                    "prompt": entry["original_prompt"],
                    "created_at": entry["created_at"],
                    "model_prompt": entry["prompt"],
                    "tags": auto_tags(entry["original_prompt"]),
                }
                storage.save_metadata(metadata)
                logger.info(f"Updated metadata for {safe_filename}")

                entry["filename"] = safe_filename
                entry["status"] = "completed"
            else:
                entry["status"] = "failed"
                entry["error"] = "Failed to download image"

        elif prediction.status == "failed":
            entry["error"] = prediction.error or "Unknown error"

    return dict(entry)


def create_colouring_page(
    prompt: str,
    original_prompt: str = None,
) -> Optional[str]:
    if not prompt:
        logger.error("No prompt provided")
        return None
    if original_prompt is None:
        original_prompt = prompt
    logger.info(f"Creating colouring page for prompt: {prompt}")
    if not setup_replicate():
        logger.error("Failed to initialize Replicate")
        return None
    safe_filename = "".join(
        c for c in original_prompt if c.isalnum() or c in (" ", "-", "_")
    ).rstrip()
    safe_filename = f"{safe_filename}_{int(time.time())}.png"
    image_url = generate_replicate_image(prompt)
    if not image_url:
        logger.error("Failed to generate image URL")
        return None
    img_data = download_image(image_url)
    if img_data is None:
        logger.error("Failed to download image")
        return None
    storage.save_image(safe_filename, img_data)
    logger.info(f"Saved image to storage: {safe_filename}")
    metadata = storage.load_metadata()
    metadata[safe_filename] = {
        "prompt": original_prompt,
        "created_at": datetime.now().isoformat(),
        "model_prompt": prompt,
        "tags": auto_tags(original_prompt),
    }
    storage.save_metadata(metadata)
    logger.info(f"Updated metadata for {safe_filename}")
    return safe_filename
