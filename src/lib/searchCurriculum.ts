import type { Curriculum, CurriculumTopic } from '../types/curriculum'

function topicSearchText(topic: CurriculumTopic): string {
  return [topic.title, topic.summary, ...topic.subtopics].join(' ').toLowerCase()
}

export function findMatchingTopicIds(
  curriculum: Curriculum,
  query: string,
): Set<string> {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return new Set(
      curriculum.weeks.flatMap((week) => week.topics.map((topic) => topic.id)),
    )
  }

  return new Set(
    curriculum.weeks.flatMap((week) =>
      week.topics
        .filter((topic) => topicSearchText(topic).includes(normalizedQuery))
        .map((topic) => topic.id),
    ),
  )
}
