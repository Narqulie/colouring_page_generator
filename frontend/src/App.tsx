// Import necessary dependencies from React
import { useState, useEffect } from 'react' // Allows us to use state in our component
import { PromptForm } from './components/promptForm' // Import our custom form component
import { ImageGallery } from './components/imageGallery' // Import our custom image gallery component
import './App.css' // Import styles for this component
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { translations } from './translations'
import packageJson from '../package.json'
import { useTimeBasedGradient } from './components/TimeBasedGradient'
import { useHealthCheck } from './hooks/useHealthCheck'

// Define TypeScript interfaces for our data structures
interface Image {
  filename: string
  date: string
  url: string
  prompt?: string // Optional as it's not in your API response
}

// Main App component - the root component of our application
export default function App() {
  // State declarations using React's useState hook
  // Each useState creates a variable and a function to update it
  
  // Track loading state (true when processing, false when idle)
  const [isLoading, setIsLoading] = useState(false)
  
  // Store any error messages
  // null when no errors, string when we have an error message
  const [error, setError] = useState<string | null>(null)
  
  // Update image state to handle multiple images
  const [images, setImages] = useState<Image[]>([])
  
  // Add prompt state
  const [prompt, setPrompt] = useState('')

  const [language, setLanguage] = useState<'en' | 'fi'>('en')

  const gradientStyle = useTimeBasedGradient()

  const { health, error: healthError } = useHealthCheck()

  // Fetch images when component mounts
  useEffect(() => {
    fetchImages()
  }, [])

  // Function to fetch images from the API
  const fetchImages = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      console.log('Fetching images from:', `${API_URL}/images`);
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
      setImages([]); // Set empty array on error
    }
  }

  // Updated handler for prompt submission
  const handlePromptSubmit = async (prompt: string, complexity: string, theme: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('language', language);
      formData.append('complexity', complexity);
      formData.append('theme', theme);

      console.log('Sending generation request to:', `${API_URL}/generate`);

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

      const responseData = await response.json();
      console.log('Generation response:', responseData);
      
      await fetchImages();
      setPrompt('');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : translations[language].errorGenerate;
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
      setError(translations[language].errorDelete)
      console.error('Error deleting image:', err)
      throw err
    }
  }

  const handleReroll = (prompt: string) => {
    setPrompt(prompt);  // Just set the prompt in the input field
  }

  return (
    // Main container with 'app' class for styling
    <div className="app" style={{ background: gradientStyle }}>
      {/* Page title */}
      <h1 className="page-header">{translations[language].title}</h1>
      
      {/* Custom form component that takes our handler and loading state */}
      <PromptForm 
        onSubmit={handlePromptSubmit} 
        prompt={prompt}
        setPrompt={setPrompt}
        language={language}
      />
      
      {/* Conditional rendering: Only show error div if there's an error */}
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
        language={language}
      />
      
      <div className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <p className="credits">{translations[language].copyright}</p>
            <p className="version">
              {translations[language].version.replace('1.0.0', packageJson.version)}
              {health && ` | API v${health.version}`}
              {health && <span className="api-status" title="API Status">●</span>}
              {healthError && <span className="api-status error" title="API Unavailable">●</span>}
            </p>
          </div>
          <div className="footer-section">
            <LanguageSwitcher 
              currentLanguage={language}
              onLanguageChange={setLanguage}
            />
          </div>
          <div className="footer-section">
            <p className="credits">
              {translations[language].madeWith} <a href="https://github.com/Narqulie" className="credits-link">Narqulie</a>
            </p>
            <a 
              href="https://paypal.me/jheaminoff" 
              className="support-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              {translations[language].supportProject}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
