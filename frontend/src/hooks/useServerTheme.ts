import { useEffect, useState } from 'react'

interface ServerThemeResponse {
  period: string
  background: {
    start: string
    end: string
  }
  next_change_at: string
  revision: number
}

interface ServerTheme {
  name: string
  background: string
  browserColor: string
}

const FALLBACK_THEME: ServerTheme = {
  name: 'fallback',
  background: 'linear-gradient(135deg, #3d3676 0%, #5b2c74 100%)',
  browserColor: '#3d3676',
}

const REVALIDATE_AFTER_MS = 5 * 60 * 1000
const RETRY_AFTER_MS = 30 * 1000
const HEX_COLOR = /^#[\da-f]{6}$/i

const isThemeResponse = (value: unknown): value is ServerThemeResponse => {
  if (!value || typeof value !== 'object') return false
  const theme = value as Partial<ServerThemeResponse>
  return typeof theme.period === 'string'
    && typeof theme.next_change_at === 'string'
    && typeof theme.revision === 'number'
    && !!theme.background
    && HEX_COLOR.test(theme.background.start ?? '')
    && HEX_COLOR.test(theme.background.end ?? '')
}

const getDelayUntilRefresh = (nextChangeAt: string) => {
  const nextChangeMs = Date.parse(nextChangeAt)
  if (Number.isNaN(nextChangeMs)) return REVALIDATE_AFTER_MS
  return Math.max(1_000, Math.min(nextChangeMs - Date.now(), REVALIDATE_AFTER_MS))
}

/**
 * Uses the server's configured time and palette as the sole visual-theme authority.
 * Browser time is used only to schedule the next API refresh, never to choose a theme.
 */
export const useServerTheme = (apiUrl: string) => {
  const [theme, setTheme] = useState<ServerTheme>(FALLBACK_THEME)

  useEffect(() => {
    let disposed = false
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined

    const scheduleRefresh = (delay: number) => {
      clearTimeout(refreshTimeout)
      refreshTimeout = setTimeout(() => void refreshTheme(), delay)
    }

    const refreshTheme = async () => {
      try {
        const response = await fetch(`${apiUrl}/theme`, { cache: 'no-store' })
        if (!response.ok) throw new Error(`Theme request failed: ${response.status}`)
        const payload: unknown = await response.json()
        if (!isThemeResponse(payload)) throw new Error('Theme response is invalid')
        if (disposed) return

        setTheme({
          name: payload.period,
          background: `linear-gradient(135deg, ${payload.background.start} 0%, ${payload.background.end} 100%)`,
          browserColor: payload.background.start,
        })
        scheduleRefresh(getDelayUntilRefresh(payload.next_change_at))
      } catch {
        if (!disposed) scheduleRefresh(RETRY_AFTER_MS)
      }
    }

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void refreshTheme()
    }

    void refreshTheme()
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      disposed = true
      clearTimeout(refreshTimeout)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [apiUrl])

  return theme
}
