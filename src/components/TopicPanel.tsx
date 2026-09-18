import { useEffect, useRef } from 'react'
import { resolveSources } from '../data/curriculum'
import type { CurriculumTopic, CurriculumWeek } from '../types/curriculum'
import { CheckIcon, CloseIcon } from './icons'
import { SourceList } from './SourceList'

interface TopicPanelProps {
  topic: CurriculumTopic
  week: CurriculumWeek
  completed: boolean
  onToggleComplete: () => void
  onClose: () => void
}

export function TopicPanel({
  topic,
  week,
  completed,
  onToggleComplete,
  onClose,
}: TopicPanelProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const sources = resolveSources(topic.sourceIds)

  useEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true })
  }, [topic.id])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <aside className={`topic-panel week-theme-${week.number}`} aria-labelledby="topic-title">
      <header className="topic-panel__header">
        <div>
          <span className="topic-panel__week">{week.label}</span>
          <p>{week.title}</p>
        </div>
        <button
          ref={closeButtonRef}
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label="Close topic details"
        >
          <CloseIcon />
        </button>
      </header>

      <div className="topic-panel__scroll">
        <h2 id="topic-title">{topic.title}</h2>
        <p className="topic-panel__summary">{topic.summary}</p>

        <label className="completion-control">
          <input
            type="checkbox"
            checked={completed}
            onChange={onToggleComplete}
          />
          <span className="completion-control__box" aria-hidden="true">
            {completed ? <CheckIcon width={16} height={16} /> : null}
          </span>
          <span>
            <strong>{completed ? 'Marked complete' : 'Mark topic complete'}</strong>
            <small>For study tracking only — not an academic score.</small>
          </span>
        </label>

        <section className="topic-section" aria-labelledby="questions-heading">
          <h3 id="questions-heading">Learning questions</h3>
          <ul className="question-list">
            {topic.learningQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>

        <section className="topic-section" aria-labelledby="subtopics-heading">
          <h3 id="subtopics-heading">Main subtopics</h3>
          <ul className="subtopic-list">
            {topic.subtopics.map((subtopic, index) => (
              <li key={subtopic}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                {subtopic}
              </li>
            ))}
          </ul>
        </section>

        <section className="topic-section" aria-labelledby="sources-heading">
          <h3 id="sources-heading">Recommended sources</h3>
          <SourceList sources={sources} />
        </section>
      </div>
    </aside>
  )
}
