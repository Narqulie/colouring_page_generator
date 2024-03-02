from flask import Flask, request, send_file
from openai import OpenAI
from PIL import Image
import requests
from io import BytesIO
from datetime import datetime
import os


OpenAI.api_key = "XXXX"
client = OpenAI()


def generate_image(prompt):
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=f"""Create a colouring page for children with the following prompt:
            {prompt}.
            Use black and white only. The image should be happy and fun, never scary or violent.
            Do not use any characters or text or speech bubbles in the picture.
            """,
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
        filename = f"image_{timestamp}.png"
        img.save(filename)
        return filename
    except Exception as e:
        print(f"Error generating image: {e}")


def get_prompt():
    prompt = input("What would you like to draw? ")
    return prompt


def open_file(filename):
    try:
        # Open the image file
        img = Image.open(filename)
        # Display the image
        img.show()
    except Exception as e:
        print(f"Error opening file: {e}")


def main():
    prompt = get_prompt()
    file = generate_image(prompt)
    open_file(file)


if __name__ == "__main__":
    main()
