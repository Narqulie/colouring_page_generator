import { useState } from 'react'
import { ImageModal } from './ImageModal'

export interface ImageItem {
  id: string;
  url: string;
  prompt: string;
  filename: string;
  timestamp: string;
  date: string;
  tags: string[];
}

interface ImageGalleryProps {
  images: ImageItem[];
  onDelete?: (image: ImageItem) => Promise<void>;
  onReroll?: (prompt: string) => void;
  onTagUpdate?: (filename: string, tags: string[]) => Promise<void>;
}

export const ImageGallery = ({
  images,
  onDelete,
  onReroll,
  onTagUpdate,
}: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null)

  const sortedImages = [...images].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleImageClick = (image: ImageItem) => {
    setSelectedImage(image)
  }

  return (
    <>
      <div className="w-full p-5 box-border bg-[#ffffff57] rounded-xl">
        {images.length === 0 ? (
          <p className="text-center text-[#666] text-lg my-10">No images generated yet. Try creating one!</p>
        ) : (
          <div className="grid gap-5 p-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
            {sortedImages.map((image) => (
              <div
                key={image.filename}
                className={`image-item rounded-xl overflow-hidden bg-transparent relative shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-transform duration-200 cursor-pointer aspect-square flex flex-col ${selectedImage === image ? 'shadow-[0_0_0_3px_rgba(64,64,64,0.18)]' : ''} hover:scale-[1.02]`}
                onClick={() => handleImageClick(image)}
              >
                <img
                  src={image.url}
                  alt={image.prompt}
                  loading="lazy"
                  className="w-[101%] h-[101%] rounded-xl object-contain bg-[#f5f5f5] block relative z-0"
                />
                <div className="p-2 pt-7 min-h-[60px] flex flex-col gap-1 absolute bottom-0 left-0 right-0 rounded-b-xl z-1 bg-gradient-to-b from-white/85 to-white/75">
                  <p className="m-0 text-base leading-tight font-medium overflow-hidden line-clamp-2 bg-transparent">
                    {image.prompt}
                  </p>
                  {image.tags.length > 0 && (
                    <p className="m-0 text-xs text-[#888] overflow-hidden text-ellipsis whitespace-nowrap bg-transparent">
                      {image.tags.join(', ')}
                    </p>
                  )}
                  {image.timestamp && (
                    <p className="m-0 text-xs text-[#666] leading-none bg-transparent">
                      {image.timestamp}
                    </p>
                  )}
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
        onTagUpdate={onTagUpdate}
      />
    </>
  )
}
