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

  return (
    <div className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <p className="credits">Colouring Page Generator</p>
          <p className="version">
            {versionParts.join(' | ')}
            <span
              className={`api-status ${apiStatus === 'healthy' ? '' : 'error'}`}
              title={apiStatus === 'healthy' ? 'API Connected' : 'API Unavailable'}
            >●</span>
          </p>
        </div>
        <div className="footer-section">
          <p className="credits">
            Made with ❤️ by{' '}
            <a href="https://github.com/Narqulie" className="credits-link">Narqulie</a>
          </p>
          <a
            href="https://paypal.me/jheaminoff"
            className="support-link"
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
