import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { DownloadIcon } from './icons'

interface ExportMenuProps {
  isGeneratingPng: boolean
  canExportPng: boolean
  onExportPng: () => void
  onExportJson: () => void
}

export function ExportMenu({
  isGeneratingPng,
  canExportPng,
  onExportPng,
  onExportJson,
}: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const initialFocusRef = useRef<'first' | 'last'>('first')

  const focusMenuItem = useCallback((position: 'first' | 'last') => {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not(:disabled)',
    )
    if (!items?.length) return
    items[position === 'first' ? 0 : items.length - 1]?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() =>
      focusMenuItem(initialFocusRef.current),
    )
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as globalThis.Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [focusMenuItem, open])

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    initialFocusRef.current = event.key === 'ArrowUp' ? 'last' : 'first'
    setOpen(true)
  }

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const items = [
      ...(menuRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ) ?? []),
    ]
    if (items.length === 0) return
    if (event.key === 'Home') {
      items[0]?.focus()
      return
    }
    if (event.key === 'End') {
      items.at(-1)?.focus()
      return
    }
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement)
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = (currentIndex + delta + items.length) % items.length
    items[nextIndex]?.focus()
  }

  const runAction = (action: () => void) => {
    setOpen(false)
    action()
  }

  return (
    <div className="export-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        className="toolbar-button export-menu__trigger"
        type="button"
        aria-label="Export map or progress data"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="map-export-menu"
        aria-busy={isGeneratingPng}
        disabled={isGeneratingPng}
        onClick={() => {
          initialFocusRef.current = 'first'
          setOpen((current) => !current)
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <DownloadIcon />
        {isGeneratingPng ? 'Generating image…' : 'Export'}
      </button>

      {open ? (
        <div
          ref={menuRef}
          id="map-export-menu"
          className="export-menu__popover"
          role="menu"
          aria-label="Export options"
          onKeyDown={handleMenuKeyDown}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!canExportPng}
            onClick={() => runAction(onExportPng)}
          >
            <strong>Export as PNG</strong>
            <span>High-resolution image of the current map</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => runAction(onExportJson)}
          >
            <strong>Export Progress &amp; Map Data (JSON)</strong>
            <span>Full curriculum, current view, and study progress</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}
