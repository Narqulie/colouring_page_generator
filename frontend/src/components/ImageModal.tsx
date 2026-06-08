import { useState } from 'react'
import { ImageItem } from './imageGallery'

interface ImageModalProps {
  image: ImageItem | null
  onClose: () => void
  onDelete?: (image: ImageItem) => Promise<void>
  onReroll?: (prompt: string) => void
  onTagUpdate?: (filename: string, tags: string[]) => Promise<void>
}

export function ImageModal({
  image,
  onClose,
  onDelete,
  onReroll,
  onTagUpdate,
}: ImageModalProps) {
  const [tagInput, setTagInput] = useState('')
  const [isEditingTags, setIsEditingTags] = useState(false)

  if (!image) return null

  const getFullUrl = (url: string): string => {
    if (url.startsWith('http') || url.startsWith('data:')) return url
    return url.startsWith('/') ? url : `/${url}`
  }

  const handleSave = async () => {
    try {
      const sanitizedPrompt = image.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 50)
      const fileName = `${sanitizedPrompt}.png`
      const response = await fetch(getFullUrl(image.url))
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
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
                @page { margin: 1cm; }
                html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
                body { display: flex; align-items: center; justify-content: center; }
                .print-container { width: 100%; height: 100%; display: flex; flex-direction: column; page-break-inside: avoid; }
                .image-wrapper { flex: 1; min-height: 0; display: flex; }
                img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; margin: auto; }
                .watermark { flex-shrink: 0; padding-top: 0.4cm; font-family: Arial, sans-serif; font-size: 9pt; color: #666; text-align: center; }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              <div class="image-wrapper">
                <img src="${fullUrl}" alt="${image.prompt}"
                  onerror="console.error('Failed to load image for printing'); window.close();"
                  onload="setTimeout(() => { window.print(); setTimeout(() => window.close(), 1000); }, 1000);"
                />
              </div>
              <div class="watermark">
                ${image.prompt}
                <br>Generated with ColouringPageGenerator
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
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await onDelete(image)
        onClose()
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }
  }

  const handleSaveTags = async () => {
    if (!onTagUpdate) return
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    await onTagUpdate(image.filename, tags)
    setIsEditingTags(false)
    setTagInput('')
  }

  const startEditingTags = () => {
    setTagInput(image.tags.join(', '))
    setIsEditingTags(true)
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close modal">&times;</button>

        <img src={image.url} alt={image.prompt} className="modal-image"
          style={{ maxHeight: '70vh', objectFit: 'contain' }}
        />

        <div className="modal-details" style={{ flexShrink: 0 }}>
          {image.timestamp && <p className="modal-timestamp">{image.timestamp}</p>}
          <p className="modal-prompt">{image.prompt}</p>

          <div className="modal-tags">
            {image.tags.length > 0 && (
              <p className="modal-tags-display">Tags: {image.tags.join(', ')}</p>
            )}
            {isEditingTags ? (
              <div className="modal-tags-edit">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags (comma-separated)"
                  className="tag-input"
                />
                <button className="modal-button modal-button-small" onClick={handleSaveTags}>Save</button>
                <button className="modal-button modal-button-small modal-button-ghost" onClick={() => setIsEditingTags(false)}>Cancel</button>
              </div>
            ) : (
              onTagUpdate && (
                <button className="modal-button modal-button-small modal-button-ghost" onClick={startEditingTags}>
                  {image.tags.length > 0 ? 'Edit Tags' : 'Add Tags'}
                </button>
              )
            )}
          </div>

          <div className="modal-actions">
            <button className="modal-button" onClick={handleSave} type="button">Save Image</button>
            <button className="modal-button" onClick={handlePrint} type="button">Print</button>
            {onReroll && (
              <button className="modal-button" onClick={handleReroll} type="button">Regenerate</button>
            )}
            {onDelete && (
              <button className="modal-button modal-button-delete" onClick={handleDelete} type="button">Delete</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
