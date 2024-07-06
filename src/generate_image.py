import os
from datetime import datetime
from io import BytesIO
from dotenv import load_dotenv
from loguru import logger

from src.helpers import log_generated_images

from openai import OpenAI
import requests
from PIL import Image

logger.info("Running generate_image.py")
logger.info("Loading environment variables")
load_dotenv()
now = datetime.now()
logger.info("Environment variables loaded")

logger.info("Setting up OpenAI API")
# Get the API key from the environment variables
api_key = os.getenv('OPENAI_API_KEY')
# Check if the API key is set
if not api_key:
    logger.exception('The OPENAI_API_KEY environment variable is not set')
# Set the API key for OpenAI
OpenAI.api_key = api_key
client = OpenAI()
logger.info("OpenAI API setup complete")

def create_colouring_page(prompt):
    logger.info("Creating a coloring page")
    original_prompt = prompt
    logger.info(f"Prompt: {prompt}")
    if prompt == "Surprise me!":
        logger.info("Prompt is 'Surprise me!', generating a random coloring page")
        prompt = "An engaging coloring page for children. The theme could be anything that children would enjoy coloring in. The image should be detailed and intricate, with a lot of different elements to color in."
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=f"""
            Generate a coloring page for children.
            The coloring page should be based on the prompt: {prompt}.
            Do not add to the prompt, use only it as a basis for the image.
            The image should always be black and white.
            The image should be friendly and safe, never scary or violent.
            The image should be detailed and intricate, with a lot of different elements to color in.""",
            size="1024x1024",
            quality="standard",
            n=1,
        )
        logger.info("Image generated successfully")

        image_url = response.data[0].url
        # Get the image content
        response = requests.get(image_url)
        logger.info("Image content retrieved successfully")
        # Read the image
        img = Image.open(BytesIO(response.content))
        logger.info("Image opened successfully")
        # Generate a timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Save the image
        filename = os.path.join('images', f"{original_prompt}.png")
        logger.info(f"Saving the image to {filename}")

        if not os.path.exists('images'):
            logger.warning("The 'images' directory does not exist, creating it")
            os.makedirs('images')

        img.save(filename)
        logger.info("Image saved successfully")
        logger.info("Logging the generated image")
        log_generated_images(filename, prompt)
        
        return filename
    except Exception as e:
        logger.exception(f"An error occurred while generating the coloring page: {e}")
        return None
