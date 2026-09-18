import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type ReactFlowInstance,
} from '@xyflow/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import '@xyflow/react/dist/style.css'
import { curriculum, getTopic } from '../data/curriculum'
import { buildGraph } from '../lib/buildGraph'
import { exportToJson, exportToPng } from '../lib/exportMap'
import { layoutGraph, type LayoutDirection } from '../lib/layoutGraph'
import type { WeekNumber } from '../types/curriculum'
import type { LearningFlowNode } from '../types/graph'
import { LearningNode } from './LearningNode'
import { MapLegend } from './MapLegend'
import { MapToolbar } from './MapToolbar'
import { TopicPanel } from './TopicPanel'

const nodeTypes = { learning: LearningNode }

type ExportNotice = {
  tone: 'status' | 'success' | 'error'
  message: string
}

interface TheoryMapProps {
  completedTopicIds: ReadonlySet<string>
  selectedTopicId: string | null
  onSelectTopic: (topicId: string | null) => void
  onToggleComplete: (topicId: string) => void
}

function minimapNodeColor(node: LearningFlowNode): string {
  if (node.data.kind === 'root') return '#173f3a'
  if (node.data.weekNumber === 2) return '#3e6f65'
  if (node.data.weekNumber === 3) return '#9a6338'
  if (node.data.weekNumber === 6) return '#586b92'
  return '#8a8f8b'
}

