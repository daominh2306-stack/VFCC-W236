export function MapLegend() {
  return (
    <div className="legend" aria-label="Map legend">
      <span><i className="legend__root" aria-hidden="true" />Root</span>
      <span><i className="legend__week" aria-hidden="true" />Week</span>
      <span><i className="legend__topic" aria-hidden="true" />Topic</span>
      <span><i className="legend__complete" aria-hidden="true">✓</i>Completed</span>
    </div>
  )
}
