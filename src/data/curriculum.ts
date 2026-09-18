import curriculumJson from '../../data/curriculum.json'
import type {
  Curriculum,
  CurriculumSource,
  TopicWithWeek,
} from '../types/curriculum'
import { validateCurriculum } from '../lib/validateCurriculum'

const rawCurriculum: unknown = curriculumJson
validateCurriculum(rawCurriculum)

export const curriculum: Curriculum = rawCurriculum

const sourceIndex = new Map(
  curriculum.sources.map((source) => [source.id, source]),
)

const topicIndex = new Map<string, TopicWithWeek>()

for (const week of curriculum.weeks) {
  for (const topic of week.topics) {
    topicIndex.set(topic.id, { topic, week })
  }
}

export function getTopic(topicId: string): TopicWithWeek | undefined {
  return topicIndex.get(topicId)
}

export function resolveSources(sourceIds: string[]): CurriculumSource[] {
  return sourceIds.flatMap((sourceId) => {
    const source = sourceIndex.get(sourceId)
    return source ? [source] : []
  })
}
