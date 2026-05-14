import Anthropic from '@anthropic-ai/sdk'
import { AppState, TopicKey } from '../types'

const TOPIC_KEYS: TopicKey[] = [
  'background', 'goals', 'currentProjects', 'communicationStyle',
  'values', 'petPeeves', 'tools', 'availability', 'decisionStyle',
]

export function buildChatSystemPrompt(state: AppState): string {
  const parts: string[] = []

  parts.push(`You are the AI assistant for context.ai, a personal context builder app. The user talks to you naturally about their life, work, relationships, and preferences, and you organize their information into the right sections of their profile using the tools available to you.

When the user shares information, figure out where it belongs and save it using the appropriate tool. You can:
- Save general notes as free text entries
- Add people to their People section
- Add things (companies, organizations, schools, products, communities) to their Things section
- Add entries to specific topics (background, goals, projects, communication style, values, pet peeves, tools, schedule, decision making)
- Update writing style preferences

Be conversational, warm, and brief. After saving, confirm what you did in a sentence or two. If unsure where something belongs, ask.

Organize and clean up the user's words before saving. They might ramble or speak casually — distill their meaning into clear, well-written notes while preserving their voice.`)

  const context: string[] = []
  const { form } = state.aboutYou
  if (form.name) context.push(`User's name: ${form.name}`)
  if (form.role) context.push(`Role: ${form.role}`)
  if (state.aboutYou.freeTexts.length > 0)
    context.push(`Free text entries: ${state.aboutYou.freeTexts.length}`)
  if (state.people.length > 0)
    context.push(`People: ${state.people.map((p) => `${p.name} (${p.relationship})`).join(', ')}`)
  if (state.things.length > 0)
    context.push(`Things: ${state.things.map((t) => `${t.name} (${t.category})`).join(', ')}`)
  const filled = TOPIC_KEYS.filter((k) => state.aboutYou.topics[k]?.length > 0)
  if (filled.length > 0) context.push(`Filled topics: ${filled.join(', ')}`)

  if (context.length > 0) {
    parts.push(`\nCurrent profile state:\n${context.join('\n')}`)
  }

  return parts.join('\n')
}

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'add_free_text',
    description:
      "Add a free text entry to the user's About You section. Use for general notes, thoughts, or anything that doesn't fit a specific category.",
    input_schema: {
      type: 'object' as const,
      properties: {
        content: {
          type: 'string',
          description: "The text to save. Clean up and organize the user's words into a clear note.",
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'add_person',
    description:
      'Add a new person to the People section. Use when the user mentions someone important in their life.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: "Person's name" },
        relationship: { type: 'string', description: 'Relationship to the user' },
        personality: { type: 'string', description: 'Their personality or notable traits' },
        currentDynamic: { type: 'string', description: "What's going on in this relationship" },
        whyTheyMatter: { type: 'string', description: 'Why this person is significant' },
      },
      required: ['name', 'relationship'],
    },
  },
  {
    name: 'add_thing',
    description:
      'Add a thing (company, organization, school, product, community, place) to the Things section. Use when the user mentions an important entity in their life or work.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Name of the thing' },
        category: { type: 'string', enum: ['Company', 'Organization', 'School', 'Product', 'Community', 'Place', 'Other'], description: 'Category of the thing' },
        description: { type: 'string', description: 'What this thing is' },
        currentDynamic: { type: 'string', description: "The user's current relationship or situation with this thing" },
        whyItMatters: { type: 'string', description: 'Why this thing is important to the user' },
      },
      required: ['name', 'category'],
    },
  },
  {
    name: 'add_topic_entry',
    description: "Add a new entry to a specific topic in the user's profile. Topics can have multiple entries.",
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: {
          type: 'string',
          enum: TOPIC_KEYS,
          description: 'The topic to add to',
        },
        label: { type: 'string', description: 'A short name/label for this entry' },
        content: { type: 'string', description: 'The organized content for this entry' },
      },
      required: ['topic', 'label', 'content'],
    },
  },
  {
    name: 'set_style',
    description: 'Update a writing style category with tone, examples, or notes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          enum: ['personal', 'work', 'email', 'social', 'other'],
          description: 'Which style context to update',
        },
        tone: { type: 'string', description: 'Tone and voice description' },
        examples: { type: 'string', description: 'Example messages' },
        notes: { type: 'string', description: 'Additional style notes' },
      },
      required: ['category'],
    },
  },
]

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function sendChatMessage(
  apiKey: string,
  systemPrompt: string,
  apiMessages: any[],
  onToolCall: (name: string, input: any) => string
): Promise<{ text: string; newApiMessages: any[] }> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const messages = [...apiMessages]
  let allText = ''

  for (let i = 0; i < 10; i++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      tools: CHAT_TOOLS,
      messages,
    })

    for (const block of response.content) {
      if (block.type === 'text' && block.text.trim()) {
        if (allText) allText += '\n\n'
        allText += block.text
      }
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolUses = response.content.filter(
      (b: any): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
    )

    if (toolUses.length === 0 || response.stop_reason !== 'tool_use') break

    const toolResults = toolUses.map((tu) => ({
      type: 'tool_result' as const,
      tool_use_id: tu.id,
      content: onToolCall(tu.name, tu.input),
    }))

    messages.push({ role: 'user', content: toolResults })
  }

  return { text: allText, newApiMessages: messages }
}
