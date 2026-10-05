// Owner: S4 · Familial Risk & Clinical Approval — whole-project waiver (agent/DECISIONS.md 2026-09-28b)
// Selectors for the practice profile form: a searchable single-select that can also take a typed
// value, and a multi-select that shows its choices as chips. Both are controlled; the form owns the values.
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react'

export type ComboOption = { value: string; group?: string }

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const outside = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) close() }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open, close])
  return ref
}

/**
 * Text input with a filtered option list. With `customLabel` set, text that matches no option can
 * be kept as the value; without it, only a listed option (or the value already saved) is accepted.
 */
export function Combo({ label, value, onChange, options, placeholder, customLabel, maxLength, hint }: {
  label: string
  value: string
  onChange: (value: string) => void
  options: ComboOption[]
  placeholder?: string
  customLabel?: string
  maxLength?: number
  hint?: ReactNode
}) {
  const id = useId()
  // Null while the field is at rest and shows the chosen value; a string while the doctor types.
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const typed = (query ?? '').trim()
  const needle = typed.toLowerCase()
  const listed = options.some((option) => option.value === value)
  // A value saved before this list existed stays selectable instead of being dropped.
  const all: ComboOption[] = value && !listed ? [{ value, group: 'Saved value' }, ...options] : options
  const matches = needle
    ? all.filter((option) => option.value.toLowerCase().includes(needle) || option.group?.toLowerCase().includes(needle))
    : all
  const exact = all.some((option) => option.value.toLowerCase() === needle)
  const rows: Array<ComboOption & { custom?: boolean }> =
    customLabel && typed && !exact ? [...matches, { value: typed, custom: true }] : matches

  const close = () => { setOpen(false); setQuery(null) }
  const pick = (next: string) => { onChange(next); close() }
  // Leaving the field: an emptied field clears the value, typed text is kept only where allowed.
  const settle = () => {
    if (query === null) return setOpen(false)
    const match = all.find((option) => option.value.toLowerCase() === needle)
    if (!typed) pick('')
    else if (match) pick(match.value)
    else if (customLabel) pick(typed)
    else close()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) return setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => Math.min(Math.max(current + step, 0), rows.length - 1))
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      if (rows[active]) pick(rows[active].value)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      close()
    }
  }

  return (
    <div className="dprof-field dprof-select">
      <label htmlFor={id}>{label}</label>
      <div className="dprof-select__box">
        <input
          id={id} role="combobox" type="text" autoComplete="off" maxLength={maxLength} placeholder={placeholder}
          aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list"
          aria-activedescendant={open && rows[active] ? `${id}-${active}` : undefined}
          value={query ?? value}
          onChange={(event) => { setQuery(event.target.value); setOpen(true); setActive(0) }}
          // Select the current value on entry, so typing searches instead of appending to it.
          onFocus={(event) => event.target.select()}
          onClick={() => setOpen(true)}
          onBlur={settle}
          onKeyDown={onKeyDown}
        />
        <span className="dprof-select__chevron" aria-hidden="true" />
        {open && (
          // Pressing inside the list must not blur the input, or the list would close before the click lands.
          <ul className="dprof-menu" id={`${id}-list`} role="listbox" aria-label={label} onMouseDown={(event) => event.preventDefault()}>
            {rows.length === 0 && <li className="dprof-menu__empty" role="presentation">No matches.</li>}
            {rows.map((row, index) => (
              <li
                key={`${row.custom ? 'custom' : 'option'}-${row.value}`} id={`${id}-${index}`} role="option"
                aria-selected={row.value === value}
                className={`dprof-option${index === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => pick(row.value)}
              >
                <span>{row.custom ? `${customLabel}: “${row.value}”` : row.value}</span>
                {row.group && !row.custom && <small>{row.group}</small>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hint && <small className="dprof-hint">{hint}</small>}
    </div>
  )
}

/**
 * Checkbox list in a popover, with the choices shown as removable chips. A saved choice that is
 * no longer offered stays as a chip until the doctor removes it; it cannot be added back.
 */
export function MultiSelect({ label, values, onChange, options, placeholder, hint }: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  options: string[]
  placeholder: string
  hint?: ReactNode
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  const toggle = (option: string) =>
    onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option])

  return (
    <div
      className="dprof-field dprof-select" ref={ref}
      onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false) } }}
    >
      <span id={`${id}-label`}>{label}</span>
      <div className="dprof-select__box">
        <button
          type="button" className="dprof-select__trigger" aria-haspopup="true" aria-expanded={open}
          aria-controls={`${id}-list`} aria-labelledby={`${id}-label ${id}-value`}
          onClick={() => setOpen((current) => !current)}
        >
          <span id={`${id}-value`} className={values.length ? undefined : 'is-placeholder'}>
            {values.length ? values.join(' · ') : placeholder}
          </span>
        </button>
        <span className="dprof-select__chevron" aria-hidden="true" />
        {open && (
          <div className="dprof-menu" id={`${id}-list`} role="group" aria-labelledby={`${id}-label`}>
            {options.map((option) => (
              <label className="dprof-option dprof-option--check" key={option}>
                <input type="checkbox" checked={values.includes(option)} onChange={() => toggle(option)} />
                <span>{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
      {values.length > 0 && (
        <ul className="dprof-chips" aria-label={`Selected ${label.toLowerCase()}`}>
          {values.map((value) => {
            const offered = options.includes(value)
            return (
              <li className={`dprof-chip${offered ? '' : ' is-legacy'}`} key={value}>
                {value}{!offered && <small> · saved earlier</small>}
                <button type="button" aria-label={`Remove ${value}`} onClick={() => toggle(value)}>×</button>
              </li>
            )
          })}
        </ul>
      )}
      {hint && <small className="dprof-hint">{hint}</small>}
    </div>
  )
}
