import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger
from src.generate_image import create_colouring_page
from src.gallery import get_image_filenames
from src.helpers import save_metadata, load_metadata
from src.version import __version__
from datetime import datetime
from urllib.parse import unquote

# Get the project root directory
PROJECT_ROOT = Path(__file__).parent
LOG_DIR = PROJECT_ROOT / "logs"
IMAGES_DIR = PROJECT_ROOT / "images"
METADATA_FILE = PROJECT_ROOT / "image_metadata.json"

# Configure logging
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG",
    colorize=True,
    backtrace=True,
    diagnose=True
)
logger.add(
    LOG_DIR / "debug.log",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level="DEBUG",
    rotation="1 day",
    retention="7 days",
    backtrace=True,
    diagnose=True
)

# Ensure directories exist
LOG_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)

# Log startup information
logger.info(f"🚀 Starting application version {__version__}")
logger.info(f"🐍 Python version: {sys.version}")
logger.info(f"📂 Working directory: {PROJECT_ROOT.absolute()}")
logger.info(f"📁 Images directory: {IMAGES_DIR.absolute()}")
logger.info(f"📄 Metadata file: {METADATA_FILE.absolute()}")

app = FastAPI()

# Configure CORS based on environment
is_production = os.getenv("ENVIRONMENT", "development") == "production"
allowed_origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:8000",  # Backend dev server
    "https://*.onrender.com", # Render domains
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if not is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def read_root():
    """Root endpoint returning API version"""
    logger.info("🌐 Root endpoint accessed")
    return {"version": __version__}

@app.get("/images")
async def get_images():
    """Get list of available images"""
    logger.info("📸 Fetching available images")
    try:
        images = get_image_filenames(str(IMAGES_DIR))
        logger.info(f"✅ Found {len(images)} images")
        return {"images": images}
    except Exception as e:
        logger.error(f"❌ Error fetching images: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate")
async def generate_image(
    prompt: str = Form(...),
    language: str = Form("en"),
    complexity: str = Form("medium"),
    theme: str = Form("none")
):
    """Generate a new coloring page"""
    logger.info(f"🎨 Generating new image with prompt: {prompt} in language: {language}, complexity: {complexity}, theme: {theme}")
    try:
        image_path = create_colouring_page(prompt, language, complexity, theme)
        if not image_path:
            raise HTTPException(status_code=500, detail="Failed to generate image")
            
        logger.info(f"✅ Image generated successfully: {image_path}")
        
        # Update metadata
        metadata = load_metadata(str(METADATA_FILE))
        metadata[image_path] = {
            "prompt": prompt,
            "language": language,
            "complexity": complexity,
            "theme": theme,
            "created_at": str(datetime.now().isoformat())
        }
        save_metadata(metadata, str(METADATA_FILE))
        logger.info("💾 Metadata updated")
        
        return {"image_path": image_path}
    except Exception as e:
        logger.error(f"❌ Error generating image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/images/{image_name}")
async def get_image(image_name: str):
    """Serve an image file"""
    logger.info(f"🖼️ Serving image: {image_name}")
    image_path = IMAGES_DIR / image_name
    if not image_path.exists():
        logger.error(f"❌ Image not found: {image_path}")
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(str(image_path))

@app.delete("/images/{image_name}")
async def delete_image(image_name: str):
    """Delete an image"""
    # Decode the URL-encoded filename
    decoded_name = unquote(image_name)
    logger.info(f"🗑️ Deleting image: {decoded_name}")
    try:
        image_path = IMAGES_DIR / decoded_name
        if not image_path.exists():
            logger.error(f"❌ Image not found: {image_path}")
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_path.unlink()
        logger.info(f"✅ Image deleted: {image_path}")
        
        # Update metadata
        metadata = load_metadata(str(METADATA_FILE))
        if decoded_name in metadata:
            del metadata[decoded_name]
            save_metadata(metadata, str(METADATA_FILE))
            logger.info("💾 Metadata updated")
        
        return {"message": "Image deleted successfully"}
    except Exception as e:
        logger.error(f"❌ Error deleting image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Mount static files AFTER all other routes
app.mount("/static", StaticFiles(directory=str(IMAGES_DIR)), name="static")

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting development server")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug"
    )
