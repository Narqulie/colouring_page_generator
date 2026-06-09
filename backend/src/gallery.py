from loguru import logger
from typing import List, Dict, Optional
from .storage import create_storage

storage = create_storage()


def get_image_filenames(
    tag: Optional[str] = None,
    q: Optional[str] = None,
) -> List[Dict]:
    logger.info(f"Getting image list (tag={tag}, q={q})")
    metadata = storage.load_metadata()
    filenames = storage.list_images()
    results = []
    for filename in filenames:
        entry = metadata.get(filename, {})
        if tag:
            image_tags = entry.get("tags", [])
            if tag not in image_tags:
                continue
        if q:
            prompt = (entry.get("prompt", "") or "").lower()
            if q.lower() not in prompt:
                continue
        results.append({
            "filename": filename,
            "url": f"images/{filename}",
            "prompt": entry.get("prompt", ""),
            "date": entry.get("created_at", ""),
            "tags": entry.get("tags", []),
        })
    logger.info(f"Found {len(results)} images")
    return results