export function TheoryMap({
  completedTopicIds,
  selectedTopicId,
  onSelectTopic,
  onToggleComplete,
}: TheoryMapProps) {
  const [query, setQuery] = useState('')
  const [activeWeek, setActiveWeek] = useState<WeekNumber | 'all'>('all')
  const [direction, setDirection] = useState<LayoutDirection>('TB')
  const [isCompactViewport, setIsCompactViewport] = useState(
    () => window.matchMedia('(max-width: 560px)').matches,
  )
  const [collapsedWeekIds, setCollapsedWeekIds] = useState<Set<string>>(
    () => new Set(curriculum.weeks.map((week) => week.id)),
  )
  const [isGeneratingPng, setIsGeneratingPng] = useState(false)
  const [exportNotice, setExportNotice] = useState<ExportNotice | null>(null)
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance<
    LearningFlowNode
  > | null>(null)
  const mapCanvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 560px)')
    const handleChange = (event: MediaQueryListEvent) => {
      setIsCompactViewport(event.matches)
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleWeek = useCallback((weekId: string) => {
    setCollapsedWeekIds((current) => {
      const next = new Set(current)
      if (next.has(weekId)) next.delete(weekId)
      else next.add(weekId)
      return next
    })
  }, [])

  const graph = useMemo(
    () =>
      buildGraph(curriculum, {
        activeWeek,
        query,
        collapsedWeekIds,
        completedTopicIds,
        selectedTopicId,
      }),
    [activeWeek, collapsedWeekIds, completedTopicIds, query, selectedTopicId],
  )

  const layoutedGraph = useMemo(() => {
    const interactiveNodes = graph.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onSelect: (topicId: string) => onSelectTopic(topicId),
        onToggleWeek: toggleWeek,
      },
    }))
    return layoutGraph(interactiveNodes, graph.edges, direction)
  }, [direction, graph.edges, graph.nodes, onSelectTopic, toggleWeek])

  const fitMap = useCallback(() => {
    const canvas = mapCanvasRef.current
    if (!flowInstance || !canvas || layoutedGraph.nodes.length === 0) return

    const bounds = layoutedGraph.nodes.reduce(
      (current, node) => {
        const width = node.width ?? node.initialWidth ?? 0
        const height = node.height ?? node.initialHeight ?? 0
        return {
          minX: Math.min(current.minX, node.position.x),
          minY: Math.min(current.minY, node.position.y),
          maxX: Math.max(current.maxX, node.position.x + width),
          maxY: Math.max(current.maxY, node.position.y + height),
        }
      },
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    )
    const graphWidth = bounds.maxX - bounds.minX
    const graphHeight = bounds.maxY - bounds.minY
    if (graphWidth <= 0 || graphHeight <= 0) return

    const paddingRatio = 0.18
    const minimumZoom = isCompactViewport ? 0.12 : 0.08
    const zoom = Math.min(
      1,
      Math.max(
        minimumZoom,
        Math.min(
          (canvas.clientWidth * (1 - paddingRatio * 2)) / graphWidth,
          (canvas.clientHeight * (1 - paddingRatio * 2)) / graphHeight,
        ),
      ),
    )
    const graphCenterX = bounds.minX + graphWidth / 2
    const graphCenterY = bounds.minY + graphHeight / 2

    void flowInstance.setViewport(
      {
        x: canvas.clientWidth / 2 - graphCenterX * zoom,
        y: canvas.clientHeight / 2 - graphCenterY * zoom,
        zoom,
      },
      { duration: 260 },
    )
  }, [flowInstance, isCompactViewport, layoutedGraph.nodes])

  useEffect(() => {
    if (!flowInstance || layoutedGraph.nodes.length === 0) return
    const frame = window.requestAnimationFrame(fitMap)
    return () => window.cancelAnimationFrame(frame)
  }, [activeWeek, collapsedWeekIds, direction, fitMap, flowInstance, query, layoutedGraph.nodes.length])

  const selected = selectedTopicId ? getTopic(selectedTopicId) : undefined

  const updateQuery = (nextQuery: string) => {
    setQuery(nextQuery)
    onSelectTopic(null)
  }

  const updateWeek = (week: WeekNumber | 'all') => {
    setActiveWeek(week)
    onSelectTopic(null)
  }

  const clearFilters = () => {
    setQuery('')
    setActiveWeek('all')
    onSelectTopic(null)
  }

  const expandAll = () => setCollapsedWeekIds(new Set())
  const collapseAll = () =>
    setCollapsedWeekIds(new Set(curriculum.weeks.map((week) => week.id)))

  const handleExportPng = useCallback(async () => {
    const rootElement = mapCanvasRef.current
    if (!flowInstance || !rootElement || !graph.hasMatches) {
      setExportNotice({
        tone: 'error',
        message: 'There is no visible map to export. Clear the filters and try again.',
      })
      return
    }

    setIsGeneratingPng(true)
    setExportNotice({ tone: 'status', message: 'Generating high-resolution image…' })
    try {
      await exportToPng(flowInstance, '.react-flow__viewport', {
        rootElement,
        backgroundColor: '#eeefea',
        filename: 'ma-theory-learning-map.png',
      })
      setExportNotice({
        tone: 'success',
        message: 'PNG export ready. Your download has started.',
      })
    } catch (error) {
      setExportNotice({
        tone: 'error',
        message:
          error instanceof Error
            ? `PNG export failed: ${error.message}`
            : 'PNG export failed. Please try again.',
      })
    } finally {
      setIsGeneratingPng(false)
    }
  }, [flowInstance, graph.hasMatches])

  const handleExportJson = useCallback(() => {
    try {
      exportToJson(curriculum, completedTopicIds, {
        filename: 'ma-theory-progress-and-map-data.json',
        activeView: {
          query,
          activeWeek,
          layoutDirection: direction,
          collapsedWeekIds: [...collapsedWeekIds],
          visibleTopicIds: graph.visibleTopicIds,
        },
      })
      setExportNotice({
        tone: 'success',
        message: 'Progress and curriculum JSON export ready. Your download has started.',
      })
    } catch (error) {
      setExportNotice({
        tone: 'error',
        message:
          error instanceof Error
            ? `JSON export failed: ${error.message}`
            : 'JSON export failed. Please try again.',
      })
    }
  }, [activeWeek, collapsedWeekIds, completedTopicIds, direction, graph.visibleTopicIds, query])

  return (
    <section className="map-section" aria-labelledby="map-heading">
      <div className="map-section__heading">
        <div>
          <span className="section-kicker">Explore the curriculum</span>
          <h2 id="map-heading">Theory map</h2>
        </div>
        <p>
          Select a topic to review the essential questions, subtopics, and sources.
        </p>
      </div>

      <MapToolbar
        query={query}
        activeWeek={activeWeek}
        direction={direction}
        hasFilters={query.length > 0 || activeWeek !== 'all'}
        onQueryChange={updateQuery}
        onWeekChange={updateWeek}
        onDirectionChange={setDirection}
        onFitView={fitMap}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onClear={clearFilters}
        canExpand={collapsedWeekIds.size > 0}
        canCollapse={collapsedWeekIds.size < curriculum.weeks.length}
        isGeneratingPng={isGeneratingPng}
        canExportPng={graph.hasMatches && flowInstance !== null}
        onExportPng={() => void handleExportPng()}
        onExportJson={handleExportJson}
      />

      {exportNotice ? (
        <div
          className={`export-notice export-notice--${exportNotice.tone}`}
          role={exportNotice.tone === 'error' ? 'alert' : 'status'}
          aria-live={exportNotice.tone === 'error' ? 'assertive' : 'polite'}
        >
          <span>{exportNotice.message}</span>
          <button
            type="button"
            aria-label="Dismiss export notification"
            onClick={() => setExportNotice(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className={`map-workspace ${selected ? 'map-workspace--panel-open' : ''}`}>
        <div
          ref={mapCanvasRef}
          className="map-canvas"
          aria-label="Interactive M&A learning map"
        >
          {graph.hasMatches ? (
            <ReactFlow
              nodes={layoutedGraph.nodes}
              edges={layoutedGraph.edges}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              nodesConnectable={false}
              panOnScroll
              zoomOnDoubleClick={false}
              minZoom={isCompactViewport ? 0.12 : 0.08}
              maxZoom={1.6}
              onInit={setFlowInstance}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={22}
                size={1.2}
                color="#c9cec8"
              />
              <Controls
                position="bottom-left"
                showInteractive={false}
                aria-label="Map zoom and fit controls"
              />
              <MiniMap
                className="learning-minimap"
                position="bottom-right"
                pannable
                zoomable
                nodeColor={minimapNodeColor}
                nodeStrokeWidth={2}
                aria-label="Learning map overview"
              />
            </ReactFlow>
          ) : (
            <div className="map-empty" role="status">
              <span>No matching topics</span>
              <p>Try a broader search or clear the current filters.</p>
              <button type="button" onClick={clearFilters}>Clear all</button>
            </div>
          )}
        </div>

        {selected ? (
          <TopicPanel
            key={selected.topic.id}
            topic={selected.topic}
            week={selected.week}
            completed={completedTopicIds.has(selected.topic.id)}
            onToggleComplete={() => onToggleComplete(selected.topic.id)}
            onClose={() => onSelectTopic(null)}
          />
        ) : null}
      </div>

      <div className="map-caption">
        <p aria-live="polite">
          {query
            ? `${graph.visibleTopicIds.length} matching ${graph.visibleTopicIds.length === 1 ? 'topic' : 'topics'}`
            : 'Drag to pan · Scroll or pinch to zoom · Use Tab to reach nodes'}
        </p>
        <MapLegend />
      </div>
    </section>
  )
}
