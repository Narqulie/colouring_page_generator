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
    <div className="fixed inset-0 bg-black/75 z-[1000] flex items-center justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-white rounded-lg p-5 relative w-[90%] max-w-[800px] max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button className="absolute top-5 right-7 bg-none border-none text-[42px] cursor-pointer text-[#666] p-1.5 px-2.5 leading-none hover:text-[#333] font-primary" onClick={onClose} aria-label="Close modal">&times;</button>

        <img src={image.url} alt={image.prompt} className="max-w-full max-h-[70vh] object-contain" />

        <div className="mt-4 shrink-0">
          {image.timestamp && (
            <p className="text-center text-sm text-[#666] mb-2">{image.timestamp}</p>
          )}
          <p className="m-0 mb-4 text-2xl text-[#333] text-center px-5">{image.prompt}</p>

          <div className="m-0 mb-3 flex flex-col gap-1.5 items-center">
            {image.tags.length > 0 && (
              <p className="m-0 text-sm text-[#555]">Tags: {image.tags.join(', ')}</p>
            )}
            {isEditingTags ? (
              <div className="flex gap-1.5 items-center flex-wrap justify-center">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags (comma-separated)"
                  className="px-3 py-2 text-sm border border-white/40 rounded-lg bg-white/85 text-[#333] w-auto min-w-[200px] box-border focus:outline-none focus:border-white focus:bg-white"
                />
                <button className="px-3 py-1 text-sm rounded-md border-none bg-gray-200 text-gray-700 cursor-pointer transition-all duration-300 font-primary hover:bg-gray-300" onClick={handleSaveTags}>Save</button>
                <button className="px-3 py-1 text-sm rounded-md border border-gray-300 bg-transparent text-gray-500 cursor-pointer transition-all duration-300 font-primary hover:bg-black/5" onClick={() => setIsEditingTags(false)}>Cancel</button>
              </div>
            ) : (
              onTagUpdate && (
                <button className="px-3 py-1 text-sm rounded-md border border-gray-300 bg-transparent text-gray-500 cursor-pointer transition-all duration-300 font-primary hover:bg-black/5" onClick={startEditingTags}>
                  {image.tags.length > 0 ? 'Edit Tags' : 'Add Tags'}
                </button>
              )
            )}
          </div>

          <div className="flex gap-2.5 mt-4 justify-center flex-wrap">
            <button className="px-4 py-2 rounded-md border-none bg-gray-200/80 text-black cursor-pointer transition-all duration-300 font-primary text-base hover:bg-gray-200" onClick={handleSave} type="button">Save Image</button>
            <button className="px-4 py-2 rounded-md border-none bg-gray-200/80 text-black cursor-pointer transition-all duration-300 font-primary text-base hover:bg-gray-200" onClick={handlePrint} type="button">Print</button>
            {onReroll && (
              <button className="px-4 py-2 rounded-md border-none bg-gray-200/80 text-black cursor-pointer transition-all duration-300 font-primary text-base hover:bg-gray-200" onClick={handleReroll} type="button">Regenerate</button>
            )}
            {onDelete && (
              <button className="px-4 py-2 rounded-md border-none bg-gradient-to-r from-red-400 to-red-500 text-white cursor-pointer transition-all duration-300 font-primary text-base hover:from-red-500 hover:to-red-600" onClick={handleDelete} type="button">Delete</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
