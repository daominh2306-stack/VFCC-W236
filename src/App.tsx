import { useCallback, useState } from 'react'
import { ProgressSummary } from './components/ProgressSummary'
import { TheoryMap } from './components/TheoryMap'
import { curriculum } from './data/curriculum'
import { useStudyProgress } from './hooks/useStudyProgress'

export default function App() {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const { completedTopicIds, toggleTopic, resetProgress } = useStudyProgress()

  const selectTopic = useCallback((topicId: string | null) => {
    setSelectedTopicId(topicId)
  }, [])

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="M&A Theory Learning Map home">
          <span className="brand__mark" aria-hidden="true">M<span>&amp;</span>A</span>
          <span className="brand__text">
            <strong>VFCC Prep</strong>
            <small>Theory learning map</small>
          </span>
        </a>
        <span className="site-header__note">Weeks 2 · 3 · 6</span>
      </header>

      <main id="main-content">
        <section className="hero" id="top" aria-labelledby="page-title">
          <div className="hero__copy">
            <span className="section-kicker">Vietnam Finance Case Competition</span>
            <h1 id="page-title">Build the theory.<br />Defend the deal.</h1>
            <p>{curriculum.description}</p>
            <a className="hero__action" href="#learning-map">Explore the map <span>↓</span></a>
          </div>
          <div className="hero__path" aria-hidden="true">
            {curriculum.weeks.map((week, index) => (
              <div className={`hero-step week-theme-${week.number}`} key={week.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{week.label}</strong>
                <small>{week.title}</small>
              </div>
            ))}
          </div>
        </section>

        <ProgressSummary
          weeks={curriculum.weeks}
          completedTopicIds={completedTopicIds}
          onReset={resetProgress}
        />

        <div id="learning-map">
          <TheoryMap
            completedTopicIds={completedTopicIds}
            selectedTopicId={selectedTopicId}
            onSelectTopic={selectTopic}
            onToggleComplete={toggleTopic}
          />
        </div>
      </main>

      <footer className="site-footer">
        <p>VFCC preparation resource · Sources remain the authority for academic content.</p>
        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  )
}
