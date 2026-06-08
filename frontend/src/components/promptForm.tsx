import { useState } from 'react'
import ReactiveButton from 'reactive-button'

interface PromptFormProps {
  onSubmit: (prompt: string, tags: string[]) => Promise<void>
  prompt: string
  setPrompt: (prompt: string) => void
}

export const PromptForm = ({ onSubmit, prompt, setPrompt }: PromptFormProps) => {
  const [buttonState, setButtonState] = useState('idle')
  const [tagInput, setTagInput] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setButtonState('loading')
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean)
    try {
      await onSubmit(prompt, tags)
      setButtonState('success')
      setTagInput('')
      setTimeout(() => setButtonState('idle'), 2000)
    } catch {
      setButtonState('error')
      setTimeout(() => setButtonState('idle'), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="prompt-form">
      <div className="form-group">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to draw..."
          disabled={buttonState === 'loading'}
        />
      </div>
      <div className="form-group">
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          placeholder="Tags (optional, comma-separated): dragon, castle, fantasy"
          disabled={buttonState === 'loading'}
          className="tag-input"
        />
      </div>
      <ReactiveButton
        buttonState={buttonState}
        idleText="Generate"
        loadingText="Creating..."
        successText="Created!"
        errorText="Error!"
        className="reactive-btn"
        type="submit"
        disabled={buttonState === 'loading' || !prompt.trim()}
      />
    </form>
  )
}
