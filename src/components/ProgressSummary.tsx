import { useEffect, useRef, useState } from 'react'
import type { CurriculumWeek } from '../types/curriculum'

interface ProgressSummaryProps {
  weeks: CurriculumWeek[]
  completedTopicIds: ReadonlySet<string>
  onReset: () => void
}

export function ProgressSummary({
  weeks,
  completedTopicIds,
  onReset,
}: ProgressSummaryProps) {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const resetButtonRef = useRef<HTMLButtonElement>(null)
  const topicIds = weeks.flatMap((week) => week.topics.map((topic) => topic.id))
  const totalTopics = topicIds.length
  const totalComplete = topicIds.filter((topicId) =>
    completedTopicIds.has(topicId),
  ).length
  const overallPercent = totalTopics
    ? Math.round((totalComplete / totalTopics) * 100)
    : 0

  useEffect(() => {
    if (!confirmingReset) return
    cancelButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmingReset(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [confirmingReset])

  const cancelReset = () => {
    setConfirmingReset(false)
    window.requestAnimationFrame(() => resetButtonRef.current?.focus())
  }

  const handleReset = () => {
    onReset()
    setConfirmingReset(false)
  }

  return (
    <section className="progress-summary" aria-labelledby="progress-title">
      <div className="progress-summary__intro">
        <span className="section-kicker">Your study path</span>
        <h2 id="progress-title">Progress by week</h2>
        <p>
          <strong>{totalComplete} of {totalTopics} topics · {overallPercent}% overall</strong>
          <span>Personal study tracking, never an academic score.</span>
        </p>
      </div>

      <div className="progress-grid">
        {weeks.map((week) => {
          const completed = week.topics.filter((topic) =>
            completedTopicIds.has(topic.id),
          ).length
          const percent = Math.round((completed / week.topics.length) * 100)
          return (
            <article className={`progress-card week-theme-${week.number}`} key={week.id}>
              <div className="progress-card__heading">
                <span>{week.label}</span>
                <strong>
                  {completed}/{week.topics.length}
                </strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`${week.label} study progress`}
                aria-valuemin={0}
                aria-valuemax={week.topics.length}
                aria-valuenow={completed}
                aria-valuetext={`${completed} of ${week.topics.length} topics, ${percent}%`}
              >
                <span style={{ width: `${percent}%` }} />
              </div>
              <span className="progress-card__percent">{percent}%</span>
            </article>
          )
        })}
      </div>

      <div className="progress-summary__reset">
        <button
          ref={resetButtonRef}
          type="button"
          className="text-button"
          disabled={totalComplete === 0}
          onClick={() => setConfirmingReset(true)}
        >
          Reset progress
        </button>
      </div>

      {confirmingReset ? (
        <div className="reset-dialog-backdrop">
          <div
            className="reset-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-dialog-title"
            aria-describedby="reset-dialog-description"
          >
            <h3 id="reset-dialog-title">Reset study progress?</h3>
            <p id="reset-dialog-description">
              This removes all {totalComplete} completed-topic marks from this browser.
            </p>
            <div className="reset-dialog__actions">
              <button type="button" className="danger-button" onClick={handleReset}>
                Reset progress
              </button>
              <button ref={cancelButtonRef} type="button" onClick={cancelReset}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
