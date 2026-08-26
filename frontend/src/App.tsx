import { useState, useEffect, useRef, useCallback } from 'react'
import { PromptForm } from './components/promptForm'
import { ImageGallery } from './components/imageGallery'
import { Footer } from './components/Footer'
import { SearchBar } from './components/SearchBar'
import './App.css'
import { useServerTheme } from './hooks/useServerTheme'
import { useHealthCheck } from './hooks/useHealthCheck'

interface Image {
  filename: string
  date: string
  url: string
  prompt?: string
  tags?: string[]
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<Image[]>([])
  const [prompt, setPrompt] = useState('')
  const [searchQuery, setSearchQuery] = useState(() => new URLSearchParams(window.location.search).get('q') ?? '')
  const [activeTag, setActiveTag] = useState(() => new URLSearchParams(window.location.search).get('tag'))
  const [allTags, setAllTags] = useState<string[]>([])

  const API_URL = import.meta.env.VITE_API_URL || '/api'
  const timeTheme = useServerTheme(API_URL)
  const { health, error: healthError } = useHealthCheck(API_URL)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', timeTheme.browserColor)
  }, [timeTheme.browserColor])

  const fetchImages = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      if (activeTag) params.set('tag', activeTag)
      const qs = params.toString()
      const response = await fetch(`${API_URL}/images${qs ? `?${qs}` : ''}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setImages(data.images || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load images from gallery'
      setError(errorMessage)
      console.error('Error fetching images:', err)
      setImages([])
    }
  }, [searchQuery, activeTag, API_URL])

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tags`)
      if (response.ok) {
        const data = await response.json()
        setAllTags(data.tags || [])
      }
    } catch {
      // tags are optional
    }
  }, [API_URL])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchImages()
  }, [fetchImages])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTags()
  }, [fetchTags])

  useEffect(() => {
    const restoreGalleryFilters = () => {
      const params = new URLSearchParams(window.location.search)
      setSearchQuery(params.get('q') ?? '')
      setActiveTag(params.get('tag'))
    }

    window.addEventListener('popstate', restoreGalleryFilters)
    return () => window.removeEventListener('popstate', restoreGalleryFilters)
  }, [])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (searchQuery) url.searchParams.set('q', searchQuery)
    else url.searchParams.delete('q')
    if (activeTag) url.searchParams.set('tag', activeTag)
    else url.searchParams.delete('tag')
    window.history.replaceState(null, '', url)
  }, [searchQuery, activeTag])

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true)
    setGenerationStatus('Sending your idea to the illustrator…')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('prompt', prompt)

      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment.')
        }
        const detail = await response.json().catch(() => ({}))
        throw new Error(detail.detail || `Generation failed: ${response.status}`)
      }

      const { prediction_id } = await response.json()
      setGenerationStatus('Creating the line art…')

      await pollPrediction(prediction_id, (status) => {
        const messages: Record<string, string> = {
          starting: 'Preparing the canvas…',
          processing: 'Drawing your page…',
          succeeded: 'Saving your colouring page…',
          completed: 'Saving your colouring page…',
        }
        setGenerationStatus(messages[status] ?? 'Creating your page…')
      })

      setGenerationStatus('Updating your gallery…')
      await fetchImages()
      await fetchTags()
      setPrompt('')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image'
      setError(errorMessage)
      console.error('Error generating image:', err)
      setTimeout(() => setError(null), 10000)
      throw err
    } finally {
      setIsLoading(false)
      setGenerationStatus(null)
    }
  }

  const pollPrediction = async (
    predictionId: string,
    onStatusChange: (status: string) => void,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const res = await fetch(`${API_URL}/generate/${predictionId}`)
          if (!res.ok) {
            clearInterval(pollRef.current!)
            reject(new Error('Failed to poll generation status'))
            return
          }
          const data = await res.json()

          onStatusChange(data.status)

          switch (data.status) {
            case 'completed':
              clearInterval(pollRef.current!)
              resolve('completed')
              break
            case 'succeeded':
              clearInterval(pollRef.current!)
              resolve('completed')
              break
            case 'failed':
              clearInterval(pollRef.current!)
              reject(new Error(data.error || 'Generation failed'))
              break
            case 'starting':
            case 'processing':
              break
          }
        } catch (err) {
          clearInterval(pollRef.current!)
          reject(err)
        }
      }

      poll()
      pollRef.current = setInterval(poll, 2000)
    })
  }

  const handleDelete = async (image: Image) => {
    try {
      const response = await fetch(`${API_URL}/images/${image.filename}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete image')
      }
      await fetchImages()
      await fetchTags()
    } catch (err) {
      setError('Failed to delete image')
      console.error('Error deleting image:', err)
      throw err
    }
  }

  const handleReroll = (prompt: string) => {
    setPrompt(prompt)
  }

  const handleTagUpdate = async (filename: string, tags: string[]) => {
    const formData = new FormData()
    formData.append('tags', tags.join(','))
    const response = await fetch(`${API_URL}/images/${filename}`, {
      method: 'PATCH',
      body: formData,
    })
    if (response.ok) {
      await fetchImages()
      await fetchTags()
    }
  }

  return (
    <div className="min-h-svh px-0 py-0 sm:px-5 sm:py-5">
      <a
        href="#main-content"
        className="sr-only absolute left-4 top-4 z-[1100] rounded-lg bg-white px-4 py-2 font-semibold text-[#2f1e52] shadow-lg focus:not-sr-only"
      >
        Skip to gallery
      </a>
      <main
        id="main-content"
        className="box-border mx-auto flex min-h-svh w-full max-w-[1600px] flex-col overflow-hidden bg-[length:150%_150%] text-center text-[#25213a] shadow-xl sm:min-h-[calc(100svh-2.5rem)] sm:rounded-3xl motion-safe:animate-gradient-shift"
        data-time-theme={timeTheme.name}
        style={{ background: timeTheme.background }}
      >
        <header className="hero relative px-5 pb-8 pt-14 sm:px-8 sm:pt-16">
          <h1 className="font-display mb-3 text-4xl font-extrabold leading-[1.05] tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] text-balance sm:text-5xl lg:text-6xl">
            Colouring Page Generator
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base font-medium text-white/85 sm:text-lg">
            Turn your ideas into printable colouring pages
          </p>

          <PromptForm
            onSubmit={handlePromptSubmit}
            prompt={prompt}
            setPrompt={setPrompt}
            isSubmitting={isLoading}
            statusMessage={generationStatus}
            error={error}
          />
        </header>

        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTag={activeTag}
          onTagSelect={setActiveTag}
          allTags={allTags}
        />

        <section className="w-full flex-1 px-3 pb-3 sm:px-6 sm:pb-6" aria-labelledby="gallery-heading">
          <h2 id="gallery-heading" className="sr-only">Generated colouring pages</h2>
          <ImageGallery
            images={(images || []).map(img => ({
              id: img.filename,
              url: img.url ? (img.url.startsWith('http') ? img.url : `${API_URL}${img.url}`) : '',
              prompt: img.prompt || '',
              filename: img.filename,
              date: img.date,
              tags: img.tags || [],
              timestamp: img.date ? new Date(img.date).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }) : ''
            }))}
            onDelete={async (image) => {
              await handleDelete(image as Image)
            }}
            onReroll={handleReroll}
            onTagUpdate={handleTagUpdate}
          />
        </section>

        <Footer
          apiVersion={health?.version}
          apiStatus={healthError ? 'unhealthy' : health ? 'healthy' : 'unknown'}
        />
      </main>
    </div>
  )
}
