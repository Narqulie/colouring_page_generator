from fastapi import FastAPI, Request, Response, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse, FileResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from src.gallery import get_image_filenames
from src.generate_image import create_colouring_page
import os
from loguru import logger
from datetime import datetime
from typing import Optional
from pathlib import Path
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import Response
from src.version import VERSION

logger.add("logs/debug.log", level="DEBUG", rotation="10 MB", compression="zip")

# Define the images folder path
images_folder = "images"

# Create images folder if it doesn't exist
os.makedirs(images_folder, exist_ok=True)

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key="your-secret-key-here")

# Create static folder if it doesn't exist
static_dir = Path("static")
if not static_dir.exists():
    logger.info("Creating static directory")
    static_dir.mkdir(parents=True, exist_ok=True)

# Mount static files
try:
    app.mount("/static", StaticFiles(directory="static"), name="static")
    logger.info("Successfully mounted static files")
except Exception as e:
    logger.error(f"Failed to mount static files: {e}")
    raise


def flash(request: Request, message: str, category: str = "info"):
    """Add a flash message to the session."""
    if "_messages" not in request.session:
        request.session["_messages"] = []
    request.session["_messages"].append({"message": message, "category": category})


def get_flashed_messages(request: Request = None, with_categories: bool = True):
    """Get and clear flash messages from the session.
    
    Args:
        request: The request object (optional)
        with_categories: Whether to return message categories
    
    Returns:
        List of messages, optionally with categories
    """
    if request is None:
        return []
        
    messages = request.session.pop("_messages") if "_messages" in request.session else []
    if with_categories:
        return messages
    return [m["message"] for m in messages]


# Verify templates directory exists
templates_dir = Path("templates")
if not templates_dir.exists():
    logger.warning("Templates directory not found, creating it")
    templates_dir.mkdir(parents=True, exist_ok=True)

templates = Jinja2Templates(directory="templates")
templates.env.globals["get_flashed_messages"] = get_flashed_messages


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """
    Render the index page with a gallery of images.
    """
    logger.info("Accessing index route")
    images = []

    # Check if images folder exists and create if needed
    if not os.path.exists(images_folder):
        logger.warning("Images folder not found, creating it")
        os.makedirs(images_folder)

    for filename in os.listdir(images_folder):
        if filename.endswith((".png", ".jpg", ".jpeg")):
            file_path = os.path.join(images_folder, filename)
            file_date = datetime.fromtimestamp(os.path.getmtime(file_path))
            images.append({"filename": filename, "date": file_date})

    # Sort images by date, newest first
    images.sort(key=lambda x: x["date"], reverse=True)

    return templates.TemplateResponse(
        "index.html", 
        {
            "request": request, 
            "images": images,
            "version": VERSION
        }
    )


@app.post("/generate")
async def generate(request: Request, prompt: str = Form(...)):
    """
    Generate a new colouring page based on user input.
    """
    logger.info("Running generate route (Generate button clicked)")
    logger.info(f"Prompt in frontend: {prompt}")
    
    if not prompt or prompt.strip() == "":
        return JSONResponse(
            status_code=400,
            content={"error": "Prompt cannot be empty!"}
        )

    try:
        logger.info("Calling create_colouring_page function")
        result = create_colouring_page(prompt)
        if result:
            return RedirectResponse(url="/", status_code=303)
        else:
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to generate image"}
            )
    except Exception as e:
        logger.error(f"Error generating image: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/surprise")
async def surprise():
    """
    Generate a surprise colouring page.
    """
    logger.info("Running surprise route (Surprise me! button clicked)")
    
    try:
        logger.info("Calling create_colouring_page function with surprise prompt")
        result = create_colouring_page("Surprise me!")
        if result:
            return RedirectResponse(url="/", status_code=303)
        else:
            return JSONResponse(
                status_code=500,
                content={"error": "Failed to generate surprise image"}
            )
    except Exception as e:
        logger.error(f"Error generating surprise image: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get("/images/{filename}")
async def serve_image(filename: str):
    """
    Serve an image file from the images folder.
    """
    logger.info(f"Serving image: {filename}")
    file_path = os.path.join(images_folder, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(file_path)


@app.get("/logs", response_class=HTMLResponse)
async def show_logs(request: Request):
    """
    Display the application logs.
    """
    logger.info("Running show_logs route")
    try:
        with open("logs/debug.log", "r") as file:
            log_content = file.read()
    except Exception as e:
        logger.error(f"Failed to read log file: {e}")
        log_content = "Failed to read log file."

    return templates.TemplateResponse(
        "log.html", {"request": request, "log_content": log_content}
    )


@app.post("/delete/{filename}")
async def delete_image(filename: str):
    """
    Delete an image file.
    """
    try:
        file_path = os.path.join(images_folder, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted image: {filename}")
            return JSONResponse(content={"success": True})
        else:
            logger.warning(f"File not found: {filename}")
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        logger.error(f"Error deleting image {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    logger.info("Starting the application")
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
