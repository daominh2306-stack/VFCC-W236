export type WeekNumber = 2 | 3 | 6

export type SourceType =
  | 'Paper'
  | 'Book'
  | 'Guide'
  | 'Website'
  | 'Professional standard'

export type SourcePriority = 'Core' | 'Recommended'

export interface CurriculumSource {
  id: string
  title: string
  citation: string
  type: SourceType
  priority: SourcePriority
  url?: string
  verificationNote?: string
}

export interface CurriculumTopic {
  id: string
  title: string
  summary: string
  learningQuestions: string[]
  subtopics: string[]
  sourceIds: string[]
}

export interface CurriculumWeek {
  id: string
  number: WeekNumber
  label: string
  title: string
  summary: string
  topics: CurriculumTopic[]
}

export interface Curriculum {
  title: string
  description: string
  weeks: CurriculumWeek[]
  sources: CurriculumSource[]
}

export interface TopicWithWeek {
  topic: CurriculumTopic
  week: CurriculumWeek
}
