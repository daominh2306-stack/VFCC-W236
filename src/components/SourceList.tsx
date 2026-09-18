import type { CurriculumSource } from '../types/curriculum'
import { getSafeExternalUrl } from '../lib/validateCurriculum'
import { ExternalIcon } from './icons'

interface SourceListProps {
  sources: CurriculumSource[]
}

export function SourceList({ sources }: SourceListProps) {
  return (
    <ul className="source-list">
      {sources.map((source) => {
        const safeUrl = getSafeExternalUrl(source.url)
        return (
          <li className="source-card" key={source.id}>
          <div className="source-card__meta">
            <span>{source.type}</span>
            <span className={`priority priority--${source.priority.toLowerCase()}`}>
              {source.priority}
            </span>
          </div>
          {safeUrl ? (
            <a
              className="source-card__title"
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.title}
              <ExternalIcon width={15} height={15} />
            </a>
          ) : (
            <strong className="source-card__title">{source.title}</strong>
          )}
          <p>{source.citation}</p>
          {source.verificationNote ? (
            <p className="source-card__note">{source.verificationNote}</p>
          ) : null}
          {source.url && !safeUrl ? (
            <p className="source-card__note">The supplied link could not be verified safely.</p>
          ) : null}
          </li>
        )
      })}
    </ul>
  )
}
