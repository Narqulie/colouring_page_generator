import os
from datetime import datetime
from io import BytesIO
from dotenv import load_dotenv

from src.helpers import log_generated_images

from openai import OpenAI
import requests
from PIL import Image

load_dotenv()
now = datetime.now()

# Get the API key from the environment variables
api_key = os.getenv('OPENAI_API_KEY')

# Check if the API key is set
if not api_key:
    raise Exception('The OPENAI_API_KEY environment variable is not set')

# Set the API key for OpenAI
OpenAI.api_key = api_key
client = OpenAI()


def create_colouring_page(prompt):
    print("create_colouring_page")
    original_prompt = prompt
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
        image_url = response.data[0].url
        # Get the image content
        response = requests.get(image_url)
        # Read the image
        img = Image.open(BytesIO(response.content))
        # Generate a timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Save the image
        filename = os.path.join('images', f"{original_prompt}.png")
        if not os.path.exists('images'):
            os.makedirs('images')
        img.save(filename)
        log_generated_images(filename, prompt)
        return filename
    except Exception as e:
        print(f"An error occurred: {e}")
        return None
