interface LanguageSwitcherProps {
  currentLanguage: 'en' | 'fi';
  onLanguageChange: (language: 'en' | 'fi') => void;
}

export const LanguageSwitcher = ({ currentLanguage, onLanguageChange }: LanguageSwitcherProps) => {
  return (
    <div className="language-switcher">
      <button 
        className={`lang-button ${currentLanguage === 'en' ? 'active' : ''}`}
        onClick={() => onLanguageChange('en')}
      >
        EN
      </button>
      <span className="lang-separator">/</span>
      <button 
        className={`lang-button ${currentLanguage === 'fi' ? 'active' : ''}`}
        onClick={() => onLanguageChange('fi')}
      >
        FI
      </button>
    </div>
  );
}; 