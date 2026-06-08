interface SearchBarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  activeTag: string | null
  onTagSelect: (tag: string | null) => void
  allTags: string[]
}

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  activeTag,
  onTagSelect,
  allTags,
}: SearchBarProps) => {
  if (allTags.length === 0 && !searchQuery) return null

  return (
    <div className="search-bar">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search prompts..."
        className="search-input"
      />
      {allTags.length > 0 && (
        <div className="tag-filters">
          {activeTag && (
            <button className="tag-filter tag-filter-active" onClick={() => onTagSelect(null)}>
              {activeTag} &times;
            </button>
          )}
          {allTags.filter(t => t !== activeTag).map(tag => (
            <button key={tag} className="tag-filter" onClick={() => onTagSelect(tag)}>
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
