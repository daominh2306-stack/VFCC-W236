import type { Curriculum, WeekNumber } from '../types/curriculum'
import type {
  GraphResult,
  LearningFlowEdge,
  LearningFlowNode,
} from '../types/graph'
import { findMatchingTopicIds } from './searchCurriculum'

export const ROOT_NODE_ID = 'ma-theory-root'

interface BuildGraphOptions {
  activeWeek: WeekNumber | 'all'
  query: string
  collapsedWeekIds: ReadonlySet<string>
  completedTopicIds: ReadonlySet<string>
  selectedTopicId: string | null
}

const DEFAULT_OPTIONS: BuildGraphOptions = {
  activeWeek: 'all',
  query: '',
  collapsedWeekIds: new Set<string>(),
  completedTopicIds: new Set<string>(),
  selectedTopicId: null,
}

export function buildGraph(
  curriculum: Curriculum,
  options: Partial<BuildGraphOptions> = {},
): GraphResult {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }
  const hasQuery = resolvedOptions.query.trim().length > 0
  const matchingTopicIds = findMatchingTopicIds(
    curriculum,
    resolvedOptions.query,
  )
  const selectedWeek = curriculum.weeks.find((week) =>
    week.topics.some((topic) => topic.id === resolvedOptions.selectedTopicId),
  )

  const eligibleWeeks = curriculum.weeks.filter(
    (week) =>
      resolvedOptions.activeWeek === 'all' ||
      week.number === resolvedOptions.activeWeek,
  )

  const visibleWeeks = eligibleWeeks
    .map((week) => {
      const topics = hasQuery
        ? week.topics.filter((topic) => matchingTopicIds.has(topic.id))
        : resolvedOptions.collapsedWeekIds.has(week.id)
          ? []
          : week.topics
      return { week, topics }
    })
    .filter(({ topics }) => !hasQuery || topics.length > 0)

  const hasMatches = !hasQuery || visibleWeeks.some(({ topics }) => topics.length)
  if (!hasMatches) {
    return { nodes: [], edges: [], visibleTopicIds: [], hasMatches: false }
  }

  const rootHighlighted = Boolean(resolvedOptions.selectedTopicId)
  const nodes: LearningFlowNode[] = [
    {
      id: ROOT_NODE_ID,
      type: 'learning',
      position: { x: 0, y: 0 },
      data: {
        kind: 'root',
        label: curriculum.title,
        eyebrow: 'VFCC theory pathway',
        description: curriculum.description,
        selected: rootHighlighted,
      },
    },
  ]
  const edges: LearningFlowEdge[] = []
  const visibleTopicIds: string[] = []

  for (const { week, topics } of visibleWeeks) {
    const isSelectedPath = selectedWeek?.id === week.id
    const completedCount = week.topics.filter((topic) =>
      resolvedOptions.completedTopicIds.has(topic.id),
    ).length

    nodes.push({
      id: week.id,
      type: 'learning',
      position: { x: 0, y: 0 },
      data: {
        kind: 'week',
        label: week.title,
        eyebrow: week.label,
        description: week.summary,
        weekNumber: week.number,
        topicCount: week.topics.length,
        completedCount,
        collapsed: resolvedOptions.collapsedWeekIds.has(week.id) && !hasQuery,
        selected: isSelectedPath,
      },
    })

    edges.push({
      id: `${ROOT_NODE_ID}-${week.id}`,
      source: ROOT_NODE_ID,
      target: week.id,
      type: 'smoothstep',
      className: isSelectedPath ? 'edge--highlighted' : '',
    })

    for (const topic of topics) {
      const selected = topic.id === resolvedOptions.selectedTopicId
      visibleTopicIds.push(topic.id)
      nodes.push({
        id: topic.id,
        type: 'learning',
        position: { x: 0, y: 0 },
        data: {
          kind: 'topic',
          label: topic.title,
          eyebrow: week.label,
          description: topic.summary,
          weekNumber: week.number,
          completed: resolvedOptions.completedTopicIds.has(topic.id),
          selected,
        },
      })
      edges.push({
        id: `${week.id}-${topic.id}`,
        source: week.id,
        target: topic.id,
        type: 'smoothstep',
        className: selected ? 'edge--highlighted' : '',
      })
    }
  }

  return { nodes, edges, visibleTopicIds, hasMatches }
}
