import { translations } from '../translations'
import packageJson from '../../package.json'

interface FooterProps {
  apiVersion?: string
  apiStatus: 'healthy' | 'unhealthy' | 'unknown'
}

export const Footer = ({ apiVersion, apiStatus }: FooterProps) => {
  const versionParts = [`v${packageJson.version}`]
  if (apiVersion) versionParts.push(`API v${apiVersion}`)

  return (
    <div className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <p className="credits">{translations.copyright}</p>
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
            {translations.madeWith}{' '}
            <a href="https://github.com/Narqulie" className="credits-link">Narqulie</a>
          </p>
          <a
            href="https://paypal.me/jheaminoff"
            className="support-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {translations.supportProject}
          </a>
        </div>
      </div>
    </div>
  )
}
