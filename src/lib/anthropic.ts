import Anthropic from '@anthropic-ai/sdk'
import { AppState, QuizQuestion } from '../types'

const SYSTEM_PROMPT = `You are a context profile synthesizer. You receive raw information about a person — their background, goals, communication style, current projects, and the key people in their life.

Your job is to synthesize all of this into a single, coherent Context Profile written in the second person ("You are..."). This profile should read like a system prompt that could be given to an AI assistant to deeply understand this person.

Structure the profile with these sections:
- Who You Are (identity, role, background)
- Your Goals & Priorities
- How You Communicate
- Your Current World (projects, situations)
- Key People in Your Life (for each person: who they are, the dynamic, how to factor them in)
- Key Things (companies, organizations, tools, communities — what they are, the dynamic, why they matter)
- Writing & Communication Style (how they write across different contexts — tone, patterns, preferences)
- Values, Preferences & Working Style (what matters to them, pet peeves, how they make decisions, tools they use)

Be specific and concrete. Use the person's own words and details where possible. Don't add information that wasn't provided. Write in a warm but direct tone.`

function buildUserData(state: AppState): string {
  const sections: string[] = []

  const { freeTexts, form } = state.aboutYou

  const formFields: [string, string][] = [
    ['Name', form.name],
    ['Pronouns', form.pronouns],
    ['Location / Timezone', form.location],
    ['Age', form.age],
    ['Role', form.role],
  ]
  const filledFields = formFields.filter(([, v]) => v?.trim())
  if (filledFields.length > 0) {
    sections.push('## Basic Info')
    for (const [label, value] of filledFields) {
      sections.push(`${label}: ${value}`)
    }
  }

  const topicLabels: Record<string, string> = {
    background: 'Background',
    goals: 'Goals & Priorities',
    currentProjects: 'Current Projects',
    communicationStyle: 'Communication Style',
    values: 'Values & Principles',
    petPeeves: 'Pet Peeves',
    tools: 'Tools & Platforms',
    availability: 'Availability & Schedule',
    decisionStyle: 'Decision-Making Style',
  }
  const filledTopics = Object.entries(state.aboutYou.topics || {}).filter(([, entries]) => {
    if (Array.isArray(entries)) return entries.length > 0
    return (entries as any)?.content?.trim()
  })
  if (filledTopics.length > 0) {
    sections.push('## Detailed Profile')
    for (const [key, entries] of filledTopics) {
      if (Array.isArray(entries)) {
        for (const entry of entries) {
          sections.push(`### ${topicLabels[key] || key} — ${entry.label}\n${entry.content}`)
        }
      } else {
        sections.push(`### ${topicLabels[key] || key}\n${(entries as any).content}`)
      }
    }
  }

  if (freeTexts.length > 0) {
    sections.push('## Free-form Notes')
    for (const entry of freeTexts) {
      sections.push(entry.content)
    }
  }

  const uploads = state.aboutYou.uploads || []
  if (uploads.length > 0) {
    for (const upload of uploads) {
      const meta: string[] = []
      if (upload.documentType) meta.push(`Type: ${upload.documentType}`)
      if (upload.description) meta.push(`Description: ${upload.description}`)
      const header = meta.length > 0 ? `## Uploaded: ${upload.name}\n${meta.join('\n')}\n\n` : `## Uploaded: ${upload.name}\n`
      sections.push(`${header}${upload.content}`)
    }
  }

  const answeredQuestions = (state.aboutYou.quizQuestions || []).filter((q) => q.answer.trim())
  if (answeredQuestions.length > 0) {
    sections.push('## AI-Guided Interview Answers')
    for (const q of answeredQuestions) {
      sections.push(`**${q.question}**\n${q.answer}`)
    }
  }

  const styleCategories = Object.entries(state.styles || {}).filter(
    ([, entry]) => entry.tone || entry.examples || entry.notes
  )
  if (styleCategories.length > 0) {
    sections.push('## Writing & Communication Style')
    for (const [category, entry] of styleCategories) {
      const lines = [`### ${category.charAt(0).toUpperCase() + category.slice(1)}`]
      if (entry.tone) lines.push(`Tone: ${entry.tone}`)
      if (entry.examples) lines.push(`Examples:\n${entry.examples}`)
      if (entry.notes) lines.push(`Notes: ${entry.notes}`)
      sections.push(lines.join('\n'))
    }
  }

  if (state.people.length > 0) {
    sections.push('## Key People')
    for (const person of state.people) {
      const lines = [`### ${person.name} (${person.relationship})`]
      if (person.personality) lines.push(`Personality/Style: ${person.personality}`)
      if (person.currentDynamic) lines.push(`Current Dynamic: ${person.currentDynamic}`)
      if (person.whyTheyMatter) lines.push(`Why They Matter: ${person.whyTheyMatter}`)
      if (person.stylePreference) lines.push(`Writing Style: ${person.stylePreference}`)
      if (person.notes?.length > 0) {
        lines.push(`Notes:\n${person.notes.map((n) => `- ${n.content}`).join('\n')}`)
      }
      sections.push(lines.join('\n'))
    }
  }

  if (state.things.length > 0) {
    sections.push('## Key Things')
    for (const thing of state.things) {
      const lines = [`### ${thing.name} (${thing.category})`]
      if (thing.description) lines.push(`Description: ${thing.description}`)
      if (thing.currentDynamic) lines.push(`Current Dynamic: ${thing.currentDynamic}`)
      if (thing.whyItMatters) lines.push(`Why It Matters: ${thing.whyItMatters}`)
      sections.push(lines.join('\n'))
    }
  }

  return sections.join('\n\n')
}

const QUIZ_SYSTEM_PROMPT = `You are a personal context interviewer. The user will tell you what they want to express about themselves. Your job is to generate a set of 6-10 questions that would help an AI deeply understand that aspect of the person.

Mix question types:
- Multiple-choice questions (3-4 options each) for things that are easier to pick from
- Free-text questions for things that need the person's own words

Return ONLY a JSON array of question objects. Each object has:
- "id": a unique short string (e.g. "q1", "q2")
- "question": the question text
- "type": either "multiple-choice" or "free-text"
- "options": array of option strings (only for multiple-choice, omit for free-text)

Make questions specific and insightful based on what the user wants to express. Go beyond surface level — ask things that would reveal personality, values, and nuance.

Return ONLY valid JSON, no markdown fences, no explanation.`

export async function generateQuiz(apiKey: string, prompt: string): Promise<QuizQuestion[]> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: QUIZ_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  if (!textBlock) throw new Error('No response from AI')

  const questions: QuizQuestion[] = JSON.parse(textBlock.text).map((q: any) => ({
    ...q,
    answer: '',
  }))
  return questions
}

export async function generateProfile(state: AppState): Promise<string> {
  const client = new Anthropic({ apiKey: state.settings.apiKey, dangerouslyAllowBrowser: true })
  const userData = buildUserData(state)

  if (!userData.trim()) {
    throw new Error('No data to generate a profile from. Add some information about yourself first.')
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userData }],
  })

  const textBlock = message.content.find((block) => block.type === 'text')
  return textBlock ? textBlock.text : ''
}
