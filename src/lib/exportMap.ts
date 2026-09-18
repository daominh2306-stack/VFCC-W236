import {
  getNodesBounds,
  getViewportForBounds,
  type Node,
  type ReactFlowInstance,
  type Rect,
  type Viewport,
} from '@xyflow/react'
import type {
  Curriculum,
  CurriculumTopic,
  WeekNumber,
} from '../types/curriculum'
import { PROGRESS_STORAGE_KEY } from './progressStorage'

const DEFAULT_PNG_FILENAME = 'ma-theory-learning-map.png'
const DEFAULT_JSON_FILENAME = 'ma-theory-progress-and-map-data.json'

export interface MapViewExport {
  query: string
  activeWeek: WeekNumber | 'all'
  layoutDirection: 'TB' | 'LR'
  collapsedWeekIds: string[]
  visibleTopicIds: string[]
}

export interface CurriculumExportOptions {
  activeView?: MapViewExport
  exportedAt?: string
  filename?: string
}

export interface ExportedCurriculumTopic extends CurriculumTopic {
  completed: boolean
}

export interface CurriculumDataExport {
  format: 'ma-theory-learning-map-export'
  version: 1
  exportedAt: string
  activeView?: MapViewExport
  progress: {
    storageKey: typeof PROGRESS_STORAGE_KEY
    completedTopicIds: string[]
    completedTopics: number
    totalTopics: number
    percentage: number
  }
  curriculum: Omit<Curriculum, 'weeks'> & {
    weeks: Array<
      Omit<Curriculum['weeks'][number], 'topics'> & {
        topics: ExportedCurriculumTopic[]
      }
    >
  }
}

export interface PngExportOptions {
  filename?: string
  backgroundColor?: string
  pixelRatio?: number
  padding?: number
  maxDimension?: number
  rootElement?: ParentNode
}

export interface ExportCanvas {
  bounds: Rect
  width: number
  height: number
  pixelRatio: number
  viewport: Viewport
}

interface DownloadEnvironment {
  document: Document
  url: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>
}

function defaultDownloadEnvironment(): DownloadEnvironment {
  return { document, url: URL }
}

function ensurePositiveNumber(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

type AttributeCapableNode = {
  hasAttribute: (name: string) => boolean
  classList?: { contains: (token: string) => boolean }
}

export function shouldIncludeExportNode(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) return true

  const candidate = node as Partial<AttributeCapableNode>
  if (typeof candidate.hasAttribute !== 'function') return true

  return (
    !candidate.hasAttribute('data-export-exclude') &&
    !candidate.classList?.contains('react-flow__minimap')
  )
}

export function calculateExportCanvas<NodeType extends Node>(
  nodes: NodeType[],
  options: Pick<PngExportOptions, 'maxDimension' | 'padding' | 'pixelRatio'> = {},
): ExportCanvas {
  if (nodes.length === 0) {
    throw new Error('There are no visible map nodes to export.')
  }

  const bounds = getNodesBounds(nodes)
  if (bounds.width <= 0 || bounds.height <= 0) {
    throw new Error('The visible map has not finished rendering yet.')
  }

  const padding = ensurePositiveNumber(options.padding ?? 72, 72)
  const maxDimension = Math.min(
    4096,
    ensurePositiveNumber(options.maxDimension ?? 4096, 4096),
  )
  const pixelRatio = Math.min(
    3,
    ensurePositiveNumber(options.pixelRatio ?? 2, 2),
  )
  const naturalWidth = bounds.width + padding * 2
  const naturalHeight = bounds.height + padding * 2
  const scale = Math.min(1, maxDimension / Math.max(naturalWidth, naturalHeight))
  const width = Math.max(1, Math.round(naturalWidth * scale))
  const height = Math.max(1, Math.round(naturalHeight * scale))
  const scaledPadding = Math.max(1, Math.round(padding * scale))
  const safePixelRatio = Math.max(
    1,
    Math.min(
      pixelRatio,
      8192 / width,
      8192 / height,
      Math.sqrt(32_000_000 / (width * height)),
    ),
  )
  const viewport = getViewportForBounds(
    bounds,
    width,
    height,
    0.01,
    2,
    `${scaledPadding}px`,
  )

  return { bounds, width, height, pixelRatio: safePixelRatio, viewport }
}

