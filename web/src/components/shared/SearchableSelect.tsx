import { useEffect, useId, useMemo, useRef, useState } from 'react'

export type SearchableOption = {
  value: string
  label: string
  group?: string
}

type SearchableSelectProps = {
  name: string
  placeholder: string
  options: (string | SearchableOption)[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  required?: boolean
  disabled?: boolean
}

export function SearchableSelect({
  name,
  placeholder,
  options,
  value: controlledValue,
  defaultValue = '',
  onChange,
  required = false,
  disabled = false,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()

  const normalizedOptions: SearchableOption[] = useMemo(() => {
    return options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt))
  }, [options])

  const [internalValue, setInternalValue] = useState<string>(controlledValue ?? defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === selectedValue)
  }, [normalizedOptions, selectedValue])

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return normalizedOptions
    return normalizedOptions.filter(
      (opt) => opt.label.toLowerCase().includes(q) || (opt.group && opt.group.toLowerCase().includes(q)),
    )
  }, [normalizedOptions, searchQuery])

  // Group filtered options
  const groupedOptions = useMemo(() => {
    const groups: { [key: string]: SearchableOption[] } = {}
    for (const opt of filteredOptions) {
      const g = opt.group || ''
      if (!groups[g]) groups[g] = []
      groups[g].push(opt)
    }
    return groups
  }, [filteredOptions])

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setHighlightedIndex(0)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (opt: SearchableOption) => {
    setInternalValue(opt.value)
    onChange?.(opt.value)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex])
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`searchable-select-container ${isOpen ? 'is-open' : ''} ${disabled ? 'is-disabled' : ''}`}
      onKeyDown={handleKeyDown}
      style={{ position: 'relative', width: '100%' }}
    >
      <input type="hidden" name={name} value={selectedValue} required={required} />

      {/* Main trigger button displaying current selection */}
      <button
        type="button"
        className="searchable-select-trigger"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled) setIsOpen((prev) => !prev)
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          minHeight: '42px',
          padding: '9px 12px',
          background: 'var(--surface)',
          color: selectedOption ? 'var(--text)' : 'var(--muted)',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)',
          borderRadius: 'var(--r-md, 14px)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          textAlign: 'left',
          fontSize: '0.92rem',
          fontWeight: 500,
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
          boxShadow: isOpen ? '0 0 0 3px rgba(13, 130, 118, 0.16)' : 'none',
          transition: 'border-color 140ms ease, box-shadow 140ms ease',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: 'var(--muted)',
          }}
        >
          ▼
        </span>
      </button>

      {/* Dropdown Popup Menu */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          className="searchable-select-dropdown"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md, 14px)',
            boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.25), 0 4px 10px -2px rgba(0, 0, 0, 0.15)',
            maxHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Search Input Filter Bar */}
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-subtle)' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: '10px', fontSize: '0.85rem', color: 'var(--muted)' }}>🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setHighlightedIndex(0)
                }}
                placeholder="Type to search..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm, 10px)',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  outline: 'none',
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    padding: '2px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div style={{ overflowY: 'auto', maxHeight: '220px', padding: '4px 0' }}>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
                No matching results for "{searchQuery}"
              </div>
            ) : (
              Object.entries(groupedOptions).map(([groupName, groupOpts]) => (
                <div key={groupName || 'ungrouped'}>
                  {groupName && (
                    <div
                      style={{
                        padding: '6px 12px 4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--primary)',
                        background: 'var(--surface-subtle)',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      {groupName}
                    </div>
                  )}
                  {groupOpts.map((opt) => {
                    const isSelected = opt.value === selectedValue
                    const flatIndex = filteredOptions.findIndex((o) => o.value === opt.value)
                    const isHighlighted = flatIndex === highlightedIndex

                    return (
                      <div
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSelect(opt)
                        }}
                        onMouseEnter={() => setHighlightedIndex(flatIndex)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.9rem',
                          color: isSelected ? 'var(--primary)' : 'var(--text)',
                          background: isHighlighted
                            ? 'var(--surface-subtle)'
                            : isSelected
                              ? 'var(--primary-subtle)'
                              : 'transparent',
                          fontWeight: isSelected ? 600 : 400,
                          transition: 'background 0.1s ease',
                        }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <span style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>✓</span>}
                      </div>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
