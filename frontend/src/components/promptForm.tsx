import { useState } from 'react'
import ReactiveButton from 'reactive-button'
import { translations } from '../translations'

interface PromptFormProps {
  onSubmit: (prompt: string, theme: string) => Promise<void>
  prompt: string
  setPrompt: (prompt: string) => void
}

export const PromptForm = ({ onSubmit, prompt, setPrompt }: PromptFormProps) => {
  const [buttonState, setButtonState] = useState('idle')
  const [theme, setTheme] = useState('none')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setButtonState('loading')

    try {
      await onSubmit(prompt, theme)
      setButtonState('success')

      setTimeout(() => {
        setButtonState('idle')
      }, 2000)
    } catch {
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
          placeholder={translations.promptPlaceholder}
          disabled={buttonState === 'loading'}
        />
      </div>

      <div className="form-group dropdowns">
        <div className="dropdown-container">
          <label htmlFor="theme">{translations.themeLabel}</label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            disabled={buttonState === 'loading'}
          >
            {Object.entries(translations.themeOptions).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <ReactiveButton
        buttonState={buttonState}
        idleText={translations.generateButton}
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
