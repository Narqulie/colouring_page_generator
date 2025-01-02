from fastapi import FastAPI, HTTPException, Form
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from src.gallery import get_image_filenames
from src.generate_image import create_colouring_page
import os
from loguru import logger
from datetime import datetime
import json
from pathlib import Path
from src.version import VERSION

# Configure logger
logger.add("logs/debug.log", level="DEBUG", rotation="10 MB", compression="zip")

# Define the images folder path
images_folder = "images"
os.makedirs(images_folder, exist_ok=True)

# Define metadata file path
METADATA_FILE = Path(images_folder) / "metadata.json"

app = FastAPI(title="Colouring Page Generator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://colouring-page-generator.onrender.com",
        "localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],  # Only specify the methods you actually use
    allow_headers=["Content-Type", "Authorization"],  # Only specify the headers you need
    max_age=3600,  # Cache the CORS response for 1 hour
)

def save_metadata(filename: str, prompt: str):
    """Save image metadata to JSON file."""
    metadata = {}
    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r") as f:
            metadata = json.load(f)
    
    metadata[filename] = {
        "prompt": prompt,
        "created_at": datetime.now().isoformat()
    }
    
    with open(METADATA_FILE, "w") as f:
        json.dump(metadata, f, indent=2)

def get_metadata():
    """Read image metadata from JSON file."""
    if METADATA_FILE.exists():
        with open(METADATA_FILE, "r") as f:
            return json.load(f)
    return {}

@app.get("/api/images")
async def get_images():
    """Get all images in the gallery with their metadata."""
    try:
        logger.info("Fetching images list")
        images = []
        metadata = get_metadata()
        
        # Use the updated get_image_filenames function
        image_files = get_image_filenames(images_folder)
        
        for filename in image_files:
            file_path = Path(images_folder) / filename
            file_date = datetime.fromtimestamp(file_path.stat().st_mtime)
            
            image_data = {
                "filename": filename,
                "date": file_date.isoformat(),
                "url": f"/api/images/{filename}",
                "prompt": metadata.get(filename, {}).get("prompt", "No prompt available")
            }
            images.append(image_data)

        images.sort(key=lambda x: x["date"], reverse=True)
        logger.info(f"Successfully retrieved {len(images)} images")
        return {"images": images}
    except Exception as e:
        logger.error(f"Error fetching images: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch images")

@app.post("/api/generate")
async def generate(prompt: str = Form(...)):
    """Generate a new colouring page."""
    logger.info(f"Generating image with prompt: {prompt}")
    
    if not prompt or prompt.strip() == "":
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Create a filename that includes timestamp and a shortened prompt
        safe_prompt = "".join(c for c in prompt[:30] if c.isalnum() or c in (' ', '-', '_')).strip()
        safe_prompt = safe_prompt.replace(' ', '_')
        filename = f"{timestamp}_{safe_prompt}.png"
        
        result = create_colouring_page(prompt, output_filename=filename)
        if result:
            # Save metadata
            save_metadata(filename, prompt)
            
            return {
                "success": True,
                "filename": filename,
                "url": f"/api/images/{filename}"
            }
        raise HTTPException(status_code=500, detail="Failed generating image")
    except Exception as e:
        logger.error(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/images/{image_name}")
async def serve_image(image_name: str):
    """Serve an image file with download headers."""
    logger.info(f"Serving image: {image_name}")
    file_path = os.path.join(images_folder, image_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(
        path=file_path,
        filename=image_name,  # Specify the filename
        media_type='image/png',  # Specify the media type
        headers={
            "Content-Disposition": f"attachment; filename={image_name}",
            "Access-Control-Expose-Headers": "Content-Disposition, Content-Type"
        }
    )

@app.delete("/api/images/{filename}")
async def delete_image(filename: str):
    """Delete an image file and its metadata."""
    try:
        file_path = os.path.join(images_folder, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
            # Remove from metadata
            metadata = get_metadata()
            if filename in metadata:
                del metadata[filename]
                with open(METADATA_FILE, "w") as f:
                    json.dump(metadata, f, indent=2)
                    
            logger.info(f"Deleted image and metadata: {filename}")
            return {"success": True}
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        logger.error(f"Error deleting image {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": VERSION}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
