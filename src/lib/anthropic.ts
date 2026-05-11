import Anthropic from '@anthropic-ai/sdk'
import { AppState } from '../types'

const SYSTEM_PROMPT = `You are a context profile synthesizer. You receive raw information about a person — their background, goals, communication style, current projects, and the key people in their life.

Your job is to synthesize all of this into a single, coherent Context Profile written in the second person ("You are..."). This profile should read like a system prompt that could be given to an AI assistant to deeply understand this person.

Structure the profile with these sections:
- Who You Are (identity, role, background)
- Your Goals & Priorities
- How You Communicate
- Your Current World (projects, situations)
- Key People in Your Life (for each person: who they are, the dynamic, how to factor them in)

Be specific and concrete. Use the person's own words and details where possible. Don't add information that wasn't provided. Write in a warm but direct tone.`

function buildUserData(state: AppState): string {
  const sections: string[] = []

  const { freeText, uploadedText, form } = state.aboutYou

  if (form.name || form.role || form.goals || form.communicationStyle || form.background || form.currentProjects) {
    sections.push('## Structured Info')
    if (form.name) sections.push(`Name: ${form.name}`)
    if (form.role) sections.push(`Role: ${form.role}`)
    if (form.goals) sections.push(`Goals: ${form.goals}`)
    if (form.communicationStyle) sections.push(`Communication Style: ${form.communicationStyle}`)
    if (form.background) sections.push(`Background: ${form.background}`)
    if (form.currentProjects) sections.push(`Current Projects: ${form.currentProjects}`)
  }

  if (freeText.trim()) {
    sections.push(`## Free-form Text\n${freeText}`)
  }

  if (uploadedText.trim()) {
    sections.push(`## Uploaded Document Content\n${uploadedText}`)
  }

  if (state.people.length > 0) {
    sections.push('## Key People')
    for (const person of state.people) {
      const lines = [`### ${person.name} (${person.relationship})`]
      if (person.personality) lines.push(`Personality/Style: ${person.personality}`)
      if (person.currentDynamic) lines.push(`Current Dynamic: ${person.currentDynamic}`)
      if (person.whyTheyMatter) lines.push(`Why They Matter: ${person.whyTheyMatter}`)
      sections.push(lines.join('\n'))
    }
  }

  return sections.join('\n\n')
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
