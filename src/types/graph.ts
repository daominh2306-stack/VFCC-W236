import type { Edge, Node } from '@xyflow/react'
import type { WeekNumber } from './curriculum'

export type LearningNodeKind = 'root' | 'week' | 'topic'

export interface LearningNodeData extends Record<string, unknown> {
  kind: LearningNodeKind
  label: string
  eyebrow: string
  description?: string
  weekNumber?: WeekNumber
  topicCount?: number
  completedCount?: number
  completed?: boolean
  collapsed?: boolean
  selected?: boolean
  onSelect?: (id: string) => void
  onToggleWeek?: (id: string) => void
}

export type LearningFlowNode = Node<LearningNodeData, 'learning'>
export type LearningFlowEdge = Edge

export interface GraphResult {
  nodes: LearningFlowNode[]
  edges: LearningFlowEdge[]
  visibleTopicIds: string[]
  hasMatches: boolean
}
