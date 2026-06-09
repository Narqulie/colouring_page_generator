import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Form, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from loguru import logger
from src.generate_image import create_colouring_page
from src.gallery import get_image_filenames
from src.helpers import save_metadata, load_metadata
from src.storage import create_storage
from src.version import __version__
from datetime import datetime
from urllib.parse import unquote

PROJECT_ROOT = Path(__file__).parent
LOG_DIR = PROJECT_ROOT / "logs"
STATIC_DIR = PROJECT_ROOT / "static"

logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG",
    colorize=True,
    backtrace=True,
    diagnose=True,
)
logger.add(
    LOG_DIR / "debug.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG",
    rotation="1 day",
    retention="7 days",
    backtrace=True,
    diagnose=True,
)

LOG_DIR.mkdir(exist_ok=True)
STATIC_DIR.mkdir(exist_ok=True)

logger.info(f"Starting application version {__version__}")
logger.info(f"Python version: {sys.version}")
logger.info(f"Working directory: {PROJECT_ROOT.absolute()}")

storage = create_storage()
app = FastAPI()

is_production = os.getenv("ENVIRONMENT", "development") == "production"
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not is_production else ["*"],
    allow_origin_regex=r"https?://.*\.onrender\.com" if not is_production else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check_old():
    return await health_check()

@app.get("/api/status")
async def health_check():
    return {
        "status": "healthy",
        "version": __version__,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/version")
async def read_root():
    return {"version": __version__}


@app.get("/api/images")
async def get_images(
    tag: str = Query(None, description="Filter by tag"),
    q: str = Query(None, description="Search prompt text"),
):
    logger.info(f"Fetching images (tag={tag}, q={q})")
    try:
        images = get_image_filenames(tag=tag, q=q)
        return {"images": images}
    except Exception as e:
        logger.error(f"Error fetching images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate")
async def generate_image(prompt: str = Form(...)):
    logger.info(f"Generating new image: {prompt}")
    try:
        image_path = create_colouring_page(prompt)
        if not image_path:
            raise HTTPException(status_code=500, detail="Failed to generate image")
        logger.info(f"Image generated successfully: {image_path}")
        return {"image_path": image_path}
    except Exception as e:
        logger.error(f"Error generating image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/{image_name}")
async def get_image(image_name: str):
    logger.info(f"Serving image: {image_name}")
    data = storage.get_image(image_name)
    if data is None:
        logger.error(f"Image not found: {image_name}")
        raise HTTPException(status_code=404, detail="Image not found")
    return Response(content=data, media_type="image/png")


@app.delete("/api/images/{image_name}")
async def delete_image(image_name: str):
    decoded_name = unquote(image_name)
    logger.info(f"Deleting image: {decoded_name}")
    try:
        data = storage.get_image(decoded_name)
        if data is None:
            raise HTTPException(status_code=404, detail="Image not found")
        storage.delete_image(decoded_name)
        metadata = load_metadata()
        if decoded_name in metadata:
            del metadata[decoded_name]
            save_metadata(metadata)
        return {"message": "Image deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/images/{image_name}")
async def update_image(image_name: str, tags: str = Form(default="")):
    decoded_name = unquote(image_name)
    logger.info(f"Updating image tags: {decoded_name}")
    try:
        metadata = load_metadata()
        if decoded_name not in metadata:
            raise HTTPException(status_code=404, detail="Image not found")
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        metadata[decoded_name]["tags"] = tag_list
        save_metadata(metadata)
        return {"message": "Tags updated", "tags": tag_list}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tags")
async def get_all_tags():
    logger.info("Fetching all tags")
    try:
        metadata = load_metadata()
        all_tags = set()
        for entry in metadata.values():
            all_tags.update(entry.get("tags", []))
        return {"tags": sorted(all_tags)}
    except Exception as e:
        logger.error(f"Error fetching tags: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/{full_path:path}")
async def serve_spa(full_path: str, request: Request):
    logger.debug(f"Full request path: {full_path}")
    if full_path.startswith("undefined/"):
        full_path = full_path[10:]
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")
    static_path = STATIC_DIR / full_path
    if static_path.is_file():
        return FileResponse(str(static_path))
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        logger.error("Frontend build missing! No static/index.html found")
        raise HTTPException(status_code=500, detail="Frontend build not found")
    return FileResponse(str(index_path))


@app.on_event("startup")
async def startup_event():
    if not STATIC_DIR.exists():
        logger.error("Static directory not found!")
        return
    files = list(STATIC_DIR.rglob("*"))
    logger.info(f"Static directory contents ({len(files)} files):")
    for file in files:
        if file.is_file():
            logger.info(f"  - {file.relative_to(STATIC_DIR)}")
        else:
            logger.info(f"  - {file.relative_to(STATIC_DIR)}/")


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting development server")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True, log_level="debug")
