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

  const statusColor = apiStatus === 'healthy' ? 'text-green-500' :
    apiStatus === 'unhealthy' ? 'text-red-500' : 'text-yellow-500'

  return (
    <div className="mt-auto p-8 bg-gradient-to-b from-transparent to-white/10 rounded-b-xl">
      <div className="flex justify-between items-center max-w-[1200px] mx-auto gap-4 flex-wrap max-md:flex-col max-md:gap-6 max-md:text-center">
        <div className="flex flex-col items-center gap-2 max-md:w-full">
          <p className="m-0 text-[#666] text-base">Colouring Page Generator</p>
          <p className="m-0 text-[#666] text-xs flex items-center justify-center gap-1">
            {versionParts.join(' | ')}
            <span className={`inline-block ml-2 text-xs ${statusColor}`} style={{ textShadow: `0 0 2px currentColor` }}>
              ●
            </span>
          </p>
        </div>
        <div className="flex flex-col items-center gap-2 max-md:w-full">
          <p className="m-0 text-[#666] text-base">
            Made with ❤️ by{' '}
            <a href="https://github.com/Narqulie" className="text-inherit underline transition-colors duration-300 hover:text-[var(--gradient-evening-end)]">
              Narqulie
            </a>
          </p>
          <a
            href="https://paypal.me/jheaminoff"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full transition-all duration-300 no-underline text-[#666] hover:bg-white/20 hover:-translate-y-0.5"
            target="_blank"
            rel="noopener noreferrer"
          >
            Support the project
          </a>
        </div>
      </div>
    </div>
  )
}
