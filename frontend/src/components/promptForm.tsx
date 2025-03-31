import { useState } from 'react'
import ReactiveButton from 'reactive-button'
import { translations } from '../translations'

interface PromptFormProps {
  onSubmit: (prompt: string, complexity: string, theme: string) => Promise<void>
  prompt: string
  setPrompt: (prompt: string) => void
  language: 'en' | 'fi'
}

export const PromptForm = ({ onSubmit, prompt, setPrompt, language }: PromptFormProps) => {
  const [buttonState, setButtonState] = useState('idle')
  const [complexity, setComplexity] = useState('medium')
  const [theme, setTheme] = useState('none')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setButtonState('loading')
    
    try {
      await onSubmit(prompt, complexity, theme)
      setButtonState('success')
      
      setTimeout(() => {
        setButtonState('idle')
      }, 2000)
    } catch (error) {
      setButtonState('error')
      
      setTimeout(() => {
        setButtonState('idle')
      }, 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="prompt-form">
      <div className="form-group">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={translations[language].promptPlaceholder}
          disabled={buttonState === 'loading'}
        />
      </div>
      
      <div className="form-group dropdowns">
        <div className="dropdown-container">
          <label htmlFor="complexity">{translations[language].complexityLabel}</label>
          <select
            id="complexity"
            value={complexity}
            onChange={(e) => setComplexity(e.target.value)}
            disabled={buttonState === 'loading'}
          >
            {Object.entries(translations[language].complexityOptions).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        
        <div className="dropdown-container">
          <label htmlFor="theme">{translations[language].themeLabel}</label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={buttonState === 'loading'}
          >
            {Object.entries(translations[language].themeOptions).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <ReactiveButton
        buttonState={buttonState}
        idleText={translations[language].generateButton}
        loadingText="Creating..."
        successText="Created!"
        errorText="Error!"
        className="reactive-btn"
        type="submit"
        disabled={buttonState === 'loading' || !prompt.trim()}
        style={{
          width: '100%',
          padding: '0.5rem 1rem',
        }}
      />
    </form>
  )
}