export function triggerBlobDownload(
  blob: Blob,
  filename: string,
  environment: DownloadEnvironment = defaultDownloadEnvironment(),
): void {
  const objectUrl = environment.url.createObjectURL(blob)
  const anchor = environment.document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  anchor.hidden = true

  try {
    environment.document.body.append(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    environment.url.revokeObjectURL(objectUrl)
  }
}

export async function exportToPng<NodeType extends Node>(
  reactFlowInstance: ReactFlowInstance<NodeType>,
  elementSelector: string,
  options: PngExportOptions = {},
): Promise<void> {
  const root = options.rootElement ?? document
  const viewportElement = root.querySelector<HTMLElement>(elementSelector)
  if (!viewportElement) {
    throw new Error('The map canvas could not be found.')
  }

  const canvas = calculateExportCanvas(reactFlowInstance.getNodes(), options)
  await viewportElement.ownerDocument.fonts?.ready
  const { toBlob } = await import('html-to-image')
  const imageBlob = await toBlob(viewportElement, {
    backgroundColor: options.backgroundColor ?? '#f7f7f3',
    width: canvas.width,
    height: canvas.height,
    canvasWidth: Math.round(canvas.width * canvas.pixelRatio),
    canvasHeight: Math.round(canvas.height * canvas.pixelRatio),
    pixelRatio: 1,
    cacheBust: true,
    style: {
      width: `${canvas.width}px`,
      height: `${canvas.height}px`,
      transform: `translate(${canvas.viewport.x}px, ${canvas.viewport.y}px) scale(${canvas.viewport.zoom})`,
      transformOrigin: 'top left',
    },
    filter: (node) => shouldIncludeExportNode(node),
  })

  if (!imageBlob) {
    throw new Error('The browser could not generate the PNG image.')
  }

  triggerBlobDownload(imageBlob, options.filename ?? DEFAULT_PNG_FILENAME)
}

export function createCurriculumExport(
  curriculumData: Curriculum,
  completedTopicIds: ReadonlySet<string>,
  options: CurriculumExportOptions = {},
): CurriculumDataExport {
  const validTopicIds = curriculumData.weeks.flatMap((week) =>
    week.topics.map((topic) => topic.id),
  )
  const validTopicIdSet = new Set(validTopicIds)
  const completedIds = [...completedTopicIds]
    .filter((topicId) => validTopicIdSet.has(topicId))
    .sort()
  const completedIdSet = new Set(completedIds)
  const totalTopics = validTopicIds.length

  return {
    format: 'ma-theory-learning-map-export',
    version: 1,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    ...(options.activeView
      ? {
          activeView: {
            ...options.activeView,
            collapsedWeekIds: [...options.activeView.collapsedWeekIds].sort(),
            visibleTopicIds: [...options.activeView.visibleTopicIds],
          },
        }
      : {}),
    progress: {
      storageKey: PROGRESS_STORAGE_KEY,
      completedTopicIds: completedIds,
      completedTopics: completedIds.length,
      totalTopics,
      percentage: totalTopics
        ? Math.round((completedIds.length / totalTopics) * 100)
        : 0,
    },
    curriculum: {
      title: curriculumData.title,
      description: curriculumData.description,
      weeks: curriculumData.weeks.map((week) => ({
        ...week,
        topics: week.topics.map((topic) => ({
          ...topic,
          completed: completedIdSet.has(topic.id),
        })),
      })),
      sources: curriculumData.sources.map((source) => ({ ...source })),
    },
  }
}

export function exportToJson(
  curriculumData: Curriculum,
  completedTopicIds: ReadonlySet<string>,
  options: CurriculumExportOptions = {},
): CurriculumDataExport {
  const data = createCurriculumExport(curriculumData, completedTopicIds, options)
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: 'application/json;charset=utf-8',
  })
  triggerBlobDownload(blob, options.filename ?? DEFAULT_JSON_FILENAME)
  return data
}
