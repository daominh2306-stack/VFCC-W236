import { describe, expect, it } from 'vitest'
import { Position } from '@xyflow/react'
import { curriculum } from '../src/data/curriculum'
import { buildGraph, ROOT_NODE_ID } from '../src/lib/buildGraph'
import { layoutGraph } from '../src/lib/layoutGraph'

describe('graph builder', () => {
  it('creates one root, three weeks, and topic children with correct relationships', () => {
    const graph = buildGraph(curriculum)
    const topicCount = curriculum.weeks.reduce(
      (total, week) => total + week.topics.length,
      0,
    )

    expect(graph.nodes.filter((node) => node.data.kind === 'root')).toHaveLength(1)
    expect(graph.nodes.filter((node) => node.data.kind === 'week')).toHaveLength(3)
    expect(graph.nodes.filter((node) => node.data.kind === 'topic')).toHaveLength(topicCount)

    for (const week of curriculum.weeks) {
      expect(graph.edges).toContainEqual(
        expect.objectContaining({ source: ROOT_NODE_ID, target: week.id }),
      )
      for (const topic of week.topics) {
        expect(graph.edges).toContainEqual(
          expect.objectContaining({ source: week.id, target: topic.id }),
        )
      }
    }
  })

  it('retains the root and week ancestor for a matching filtered topic', () => {
    const graph = buildGraph(curriculum, { query: 'beta' })
    const nodeIds = graph.nodes.map((node) => node.id)

    expect(graph.hasMatches).toBe(true)
    expect(nodeIds).toEqual([
      ROOT_NODE_ID,
      'week-3',
      'w3-discount-rate',
    ])
    expect(graph.edges).toHaveLength(2)
  })

  it('hides a collapsed branch and restores matching topics during search', () => {
    const collapsed = buildGraph(curriculum, {
      collapsedWeekIds: new Set(['week-2']),
    })
    expect(
      collapsed.nodes.some((node) => node.id === 'w2-working-capital'),
    ).toBe(false)

    const searched = buildGraph(curriculum, {
      collapsedWeekIds: new Set(['week-2']),
      query: 'cash operating cycle',
    })
    expect(searched.nodes.map((node) => node.id)).toContain('w2-working-capital')
  })

  it('changes node anchors when switching to left-to-right layout', () => {
    const graph = buildGraph(curriculum, { activeWeek: 2 })
    const vertical = layoutGraph(graph.nodes, graph.edges, 'TB')
    const horizontal = layoutGraph(graph.nodes, graph.edges, 'LR')

    expect(vertical.nodes.every((node) => node.sourcePosition === Position.Bottom)).toBe(true)
    expect(vertical.nodes.every((node) => node.targetPosition === Position.Top)).toBe(true)
    expect(horizontal.nodes.every((node) => node.sourcePosition === Position.Right)).toBe(true)
    expect(horizontal.nodes.every((node) => node.targetPosition === Position.Left)).toBe(true)
  })
})
