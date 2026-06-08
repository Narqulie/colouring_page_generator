import { useState } from 'react'
import { ImageModal } from './ImageModal'

export interface ImageItem {
  id: string;
  url: string;
  prompt: string;
  filename: string;
  timestamp: string;
  date: string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  onDelete?: (image: ImageItem) => Promise<void>;
  onReroll?: (prompt: string) => void;
  isLoading?: boolean;
}

export const ImageGallery = ({
  images,
  onDelete,
  onReroll,
}: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)

  // Sort images by timestamp (newest first)
  const sortedImages = [...images].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image)
  }

  return (
    <>
      <div className="gallery-container">
        {images.length === 0 ? (
          <p className="no-images">No images generated yet. Try creating one!</p>
        ) : (
          <div className="image-grid">
            {sortedImages.map((image) => (
              <div
                key={image.filename}
                className={`image-item ${
                  selectedImage === image ? 'selected' : ''
                }`}
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.url}
                  alt={image.prompt}
                  loading="lazy"
                />
                <div className="image-details">
                  <p className="image-prompt">{image.prompt}</p>
                  {image.timestamp && <p className="image-timestamp">{image.timestamp}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDelete={onDelete}
        onReroll={onReroll}
      />
    </>
  )
}
