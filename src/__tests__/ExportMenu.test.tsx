import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExportMenu } from '../components/ExportMenu'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('export menu', () => {
  it('exposes keyboard-friendly PNG and JSON actions', () => {
    const onExportPng = vi.fn()
    const onExportJson = vi.fn()
    render(
      <ExportMenu
        isGeneratingPng={false}
        canExportPng
        onExportPng={onExportPng}
        onExportJson={onExportJson}
      />,
    )

    const trigger = screen.getByRole('button', {
      name: 'Export map or progress data',
    })
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('menu', { name: 'Export options' })).toBeTruthy()

    fireEvent.click(screen.getByRole('menuitem', { name: /export as png/i }))
    expect(onExportPng).toHaveBeenCalledOnce()
    expect(onExportJson).not.toHaveBeenCalled()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('locks the trigger and communicates progress while generating an image', () => {
    render(
      <ExportMenu
        isGeneratingPng
        canExportPng
        onExportPng={vi.fn()}
        onExportJson={vi.fn()}
      />,
    )

    const trigger = screen.getByRole('button', {
      name: 'Export map or progress data',
    })
    expect(trigger).toHaveProperty('disabled', true)
    expect(trigger.getAttribute('aria-busy')).toBe('true')
    expect(screen.getByText('Generating image…')).toBeTruthy()
  })

  it('keeps JSON available when the current filter has no PNG-exportable nodes', () => {
    const onExportJson = vi.fn()
    render(
      <ExportMenu
        isGeneratingPng={false}
        canExportPng={false}
        onExportPng={vi.fn()}
        onExportJson={onExportJson}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Export map or progress data' }),
    )
    expect(screen.getByRole('menuitem', { name: /export as png/i })).toHaveProperty(
      'disabled',
      true,
    )
    fireEvent.click(
      screen.getByRole('menuitem', { name: /progress & map data/i }),
    )
    expect(onExportJson).toHaveBeenCalledOnce()
  })
})
