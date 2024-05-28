import os


def get_image_filenames(app):
    print("get_image_filenames")
    """Get a list of image filenames in the 'images' directory."""
    image_dir = os.path.join(app.root_path, 'images')
    if not os.path.exists(image_dir):
        return []
    return [f for f in os.listdir(image_dir) if os.path.isfile(os.path.join(image_dir, f))]
