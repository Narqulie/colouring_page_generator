from flask import Flask, request, render_template, send_from_directory, flash, redirect, url_for
from src.gallery import get_image_filenames
from src.generate_image import create_colouring_page
import os
from loguru import logger

logger.add("logs/debug.log", level="DEBUG", rotation="10 MB", compression="zip")


images_folder = 'images'
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

@app.route('/')
def index():
    logger.info("Running index route, returning index.html")
    logger.info("Calling ger_image_filenames for gallery files list")
    image_filenames = get_image_filenames(app)
    return render_template('index.html', image_filenames=image_filenames)


@app.route('/generate', methods=['POST'])
def generate():
    logger.info("Running generate route (Generate button clicked)")
    prompt = request.form['prompt']
    logger.info(f"Prompt in frontend: {prompt}")
    if not prompt or prompt.strip() == "":
        logger.error("Prompt cannot be empty!")
        flash('Prompt cannot be empty!', 'error')
        return redirect(url_for('index'))
    logger.info("Calling create_colouring_page function")
    create_colouring_page(prompt)
    logger.info("Generated image successfully")
    logger.info("Redirecting to index route")
    return redirect(url_for('index'))


@app.route('/surprise', methods=['POST'])
def surprise():
    logger.info("Running surprise route (Surprise me! button clicked)")
    prompt = "Surprise me!"
    logger.info(f"Prompt in frontend: {prompt}")
    logger.info("Calling create_colouring_page function")
    create_colouring_page(prompt)
    logger.info("Generated image successfully")
    logger.info("Redirecting to index route")
    return redirect(url_for('index'))


@app.route('/images/<filename>')
def serve_image(filename):
    logger.info("Running serve_image route, gallery image clicked")
    logger.info(f"Filename: {filename}")
    return send_from_directory(images_folder, filename)


if __name__ == '__main__':
    logger.info("Running app")
    app.run(debug=True, host='0.0.0.0')
