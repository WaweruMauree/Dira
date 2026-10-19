import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { env } from '../config/env.js'
import { createOpenRouterClient, hasOpenRouter } from '../lib/openrouter.js'
import { HttpError } from '../middleware/error.js'
import { sanitizeAiPunctuation } from '../lib/copyStyle.js'
import { MODE_SYSTEM, resolveTools } from '../lib/toolSchemas.js'
import { throwIfError } from '../lib/helpers.js'

export type AgentRequestBody = {
  conversationId?: string
  chatId?: string
  mode?: 'general' | 'career_guidance' | 'job_aggregation'
  userMessage?: string
  tools?: unknown
  toolResults?: Array<{
    toolCallId: string
    name: string
    output?: unknown
    error?: string
  }>
  profileContext?: Record<string, unknown>
}

export type PendingToolCall = {
  id: string
  name: string
  status: 'pending'
  input: Record<string, unknown>
}

async function loadOrCreateConversation(
  supabase: SupabaseClient,
  userId: string,
  body: AgentRequestBody
) {
  const id = body.conversationId || body.chatId
  const mode = body.mode ?? 'general'

  if (id) {
    const { data, error } = await supabase.from('conversations').select('*').eq('id', id).maybeSingle()
    throwIfError(error)
    if (data) return data
  }

  const insert: Record<string, unknown> = {
    user_id: userId,
    mode,
    title: 'New conversation',
    preview: '',
  }
  if (id) insert.id = id

  const { data, error } = await supabase.from('conversations').insert(insert).select('*').single()
  throwIfError(error)
  return data
}

async function loadHistory(supabase: SupabaseClient, conversationId: string) {
  const { data, error } = await supabase
    .from('conversation_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  throwIfError(error)
  return data ?? []
}

function parseArgs(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return { raw }
  }
}

function toOpenAiHistory(rows: Array<Record<string, unknown>>): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = []
  for (const row of rows) {
    const role = row.role as string
    const content = (row.content as string) ?? ''
    if (role === 'user') {
      messages.push({ role: 'user', content })
    } else if (role === 'assistant') {
      const toolCalls = row.tool_calls as PendingToolCall[] | null
      if (toolCalls && toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: content || null,
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: JSON.stringify(tc.input ?? {}) },
          })),
        })
      } else {
        messages.push({ role: 'assistant', content })
      }
    } else if (role === 'tool') {
      messages.push({
        role: 'tool',
        tool_call_id: (row.tool_call_id as string) || 'unknown',
        content: content || JSON.stringify({ ok: true }),
      })
    } else if (role === 'system') {
      messages.push({ role: 'system', content })
    }
  }
  return messages
}

export async function runAgentTurn(opts: {
  supabase: SupabaseClient
  userId: string
  body: AgentRequestBody
}) {
  if (!hasOpenRouter()) {
    throw new HttpError(503, 'OPENROUTER_API_KEY is not configured')
  }

  const conversation = await loadOrCreateConversation(opts.supabase, opts.userId, opts.body)
  const conversationId = conversation.id as string
  const mode = (opts.body.mode ?? conversation.mode ?? 'general') as string
  const tools = resolveTools(opts.body.tools)

  if (opts.body.userMessage && opts.body.userMessage.trim()) {
    const { error } = await opts.supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: opts.body.userMessage.trim(),
    })
    throwIfError(error)

    const isFirst = (conversation.title as string) === 'New conversation'
    const preview = opts.body.userMessage.trim().slice(0, 80)
    const title = isFirst
      ? opts.body.userMessage.trim().slice(0, 48) + (opts.body.userMessage.trim().length > 48 ? '…' : '')
      : undefined
    await opts.supabase
      .from('conversations')
      .update({
        preview,
        ...(title ? { title } : {}),
        mode,
      })
      .eq('id', conversationId)
  }

  if (opts.body.toolResults && opts.body.toolResults.length > 0) {
    const rows = opts.body.toolResults.map((result) => ({
      conversation_id: conversationId,
      role: 'tool' as const,
      name: result.name,
      tool_call_id: result.toolCallId,
      content: result.error
        ? JSON.stringify({ error: result.error })
        : JSON.stringify(result.output ?? {}),
    }))
    const { error } = await opts.supabase.from('conversation_messages').insert(rows)
    throwIfError(error)
  }

  const history = await loadHistory(opts.supabase, conversationId)
  const toolRounds = history.filter(
    (row) => row.role === 'assistant' && Array.isArray(row.tool_calls) && (row.tool_calls as unknown[]).length > 0
  ).length
  const allowTools = toolRounds < 8
  const system = MODE_SYSTEM[mode] ?? MODE_SYSTEM.general
  const profileNote = opts.body.profileContext
    ? `\nStudent context JSON: ${JSON.stringify(opts.body.profileContext)}`
    : ''

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: `${system}${profileNote}` },
    ...toOpenAiHistory(history),
  ]

  const client = createOpenRouterClient()
  const completion = await client.chat.completions.create({
    model: env.OPENROUTER_MODEL,
    messages,
    tools: allowTools && tools.length > 0 ? tools : undefined,
    tool_choice: allowTools && tools.length > 0 ? 'auto' : undefined,
    temperature: 0.4,
  })

  const choice = completion.choices[0]
  if (!choice) {
    throw new HttpError(502, 'Empty response from model')
  }

  const toolCalls = (choice.message.tool_calls ?? []).filter(
    (tc): tc is Extract<typeof tc, { type?: 'function'; function: { name: string; arguments: string } }> =>
      'function' in tc && Boolean(tc.function)
  )
  if (toolCalls.length > 0) {
    const pending: PendingToolCall[] = toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      status: 'pending',
      input: parseArgs(tc.function.arguments),
    }))

    const toolRoundContent = sanitizeAiPunctuation(choice.message.content ?? '')
    const { data: assistantRow, error } = await opts.supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: toolRoundContent,
        tool_calls: pending,
      })
      .select('*')
      .single()
    throwIfError(error)

    return {
      conversationId,
      status: 'requires_action' as const,
      toolCalls: pending,
      message: assistantRow
        ? {
            id: assistantRow.id,
            role: 'assistant' as const,
            content: assistantRow.content ?? '',
            toolCalls: pending,
            createdAt: assistantRow.created_at,
          }
        : undefined,
    }
  }

  const content =
    sanitizeAiPunctuation(choice.message.content?.trim() || '') ||
    'I did not produce a reply. Please try again.'
  const { data: assistantRow, error } = await opts.supabase
    .from('conversation_messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content,
    })
    .select('*')
    .single()
  throwIfError(error)

  await opts.supabase
    .from('conversations')
    .update({ preview: content.slice(0, 80) })
    .eq('id', conversationId)

  return {
    conversationId,
    status: 'complete' as const,
    message: {
      id: assistantRow.id,
      role: 'assistant' as const,
      content,
      createdAt: assistantRow.created_at,
    },
  }
}
