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
    <div className="max-w-[640px] mx-auto mb-4 w-full flex flex-col gap-2">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search prompts..."
        className="w-full px-4 py-2.5 text-sm border-2 border-white/50 rounded-xl bg-white/85 text-[#333] box-border focus:outline-none focus:border-white focus:bg-white"
      />
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-center">
          {activeTag && (
            <button
              className="text-sm px-2.5 py-1 rounded-full border border-white/40 bg-white/40 text-white font-semibold cursor-pointer transition-all duration-200 font-primary hover:bg-white/55"
              onClick={() => onTagSelect(null)}
            >
              {activeTag} &times;
            </button>
          )}
          {allTags.filter(t => t !== activeTag).map(tag => (
            <button
              key={tag}
              className="text-sm px-2.5 py-1 rounded-full border border-white/40 bg-white/20 text-white/85 cursor-pointer transition-all duration-200 font-primary hover:bg-white/35"
              onClick={() => onTagSelect(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
