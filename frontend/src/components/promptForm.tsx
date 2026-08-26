interface PromptFormProps {
  onSubmit: (prompt: string) => Promise<void>
  prompt: string
  setPrompt: (prompt: string) => void
  isSubmitting: boolean
  statusMessage: string | null
  error?: string | null
}

export const PromptForm = ({
  onSubmit,
  prompt,
  setPrompt,
  isSubmitting,
  statusMessage,
  error,
}: PromptFormProps) => {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!prompt.trim() || isSubmitting) return
    await onSubmit(prompt)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-2xl shrink-0 flex-col gap-3"
      aria-busy={isSubmitting}
      aria-describedby={isSubmitting ? 'prompt-hint prompt-status' : 'prompt-hint'}
    >
      <label htmlFor="generation-prompt" className="sr-only">Describe your colouring page</label>
      <input
        id="generation-prompt"
        name="prompt"
        type="text"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="E.g., a friendly dragon in a forest…"
        autoComplete="off"
        required
        disabled={isSubmitting}
        className="min-h-14 w-full rounded-2xl border-2 border-white/60 bg-white/95 px-5 py-3.5 text-base text-[#25213a] shadow-[0_3px_12px_rgba(0,0,0,0.08)] transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#716d7e] hover:bg-white focus-visible:border-[#3d276d] focus-visible:bg-white focus-visible:shadow-[0_4px_20px_rgba(0,0,0,0.14)] disabled:cursor-wait disabled:opacity-65 sm:text-lg"
      />
      <p id="prompt-hint" className="px-1 text-left text-sm text-white/85">
        Describe a subject, setting, and style. You can refine the result later.
      </p>
      {isSubmitting && (
        <p id="prompt-status" className="px-1 text-left text-sm font-semibold text-white" role="status" aria-live="polite">
          {statusMessage ?? 'Starting your page…'}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting || !prompt.trim()}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#3d276d] px-5 py-3 font-semibold text-white shadow-[0_4px_12px_rgba(44,27,83,0.32)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#2f1e52] hover:shadow-[0_6px_18px_rgba(44,27,83,0.38)] active:translate-y-px disabled:cursor-not-allowed disabled:bg-[#6f6682] disabled:shadow-none"
      >
        {isSubmitting && (
          <svg className="size-4 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {isSubmitting ? 'Creating…' : 'Generate Page'}
      </button>
      {error && (
        <p className="rounded-xl border border-red-900/15 bg-red-50/90 px-4 py-3 text-left text-sm font-medium text-red-800 shadow-sm" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}
