import type { Node, ReactFlowInstance } from '@xyflow/react'
import { toBlob } from 'html-to-image'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { curriculum } from '../data/curriculum'
import {
  calculateExportCanvas,
  createCurriculumExport,
  exportToJson,
  exportToPng,
  shouldIncludeExportNode,
} from '../lib/exportMap'

vi.mock('html-to-image', () => ({
  toBlob: vi.fn(),
}))

const createObjectUrl = vi.fn<(blob: Blob) => string>(() => 'blob:test-export')
const revokeObjectUrl = vi.fn()
let originalCreateObjectUrl: PropertyDescriptor | undefined
let originalRevokeObjectUrl: PropertyDescriptor | undefined

function testNodes(): Node[] {
  return [
    {
      id: 'root',
      position: { x: 10, y: 20 },
      width: 200,
      height: 100,
      data: {},
    },
    {
      id: 'topic',
      position: { x: 310, y: 70 },
      width: 100,
      height: 100,
      data: {},
    },
  ]
}

beforeEach(() => {
  vi.mocked(toBlob).mockReset()
  originalCreateObjectUrl = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
  originalRevokeObjectUrl = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectUrl,
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectUrl,
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  createObjectUrl.mockClear()
  revokeObjectUrl.mockClear()
  if (originalCreateObjectUrl) {
    Object.defineProperty(URL, 'createObjectURL', originalCreateObjectUrl)
  } else {
    Reflect.deleteProperty(URL, 'createObjectURL')
  }
  if (originalRevokeObjectUrl) {
    Object.defineProperty(URL, 'revokeObjectURL', originalRevokeObjectUrl)
  } else {
    Reflect.deleteProperty(URL, 'revokeObjectURL')
  }
  document.body.replaceChildren()
})

describe('PNG map export', () => {
  it('calculates a bounded high-resolution canvas for every visible node', () => {
    const result = calculateExportCanvas(testNodes(), {
      padding: 50,
      maxDimension: 1000,
      pixelRatio: 2,
    })

    expect(result.bounds).toEqual({ x: 10, y: 20, width: 400, height: 150 })
    expect(result.width).toBe(500)
    expect(result.height).toBe(250)
    expect(result.pixelRatio).toBe(2)
    expect(result.viewport.zoom).toBeGreaterThan(0)
  })

  it('captures the scoped React Flow viewport and downloads a PNG Blob', async () => {
    const root = document.createElement('div')
    const viewport = document.createElement('div')
    viewport.className = 'react-flow__viewport'
    root.append(viewport)
    document.body.append(root)
    const pngBlob = new Blob(['png'], { type: 'image/png' })
    vi.mocked(toBlob).mockResolvedValue(pngBlob)
    const instance = {
      getNodes: () => testNodes(),
    } as unknown as ReactFlowInstance<Node>

    await exportToPng(instance, '.react-flow__viewport', {
      rootElement: root,
      filename: 'map.png',
      backgroundColor: '#ffffff',
      padding: 50,
    })

    expect(toBlob).toHaveBeenCalledOnce()
    const [capturedNode, options] = vi.mocked(toBlob).mock.calls[0]!
    expect(capturedNode).toBe(viewport)
    expect(options?.backgroundColor).toBe('#ffffff')
    expect(options?.style?.transform).toMatch(/^translate\(.+\) scale\(.+\)$/)
    expect(options?.canvasWidth).toBeGreaterThan(options?.width ?? 0)
    expect(options?.filter?.(document.createTextNode('label') as never)).toBe(true)
    expect(options?.filter?.(document.createComment('edge') as never)).toBe(true)
    expect(
      options?.filter?.(
        document.createElementNS('http://www.w3.org/2000/svg', 'text') as never,
      ),
    ).toBe(true)
    expect(createObjectUrl).toHaveBeenCalledWith(pngBlob)
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test-export')
  })

  it('keeps non-Element nodes and excludes marked interactive chrome safely', () => {
    const excluded = document.createElement('div')
    excluded.setAttribute('data-export-exclude', '')
    const minimap = document.createElement('div')
    minimap.className = 'react-flow__minimap'

    expect(shouldIncludeExportNode(document.createTextNode('topic'))).toBe(true)
    expect(shouldIncludeExportNode(document.createComment('connector'))).toBe(true)
    expect(
      shouldIncludeExportNode(
        document.createElementNS('http://www.w3.org/2000/svg', 'text'),
      ),
    ).toBe(true)
    expect(shouldIncludeExportNode(excluded)).toBe(false)
    expect(shouldIncludeExportNode(minimap)).toBe(false)
  })

  it('fails clearly when no viewport or visible nodes are available', async () => {
    const instance = {
      getNodes: () => testNodes(),
    } as unknown as ReactFlowInstance<Node>

    await expect(
      exportToPng(instance, '.missing', { rootElement: document }),
    ).rejects.toThrow(/canvas could not be found/i)

    const root = document.createElement('div')
    root.innerHTML = '<div class="react-flow__viewport"></div>'
    const emptyInstance = {
      getNodes: () => [],
    } as unknown as ReactFlowInstance<Node>
    await expect(
      exportToPng(emptyInstance, '.react-flow__viewport', { rootElement: root }),
    ).rejects.toThrow(/no visible map nodes/i)
  })
})

describe('curriculum JSON export', () => {
  it('serializes the full curriculum, active view, and valid completion state', () => {
    const originalTopic = curriculum.weeks[0]!.topics[0]!
    const result = createCurriculumExport(
      curriculum,
      new Set(['w3-discount-rate', 'w2-working-capital', 'stale-topic']),
      {
        exportedAt: '2026-09-18T12:00:00.000Z',
        activeView: {
          query: 'cash',
          activeWeek: 2,
          layoutDirection: 'LR',
          collapsedWeekIds: ['week-6', 'week-3'],
          visibleTopicIds: ['w2-working-capital'],
        },
      },
    )

    expect(result.exportedAt).toBe('2026-09-18T12:00:00.000Z')
    expect(result.progress).toEqual({
      storageKey: 'ma_theory_completed_topics',
      completedTopicIds: ['w2-working-capital', 'w3-discount-rate'],
      completedTopics: 2,
      totalTopics: 21,
      percentage: 10,
    })
    expect(result.activeView?.collapsedWeekIds).toEqual(['week-3', 'week-6'])
    expect(
      result.curriculum.weeks
        .flatMap((week) => week.topics)
        .find((topic) => topic.id === 'w2-working-capital')?.completed,
    ).toBe(true)
    expect(
      result.curriculum.weeks
        .flatMap((week) => week.topics)
        .find((topic) => topic.id === 'w6-risk-case')?.completed,
    ).toBe(false)
    expect('completed' in originalTopic).toBe(false)
  })

  it('downloads formatted JSON through a cleaned-up Blob URL', () => {
    const result = exportToJson(curriculum, new Set(['w6-risk-case']), {
      filename: 'progress.json',
      exportedAt: '2026-09-18T12:00:00.000Z',
    })

    expect(result.progress.completedTopicIds).toEqual(['w6-risk-case'])
    expect(createObjectUrl).toHaveBeenCalledOnce()
    const blob = createObjectUrl.mock.calls[0]![0] as Blob
    expect(blob.type).toBe('application/json;charset=utf-8')
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test-export')
  })
})
