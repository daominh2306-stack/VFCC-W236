import dagre from '@dagrejs/dagre'
import { Position } from '@xyflow/react'
import type { LearningFlowEdge, LearningFlowNode } from '../types/graph'

export type LayoutDirection = 'TB' | 'LR'

const NODE_SIZES = {
  root: { width: 292, height: 106 },
  week: { width: 264, height: 154 },
  topic: { width: 244, height: 134 },
} as const

export function layoutGraph(
  nodes: LearningFlowNode[],
  edges: LearningFlowEdge[],
  direction: LayoutDirection,
): { nodes: LearningFlowNode[]; edges: LearningFlowEdge[] } {
  const graph = new dagre.graphlib.Graph()
  const isHorizontal = direction === 'LR'

  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: direction,
    ranksep: isHorizontal ? 118 : 92,
    nodesep: isHorizontal ? 54 : 38,
    edgesep: 24,
    marginx: 28,
    marginy: 28,
  })

  for (const node of nodes) {
    const size = NODE_SIZES[node.data.kind]
    // Dagre annotates node labels with layout coordinates, so each node needs
    // its own size object rather than a shared reference by node kind.
    graph.setNode(node.id, { ...size })
  }

  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target)
  }

  dagre.layout(graph)

  return {
    nodes: nodes.map((node) => {
      const size = NODE_SIZES[node.data.kind]
      const position = graph.node(node.id) as { x: number; y: number }
      return {
        ...node,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        position: {
          x: position.x - size.width / 2,
          y: position.y - size.height / 2,
        },
        width: size.width,
        height: size.height,
        initialWidth: size.width,
        initialHeight: size.height,
        style: size,
      }
    }),
    edges,
  }
}
