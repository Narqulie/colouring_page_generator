import packageJson from '../../package.json'

interface FooterProps {
  apiVersion?: string
  apiStatus: 'healthy' | 'unhealthy' | 'unknown'
}

export const Footer = ({ apiVersion, apiStatus }: FooterProps) => {
  const gitHash = import.meta.env.VITE_GIT_HASH as string | undefined
  const frontendVersion = gitHash && gitHash !== 'unknown'
    ? `v${packageJson.version}-${gitHash.slice(0, 7)}`
    : `v${packageJson.version}`
  const versionParts = [frontendVersion]
  if (apiVersion) versionParts.push(`API v${apiVersion}`)

  const statusColor = apiStatus === 'healthy' ? 'bg-emerald-400' :
    apiStatus === 'unhealthy' ? 'bg-red-400' : 'bg-amber-300'
  const statusText = apiStatus === 'healthy' ? 'API is online' :
    apiStatus === 'unhealthy' ? 'API is unavailable' : 'API status is being checked'

  return (
    <footer className="mt-auto border-t border-white/15 bg-[#181026]/24 px-5 py-5 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div className="min-w-0">
          <p className="font-display text-base font-semibold text-white">Colouring Page Generator</p>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-white/78 sm:justify-start">
            <span className="tabular-nums">{versionParts.join(' · ')}</span>
            <span className="inline-flex items-center gap-1.5" role="status" aria-label={statusText}>
              <span className={`size-2 rounded-full ${statusColor}`} aria-hidden="true" />
              <span>{statusText}</span>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2.5 sm:items-end">
          <p className="text-sm text-white/85">
            Built by{' '}
            <a href="https://github.com/Narqulie" className="font-semibold text-white underline decoration-white/50 underline-offset-4 transition-colors hover:text-[#fff0c7] hover:decoration-[#fff0c7]">
              Narqulie
            </a>
          </p>
          <a
            href="https://paypal.me/jheaminoff"
            className="rounded-full border border-white/50 bg-[#201535]/40 px-4 py-2 text-sm font-semibold text-white transition-[background-color,border-color,transform] hover:border-white/80 hover:bg-[#201535]/65 hover:-translate-y-px"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support Development
          </a>
        </div>
      </div>
    </footer>
  )
}
