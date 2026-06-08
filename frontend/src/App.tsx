import { useState, useEffect } from 'react'
import { PromptForm } from './components/promptForm'
import { ImageGallery } from './components/imageGallery'
import { Footer } from './components/Footer'
import './App.css'
import { useTimeBasedGradient } from './components/TimeBasedGradient'
import { useHealthCheck } from './hooks/useHealthCheck'

interface Image {
  filename: string
  date: string
  url: string
  prompt?: string
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<Image[]>([])
  const [prompt, setPrompt] = useState('')

  const gradientStyle = useTimeBasedGradient()
  const { health, error: healthError } = useHealthCheck()

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_URL}/images`);
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load images from gallery';
      setError(errorMessage);
      console.error('Error fetching images:', err);
      setImages([]);
    }
  }

  const handlePromptSubmit = async (prompt: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const formData = new FormData();
      formData.append('prompt', prompt);

      const response = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment.');
        }
        throw new Error(`Generation failed: ${response.status} ${response.statusText}`);
      }

      await fetchImages();
      setPrompt('');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      console.error('Error generating image:', err);

      setTimeout(() => setError(null), 10000);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (image: Image) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${API_URL}/images/${image.filename}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete image')
      }

      await fetchImages()

    } catch (err) {
      setError('Failed to delete image')
      console.error('Error deleting image:', err)
      throw err
    }
  }

  const handleReroll = (prompt: string) => {
    setPrompt(prompt);
  }

  return (
    <div className="app" style={{ background: gradientStyle }}>
      <div className="hero">
        <h1 className="page-header">Colouring Page Generator</h1>
        <p className="hero-subtitle">Turn your ideas into printable colouring pages</p>

        <PromptForm
          onSubmit={handlePromptSubmit}
          prompt={prompt}
          setPrompt={setPrompt}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {healthError && <div className="error">Health Check Error: {healthError}</div>}

      <ImageGallery
        images={(images || []).map(img => ({
          id: img.filename,
          url: img.url ? (img.url.startsWith('http') ? img.url : `${import.meta.env.VITE_API_URL || '/api'}${img.url}`) : '',
          prompt: img.prompt || '',
          filename: img.filename,
          date: img.date,
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
        isLoading={isLoading}
      />

      <Footer
        apiVersion={health?.version}
        apiStatus={healthError ? 'unhealthy' : health ? 'healthy' : 'unknown'}
      />
    </div>
  )
}
