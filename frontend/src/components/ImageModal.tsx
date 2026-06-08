import { ImageItem } from './imageGallery'
import { translations } from '../translations'

interface ImageModalProps {
  image: ImageItem | null
  onClose: () => void
  onDelete?: (image: ImageItem) => Promise<void>
  onReroll?: (prompt: string) => void
}

export function ImageModal({
  image,
  onClose,
  onDelete,
  onReroll,
}: ImageModalProps) {
  if (!image) return null

  const getFullUrl = (url: string): string => {
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    const fullUrl = url.startsWith('/') ? url : `/${url}`;
    return fullUrl;
  };

  const handleSave = async () => {
    try {
      const sanitizedPrompt = image.prompt
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()
        .slice(0, 50)
      const fileName = `${sanitizedPrompt}.png`
      const fullUrl = getFullUrl(image.url)

      const response = await fetch(fullUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }
      const blob = await response.blob()

      const objectUrl = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()

      URL.revokeObjectURL(objectUrl)
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading image:', error)
      alert('Failed to download image. Please try again.')
    }
  }

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        throw new Error('Failed to open print window')
      }

      const fullUrl = getFullUrl(image.url)

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${image.prompt}</title>
            <style>
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 1.5cm;
                }

                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  min-height: 100vh;
                }

                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                }

                .print-container {
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  page-break-inside: avoid;
                  page-break-after: avoid;
                }

                img {
                  max-width: 100%;
                  max-height: calc(100vh - 3cm);
                  object-fit: contain;
                  display: block;
                }

                .watermark {
                  margin-top: 0.3cm;
                  font-family: Arial, sans-serif;
                  font-size: 9pt;
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
                onerror="console.error('Failed to load image for printing'); window.close();"
                onload="setTimeout(() => {
                  console.log('Image loaded, initiating print...');
                  window.print();
                  setTimeout(() => window.close(), 1000);
                }, 1000);"
              />
              <div class="watermark">
                ${image.prompt}
                <br>
                Generated with ColouringPageGenerator
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
    } catch (error) {
      console.error('Error preparing print window:', error)
      alert('Failed to prepare print window. Please try again.')
    }
  }

  const handleReroll = () => {
    if (!image?.prompt || !onReroll) return
    onReroll(image.prompt)
    onClose()
  }

  const handleDelete = async () => {
    if (!image || !onDelete) return

    if (window.confirm(translations.confirmDelete)) {
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
          maxHeight: '90vh',
          overflowY: 'auto',
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
          style={{ maxHeight: '70vh', objectFit: 'contain' }}
        />
        <div className="modal-details" style={{ flexShrink: 0 }}>
          {image.timestamp && (
            <p className="modal-timestamp">{image.timestamp}</p>
          )}
          <p className="modal-prompt">{image.prompt}</p>
          <div className="modal-actions">
            <button className="modal-button" onClick={handleSave} type="button">
              {translations.saveImage}
            </button>
            <button
              className="modal-button"
              onClick={handlePrint}
              type="button"
            >
              {translations.print}
            </button>
            {onReroll && (
              <button
                className="modal-button"
                onClick={handleReroll}
                type="button"
              >
                {translations.reroll}
              </button>
            )}
            {onDelete && (
              <button
                className="modal-button modal-button-delete"
                onClick={handleDelete}
                type="button"
              >
                {translations.delete}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
