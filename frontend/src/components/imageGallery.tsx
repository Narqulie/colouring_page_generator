import { useRef, useState } from 'react'
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
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const sortedImages = [...images].sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const handleImageClick = (image: ImageItem, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger
    setSelectedImage(image)
  }

  const handleClose = () => {
    setSelectedImage(null)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <>
      <div className="w-full rounded-2xl border border-white/22 bg-[#21182f]/28 p-3 shadow-[0_12px_40px_rgb(20_12_35/22%)] backdrop-blur-sm sm:p-5">
        {images.length === 0 ? (
          <div className="mx-auto my-8 max-w-md rounded-2xl border border-[#fff8ea]/55 bg-[#fff6e8]/94 px-6 py-10 text-center shadow-[0_10px_25px_rgb(20_12_35/18%)]">
            <p className="text-lg font-semibold text-[#38284a]">Your gallery is ready for its first page.</p>
            <p className="mt-2 text-sm leading-6 text-[#65566f]">Use the prompt above to create a printable colouring page.</p>
          </div>
        ) : (
          <ul id="gallery-list" className="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Generated colouring pages">
            {sortedImages.map((image, index) => (
              <li
                key={image.filename}
                className="min-w-0"
                style={{ contentVisibility: 'auto', containIntrinsicSize: '360px 480px' }}
              >
                <button
                  type="button"
                  className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#f6f3f8] text-left shadow-[0_3px_10px_rgb(36_24_58/18%)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgb(36_24_58/24%)] focus-visible:ring-3 focus-visible:ring-white/90 focus-visible:ring-offset-3 focus-visible:ring-offset-[#6a527d]"
                  onClick={(event) => handleImageClick(image, event.currentTarget)}
                  aria-label={`Open ${image.prompt || 'generated colouring page'}`}
                >
                  <img
                    src={image.url}
                    alt=""
                    width={768}
                    height={1024}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transition-none"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17111fe6] via-[#17111fa6] to-transparent px-3 pb-3 pt-12 text-white">
                    <p className="line-clamp-2 text-sm font-semibold leading-5">{image.prompt || 'Untitled colouring page'}</p>
                    {image.tags.length > 0 && (
                      <p className="mt-1 truncate text-xs text-white/78">{image.tags.join(', ')}</p>
                    )}
                    {image.timestamp && (
                      <p className="mt-1 text-xs tabular-nums text-white/70">{image.timestamp}</p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ImageModal
        key={selectedImage?.filename ?? 'no-selected-image'}
        image={selectedImage}
        onClose={handleClose}
        onDelete={onDelete}
        onReroll={onReroll}
        onTagUpdate={onTagUpdate}
      />
    </>
  )
}
