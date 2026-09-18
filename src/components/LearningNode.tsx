import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LearningFlowNode } from '../types/graph'
import { CheckIcon, ChevronIcon } from './icons'

export function LearningNode({
  id,
  data,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
}: NodeProps<LearningFlowNode>) {
  const classes = [
    'learning-node',
    `learning-node--${data.kind}`,
    data.weekNumber ? `week-theme-${data.weekNumber}` : '',
    data.selected ? 'learning-node--selected' : '',
    data.completed ? 'learning-node--completed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <>
      <div className="learning-node__meta">
        <span className="learning-node__eyebrow">{data.eyebrow}</span>
        {data.completed ? (
          <span className="learning-node__complete" aria-label="Completed">
            <CheckIcon width={14} height={14} />
          </span>
        ) : null}
      </div>
      <strong className="learning-node__title">{data.label}</strong>
      {data.kind === 'week' ? (
        <span className="learning-node__progress">
          {data.completedCount} of {data.topicCount} topics complete
        </span>
      ) : null}
      {data.kind === 'root' ? (
        <span className="learning-node__description">Weeks 2, 3 &amp; 6</span>
      ) : null}
      {data.kind === 'week' ? (
        <span className="learning-node__action">
          {data.collapsed ? 'Expand branch' : 'Collapse branch'}
          <ChevronIcon
            className={data.collapsed ? '' : 'learning-node__chevron--open'}
            width={15}
            height={15}
          />
        </span>
      ) : null}
      {data.kind === 'topic' ? (
        <span className="learning-node__action">
          Explore topic
          <ChevronIcon width={15} height={15} />
        </span>
      ) : null}
    </>
  )

  return (
    <div className={classes}>
      {data.kind !== 'root' ? (
        <Handle
          className="learning-node__handle"
          type="target"
          position={targetPosition}
        />
      ) : null}
      {data.kind === 'week' ? (
        <button
          type="button"
          className="learning-node__button"
          aria-expanded={!data.collapsed}
          aria-label={`${data.eyebrow}: ${data.label}. ${data.collapsed ? 'Expand' : 'Collapse'} branch`}
          onClick={() => data.onToggleWeek?.(id)}
        >
          {body}
        </button>
      ) : data.kind === 'topic' ? (
        <button
          type="button"
          className="learning-node__button"
          aria-pressed={data.selected}
          aria-label={`${data.eyebrow} topic: ${data.label}${data.completed ? ', completed' : ''}`}
          onClick={() => data.onSelect?.(id)}
        >
          {body}
        </button>
      ) : (
        <div className="learning-node__root-content" tabIndex={0} aria-label={data.label}>
          {body}
        </div>
      )}
      {data.kind !== 'topic' ? (
        <Handle
          className="learning-node__handle"
          type="source"
          position={sourcePosition}
        />
      ) : null}
    </div>
  )
}
