from flask import Flask, request, render_template, send_from_directory, flash, redirect, url_for
from src.gallery import get_image_filenames
from src.generate_image import create_colouring_page
import os

images_folder = 'images'
app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')

@app.route('/')
def index():
    image_filenames = get_image_filenames(app)
    return render_template('index.html', image_filenames=image_filenames)


@app.route('/generate', methods=['POST'])
def generate():
    prompt = request.form['prompt']
    print(f"prompt: {prompt}")
    if not prompt or prompt.strip() == "":
        print("No prompt")
        flash('Prompt cannot be empty!', 'error')
        return redirect(url_for('index'))
    create_colouring_page(prompt)
    return redirect(url_for('index'))


@app.route('/images/<filename>')
def serve_image(filename):
    print("serve_image")
    return send_from_directory(images_folder, filename)


if __name__ == '__main__':
    app.run(debug=True)
