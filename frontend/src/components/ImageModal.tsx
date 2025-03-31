import { ImageItem } from './imageGallery'
import { translations } from '../translations'

interface ImageModalProps {
  image: ImageItem | null
  onClose: () => void
  onDelete?: (image: ImageItem) => Promise<void>
  onReroll?: (prompt: string) => void
  language?: 'en' | 'fi'
}

export function ImageModal({
  image,
  onClose,
  onDelete,
  onReroll,
  language = 'en'
}: ImageModalProps) {
  if (!image) return null

  console.log('ImageModal props:', {
    hasOnReroll: !!onReroll,
    prompt: image.prompt,
  })

  const handleSave = () => {
    try {
      // Use prompt as filename, sanitize it and limit length
      const sanitizedPrompt = image.prompt
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .slice(0, 50)
      const fileName = `${sanitizedPrompt}.webp`

      const fullUrl = image.url.startsWith('http')
        ? image.url
        : `${import.meta.env.VITE_API_URL}${image.url}`

      const link = document.createElement('a')
      link.href = fullUrl
      link.download = fileName
      link.style.display = 'none'

      // Add to document, click, and remove
      document.body.appendChild(link)
      link.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link)
      }, 100)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fullUrl = image.url.startsWith('http') 
      ? image.url 
      : `${import.meta.env.VITE_API_URL}${image.url}`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${image.prompt}</title>
          <style>
            @media print {
              @page {
                size: auto;
                margin: 1cm;
              }
              
              html, body {
                margin: 0;
                padding: 0;
                height: 100%;
              }
              
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              
              .print-container {
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                page-break-inside: avoid;
              }
              
              img {
                max-width: 100%;
                max-height: calc(100vh - 4cm);
                object-fit: contain;
                margin: auto;
              }
              
              .watermark {
                margin-top: 0.5cm;
                font-family: Arial, sans-serif;
                font-size: 10pt;
                color: #666;
                text-align: center;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <img 
              src="${fullUrl}" 
              alt="${image.prompt}"
              onload="setTimeout(function() { window.print(); window.close(); }, 500);"
            />
            <div class="watermark">
              ${image.prompt}
              <br>
              Generated with ColouringPageGenerator
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleReroll = () => {
    if (!image?.prompt || !onReroll) return
    onReroll(image.prompt)
    onClose()
  }

  const handleDelete = async () => {
    if (!image || !onDelete) return

    if (window.confirm(translations[language].confirmDelete)) {
      try {
        await onDelete(image)
        onClose()
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '90vh',  // Limit height to 90% of viewport
          overflowY: 'auto',  // Enable vertical scrolling
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>
        <img 
          src={image.url} 
          alt={image.prompt} 
          className="modal-image" 
          style={{ maxHeight: '70vh', objectFit: 'contain' }}  // Limit image height
        />
        <div className="modal-details" style={{ flexShrink: 0 }}>  {/* Prevent shrinking */}
          {image.timestamp && (
            <p className="modal-timestamp">{image.timestamp}</p>
          )}
          <p className="modal-prompt">{image.prompt}</p>
          <div className="modal-actions">
            <button className="modal-button" onClick={handleSave} type="button">
              {translations[language].saveImage}
            </button>
            <button
              className="modal-button"
              onClick={handlePrint}
              type="button"
            >
              {translations[language].print}
            </button>
            {onReroll && (
              <button
                className="modal-button"
                onClick={handleReroll}
                type="button"
              >
                {translations[language].reroll}
              </button>
            )}
            {onDelete && (
              <button
                className="modal-button modal-button-delete"
                onClick={handleDelete}
                type="button"
              >
                {translations[language].delete}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
