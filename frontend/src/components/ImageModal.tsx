import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ImageItem } from './imageGallery'

interface ImageModalProps {
  image: ImageItem | null
  onClose: () => void
  onDelete?: (image: ImageItem) => Promise<void>
  onReroll?: (prompt: string) => void
  onTagUpdate?: (filename: string, tags: string[]) => Promise<void>
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character] ?? character))

export function ImageModal({
  image,
  onClose,
  onDelete,
  onReroll,
  onTagUpdate,
}: ImageModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const tagInputId = useId()
  const [tagInput, setTagInput] = useState('')
  const [isEditingTags, setIsEditingTags] = useState(false)
  const [isSavingTags, setIsSavingTags] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || !image) return

    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [image])


  if (!image) return null

  const getFullUrl = (url: string): string => {
    if (url.startsWith('http') || url.startsWith('data:')) return url
    return url.startsWith('/') ? url : `/${url}`
  }

  const handleSave = async () => {
    setActionError(null)
    try {
      const sanitizedPrompt = image.prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase().slice(0, 50) || 'colouring_page'
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
    } catch {
      setActionError('The download could not be prepared. Please try again.')
    }
  }

  const handlePrint = () => {
    setActionError(null)
    try {
      const printWindow = window.open('', '_blank')
      if (!printWindow) throw new Error('Failed to open print window')

      const fullUrl = getFullUrl(image.url)
      const safePrompt = escapeHtml(image.prompt || 'Colouring page')
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${safePrompt}</title>
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
                <img src="${escapeHtml(fullUrl)}" alt="${safePrompt}"
                  onerror="window.close();"
                  onload="setTimeout(() => { window.print(); setTimeout(() => window.close(), 1000); }, 1000);"
                />
              </div>
              <div class="watermark">
                ${safePrompt}<br>Generated with Colouring Page Generator
              </div>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
    } catch {
      setActionError('The print view could not be opened. Check that pop-ups are allowed, then try again.')
    }
  }

  const handleReroll = () => {
    if (!image.prompt || !onReroll) return
    onReroll(image.prompt)
    onClose()
  }

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return
    setIsDeleting(true)
    setActionError(null)
    try {
      await onDelete(image)
      onClose()
    } catch {
      setActionError('This page could not be deleted. Please try again.')
      setIsDeleting(false)
    }
  }

  const handleSaveTags = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onTagUpdate || isSavingTags) return

    setIsSavingTags(true)
    setActionError(null)
    try {
      const tags = tagInput.split(',').map((tag) => tag.trim()).filter(Boolean)
      await onTagUpdate(image.filename, tags)
      setIsEditingTags(false)
      setTagInput('')
    } catch {
      setActionError('Tags could not be saved. Please try again.')
    } finally {
      setIsSavingTags(false)
    }
  }

  const startEditingTags = () => {
    setTagInput(image.tags.join(', '))
    setIsEditingTags(true)
    setActionError(null)
  }

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[1000] m-0 size-full max-h-none max-w-none overflow-y-auto overscroll-contain bg-transparent p-4 backdrop:bg-black/75 sm:p-8"
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <article className="mx-auto flex min-h-full w-full max-w-4xl items-center justify-center">
        <div className="relative my-auto w-full overflow-hidden rounded-3xl bg-white p-5 text-[#282236] shadow-2xl sm:p-7">
          <button
            className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full text-2xl leading-none text-[#5b5369] transition-[background-color,color] duration-200 hover:bg-[#f0edf4] hover:text-[#2f1e52]"
            onClick={onClose}
            type="button"
            aria-label="Close image details"
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="pr-12">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#725f92]">Generated page</p>
            <h2 id="modal-title" className="mt-1 text-pretty text-2xl font-bold leading-tight text-[#2f1e52] sm:text-3xl">
              {image.prompt || 'Untitled colouring page'}
            </h2>
            {image.timestamp && <p className="mt-2 text-sm tabular-nums text-[#665e72]">{image.timestamp}</p>}
          </div>

          <img
            src={getFullUrl(image.url)}
            alt={`Generated colouring page: ${image.prompt || 'Untitled'}`}
            width={768}
            height={1024}
            className="mt-5 max-h-[62svh] w-full rounded-2xl bg-[#f6f3f8] object-contain"
          />

          <div className="mt-5 space-y-4">
            {image.tags.length > 0 && !isEditingTags && (
              <p className="text-sm text-[#554e60]">Tags: {image.tags.join(', ')}</p>
            )}

            {isEditingTags ? (
              <form className="rounded-2xl bg-[#f6f3f8] p-4" onSubmit={handleSaveTags}>
                <label htmlFor={tagInputId} className="text-sm font-semibold text-[#40394a]">Tags</label>
                <p className="mt-1 text-sm text-[#665e72]">Separate tags with commas.</p>
                <input
                  id={tagInputId}
                  name="tags"
                  type="text"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="Animals, fantasy, forest…"
                  autoComplete="off"
                  disabled={isSavingTags}
                  className="mt-3 w-full rounded-xl border border-[#cfc7d9] bg-white px-3 py-2 text-sm text-[#282236] placeholder:text-[#797080] disabled:cursor-wait disabled:opacity-65"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-lg bg-[#3d276d] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2f1e52] disabled:cursor-wait disabled:bg-[#716782]" disabled={isSavingTags} type="submit">
                    {isSavingTags ? 'Saving…' : 'Save Tags'}
                  </button>
                  <button className="rounded-lg px-3 py-2 text-sm font-semibold text-[#554e60] transition-colors hover:bg-[#e9e4ed]" disabled={isSavingTags} onClick={() => setIsEditingTags(false)} type="button">
                    Cancel
                  </button>
                </div>
              </form>
            ) : onTagUpdate && (
              <button className="rounded-lg border border-[#cfc7d9] px-3 py-2 text-sm font-semibold text-[#554e60] transition-[background-color,border-color] hover:border-[#9f92b0] hover:bg-[#f6f3f8]" onClick={startEditingTags} type="button">
                {image.tags.length > 0 ? 'Edit Tags' : 'Add Tags'}
              </button>
            )}

            {actionError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">{actionError}</p>}

            {isConfirmingDelete ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-900">Delete this page permanently?</p>
                <p className="mt-1 text-sm text-red-800">This cannot be undone.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-wait disabled:bg-red-400" disabled={isDeleting} onClick={handleDelete} type="button">
                    {isDeleting ? 'Deleting…' : 'Delete Page'}
                  </button>
                  <button className="rounded-lg px-3 py-2 text-sm font-semibold text-red-900 transition-colors hover:bg-red-100" disabled={isDeleting} onClick={() => setIsConfirmingDelete(false)} type="button">
                    Keep Page
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 border-t border-[#e9e4ed] pt-4">
                <button className="rounded-lg bg-[#3d276d] px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,box-shadow] hover:bg-[#2f1e52] hover:shadow-md" onClick={handleSave} type="button">Download PNG</button>
                <button className="rounded-lg border border-[#cfc7d9] px-4 py-2.5 text-sm font-semibold text-[#40394a] transition-[background-color,border-color] hover:border-[#9f92b0] hover:bg-[#f6f3f8]" onClick={handlePrint} type="button">Print Page</button>
                {onReroll && <button className="rounded-lg border border-[#cfc7d9] px-4 py-2.5 text-sm font-semibold text-[#40394a] transition-[background-color,border-color] hover:border-[#9f92b0] hover:bg-[#f6f3f8]" onClick={handleReroll} type="button">Use Prompt Again</button>}
                {onDelete && <button className="ml-auto rounded-lg px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50" onClick={() => setIsConfirmingDelete(true)} type="button">Delete</button>}
              </div>
            )}
          </div>
        </div>
      </article>
    </dialog>
  )
}
