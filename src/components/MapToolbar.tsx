import type { WeekNumber } from '../types/curriculum'
import type { LayoutDirection } from '../lib/layoutGraph'
import { ExportMenu } from './ExportMenu'
import { FitIcon, LayoutIcon, SearchIcon } from './icons'

interface MapToolbarProps {
  query: string
  activeWeek: WeekNumber | 'all'
  direction: LayoutDirection
  hasFilters: boolean
  onQueryChange: (query: string) => void
  onWeekChange: (week: WeekNumber | 'all') => void
  onDirectionChange: (direction: LayoutDirection) => void
  onFitView: () => void
  onExpandAll: () => void
  onCollapseAll: () => void
  onClear: () => void
  canExpand: boolean
  canCollapse: boolean
  isGeneratingPng: boolean
  canExportPng: boolean
  onExportPng: () => void
  onExportJson: () => void
}

export function MapToolbar({
  query,
  activeWeek,
  direction,
  hasFilters,
  onQueryChange,
  onWeekChange,
  onDirectionChange,
  onFitView,
  onExpandAll,
  onCollapseAll,
  onClear,
  canExpand,
  canCollapse,
  isGeneratingPng,
  canExportPng,
  onExportPng,
  onExportJson,
}: MapToolbarProps) {
  return (
    <section className="map-toolbar" aria-label="Map search and filters">
      <label className="search-field">
        <span className="sr-only">Search topics and subtopics</span>
        <SearchIcon />
        <input
          type="search"
          value={query}
          placeholder="Search topics or subtopics"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="week-filter" role="group" aria-label="Filter by week">
        {(['all', 2, 3, 6] as const).map((week) => (
          <button
            key={week}
            type="button"
            className={activeWeek === week ? 'is-active' : ''}
            aria-pressed={activeWeek === week}
            onClick={() => onWeekChange(week)}
          >
            {week === 'all' ? 'All weeks' : `Week ${week}`}
          </button>
        ))}
      </div>

      <div className="toolbar-actions">
        <div className="layout-switch" role="group" aria-label="Map layout direction">
          <LayoutIcon />
          <button
            type="button"
            aria-pressed={direction === 'TB'}
            className={direction === 'TB' ? 'is-active' : ''}
            onClick={() => onDirectionChange('TB')}
            title="Top-to-bottom layout"
          >
            Vertical
          </button>
          <button
            type="button"
            aria-pressed={direction === 'LR'}
            className={direction === 'LR' ? 'is-active' : ''}
            onClick={() => onDirectionChange('LR')}
            title="Left-to-right layout"
          >
            Horizontal
          </button>
        </div>
        <button className="toolbar-button" type="button" onClick={onFitView}>
          <FitIcon />
          Fit map
        </button>
        <div className="branch-actions" role="group" aria-label="Week branches">
          <button
            className="toolbar-button"
            type="button"
            disabled={!canExpand}
            onClick={onExpandAll}
          >
            Expand all
          </button>
          <button
            className="toolbar-button"
            type="button"
            disabled={!canCollapse}
            onClick={onCollapseAll}
          >
            Collapse all
          </button>
        </div>
        <ExportMenu
          isGeneratingPng={isGeneratingPng}
          canExportPng={canExportPng}
          onExportPng={onExportPng}
          onExportJson={onExportJson}
        />
        <button
          className="clear-button"
          type="button"
          onClick={onClear}
          disabled={!hasFilters}
        >
          Clear filters
        </button>
      </div>
    </section>
  )
}
