import { useState } from 'react'
import ReactiveButton from 'reactive-button'

interface PromptFormProps {
  onSubmit: (prompt: string) => Promise<void>
  prompt: string
  setPrompt: (prompt: string) => void
}

export const PromptForm = ({ onSubmit, prompt, setPrompt }: PromptFormProps) => {
  const [buttonState, setButtonState] = useState('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setButtonState('loading')
    try {
      await onSubmit(prompt)
      setButtonState('success')
      setTimeout(() => setButtonState('idle'), 2000)
    } catch {
      setButtonState('error')
      setTimeout(() => setButtonState('idle'), 2000)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-[640px] mx-auto w-full shrink-0">
      <div className="w-full">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to draw..."
          disabled={buttonState === 'loading'}
          className="w-full p-4 px-5 text-lg bg-white/92 border-2 border-white/60 rounded-xl text-[#1a1a1a] box-border min-h-[3.25rem] transition-all duration-250 shadow-[0_2px_8px_rgba(0,0,0,0.06)] placeholder:text-[#999] focus:outline-none focus:border-white focus:bg-white focus:shadow-[0_4px_20px_rgba(0,0,0,0.12)] disabled:opacity-50"
        />
      </div>
      <div className="w-full [&_.reactive-btn]:!w-full [&_.reactive-btn]:!font-primary [&_.reactive-btn]:!text-base [&_.reactive-btn]:!font-semibold [&_.reactive-btn]:!rounded-xl [&_.reactive-btn]:!px-6 [&_.reactive-btn]:!py-3.5 [&_.reactive-btn]:!tracking-wide [&_.reactive-btn]:!shadow-[0_2px_8px_rgba(0,0,0,0.08)] [&_.reactive-btn]:!transition-[box-shadow,background] [&_.reactive-btn]:!duration-250 [&_.reactive-btn:hover:not(:disabled)]:!shadow-[0_8px_28px_rgba(0,0,0,0.18)]">
        <ReactiveButton
          buttonState={buttonState}
          idleText="Generate"
          loadingText="Creating..."
          successText="Created!"
          errorText="Error!"
          type="submit"
          disabled={buttonState === 'loading' || !prompt.trim()}
          outline={false}
          shadow={false}
          rounded={false}
          size="large"
          color="primary"
        />
      </div>
    </form>
  )
}
