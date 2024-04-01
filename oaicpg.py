from flask import Flask, request, render_template, send_from_directory, redirect, url_for
import os
from datetime import datetime
import requests
from PIL import Image
from io import BytesIO
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
now = datetime.now()

# Get the API key from the environment variables
api_key = os.getenv('OPENAI_API_KEY')

# Check if the API key is set
if not api_key:
    raise Exception('The OPENAI_API_KEY environment variable is not set')

# Set the API key for OpenAI
OpenAI.api_key = api_key
client = OpenAI()


def get_image_filenames():
    print("get_image_filenames")
    """Get a list of image filenames in the 'images' directory."""
    image_dir = os.path.join(app.root_path, 'images')
    if not os.path.exists(image_dir):
        return []
    return [f for f in os.listdir(image_dir) if os.path.isfile(os.path.join(image_dir, f))]


def log_generated_images(file, prompt):
    print("log_generated_images")
    imagestr = f"{now},{file},{prompt}\n"
    with open('generated_images.txt', 'a') as f:
        f.write(imagestr)


def create_colouring_page(prompt):
    print("create_colouring_page")
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
        filename = os.path.join('images', f"image_{timestamp}.png")
        if not os.path.exists('images'):
            os.makedirs('images')
        img.save(filename)
        # Log the generated image
        log_generated_images(filename, prompt)
        # Redirect to refresh the gallery with the new image
        return redirect(url_for('index'))
    except Exception as e:
        print(e)
        # In case of error, redirect to index without updating the gallery
        return redirect(url_for('index'))


@app.route('/', methods=['GET', 'POST'])
def index():
    print("index")
    if request.method == 'POST':
        print("POST")
        prompt = request.form.get('prompt')
        return create_colouring_page(prompt)
    else:
        print("ELSE")
        image_filenames = get_image_filenames()
        return render_template('index.html', image_filenames=image_filenames)


@app.route('/images/<filename>')
def serve_image(filename):
    print("serve_image")
    return send_from_directory('images', filename)


if __name__ == '__main__':
    print("main")
    app.run(debug=True)
