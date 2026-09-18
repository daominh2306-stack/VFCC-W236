import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProgressSummary } from '../src/components/ProgressSummary'
import { SourceList } from '../src/components/SourceList'
import { curriculum } from '../src/data/curriculum'
import type { CurriculumSource } from '../src/types/curriculum'

describe('source list', () => {
  it('renders unsafe source URLs as text instead of broken anchors', () => {
    const source: CurriculumSource = {
      id: 'src-unsafe',
      title: 'Unverified source',
      citation: 'Citation remains readable.',
      type: 'Website',
      priority: 'Recommended',
      url: 'javascript:alert(1)',
    }

    render(<SourceList sources={[source]} />)

    expect(screen.queryByRole('link', { name: /unverified source/i })).toBeNull()
    expect(screen.getByText('Citation remains readable.')).toBeTruthy()
    expect(screen.getByText(/could not be verified safely/i)).toBeTruthy()
  })
})

describe('progress summary', () => {
  it('shows per-week and overall percentages and confirms before reset', () => {
    const onReset = vi.fn()
    render(
      <ProgressSummary
        weeks={curriculum.weeks}
        completedTopicIds={new Set(['w2-working-capital'])}
        onReset={onReset}
      />,
    )

    expect(screen.getByText(/1 of 21 topics · 5% overall/i)).toBeTruthy()
    expect(screen.getByText('14%')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Reset progress' }))
    expect(screen.getByRole('alertdialog')).toBeTruthy()
    expect(onReset).not.toHaveBeenCalled()

    fireEvent.click(
      screen.getByRole('alertdialog').querySelector('.danger-button') as HTMLButtonElement,
    )
    expect(onReset).toHaveBeenCalledOnce()
  })
})
