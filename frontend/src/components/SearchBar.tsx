interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
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
}: SearchBarProps) => (
  <section className="mx-auto mb-4 w-full max-w-2xl px-3 sm:px-6" aria-label="Search and filter gallery">
    <form role="search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="gallery-search" className="sr-only">Search colouring pages</label>
      <input
        id="gallery-search"
        name="search"
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search your pages…"
        autoComplete="off"
        aria-controls="gallery-list"
        className="w-full rounded-xl border border-[#fff7e9]/60 bg-[#fffaf2]/94 px-4 py-3 text-sm text-[#2b2438] shadow-[0_3px_12px_rgb(16_9_29/16%)] transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-[#716d7e] hover:bg-[#fffdf8] focus-visible:border-[#3d276d] focus-visible:bg-[#fffdf8] focus-visible:shadow-[0_3px_14px_rgba(16,9,29,0.24)]"
      />
    </form>

    {allTags.length > 0 && (
      <fieldset className="mt-3 flex flex-wrap items-center justify-center gap-2" aria-label="Filter by tag">
        <legend className="sr-only">Filter by tag</legend>
        <button
          type="button"
          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-[background-color,border-color,color] duration-200 ${activeTag === null ? 'border-[#fff7e9]/75 bg-[#fffaf2] text-[#33224f] shadow-sm' : 'border-white/30 bg-[#211832]/45 text-white hover:bg-[#211832]/65'}`}
          onClick={() => onTagSelect(null)}
          aria-pressed={activeTag === null}
          aria-controls="gallery-list"
        >
          All Pages
        </button>
        {allTags.map((tag) => {
          const isActive = tag === activeTag
          return (
            <button
              key={tag}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition-[background-color,border-color,color] duration-200 ${isActive ? 'border-[#fff7e9]/75 bg-[#fffaf2] text-[#33224f] shadow-sm' : 'border-white/30 bg-[#211832]/45 text-white hover:bg-[#211832]/65'}`}
              onClick={() => onTagSelect(tag)}
              aria-pressed={isActive}
              aria-controls="gallery-list"
            >
              {tag}
            </button>
          )
        })}
      </fieldset>
    )}
  </section>
)
