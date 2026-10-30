import type { SupabaseClient } from '@supabase/supabase-js'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { env } from '../config/env.js'
import { createOpenRouterClient, hasOpenRouter, mapOpenRouterError } from '../lib/openrouter.js'
import { HttpError } from '../middleware/error.js'
import { sanitizeAiPunctuation } from '../lib/copyStyle.js'
import { MODE_SYSTEM, resolveTools } from '../lib/toolSchemas.js'
import { throwIfError } from '../lib/helpers.js'

export type ChatAttachment = {
  name: string
  mime: string
  kind: 'image' | 'document'
  text?: string
  dataUrl?: string
  path?: string
  url?: string
}

export type AgentRequestBody = {
  conversationId?: string
  chatId?: string
  mode?: 'general' | 'career_guidance' | 'job_aggregation'
  userMessage?: string
  attachments?: ChatAttachment[]
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
  status: 'pending' | 'complete' | 'error'
  input: Record<string, unknown>
  output?: Record<string, unknown>
}

const ARTIFACT_TOOL_NAMES = new Set(['buildCv', 'cvBuilder', 'exportMarkdownDocument'])

function compactArtifactOutput(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!o.artifact) return null
  if (typeof o.markdown !== 'string' || !o.markdown.trim()) return null
  return {
    title: o.title ?? 'Document',
    markdown: o.markdown.slice(0, 24_000),
    filename: o.filename ?? 'document.docx',
    artifactType: o.artifactType ?? 'document',
    artifact: true,
  }
}

async function patchAssistantToolOutputs(
  supabase: SupabaseClient,
  conversationId: string,
  toolResults: Array<{ toolCallId: string; name: string; output?: unknown; error?: string }>
) {
  const { data: rows, error } = await supabase
    .from('conversation_messages')
    .select('id, tool_calls')
    .eq('conversation_id', conversationId)
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(5)
  throwIfError(error)
  const assistant = (rows ?? []).find(
    (row) => Array.isArray(row.tool_calls) && (row.tool_calls as unknown[]).length > 0
  )
  if (!assistant) return

  const byId = new Map(toolResults.map((r) => [r.toolCallId, r]))
  const toolCalls = (assistant.tool_calls as PendingToolCall[]).map((tc) => {
    const result = byId.get(tc.id)
    if (!result) return tc
    if (result.error) {
      return { ...tc, status: 'error' as const, output: { error: result.error } }
    }
    if (ARTIFACT_TOOL_NAMES.has(result.name)) {
      const compact = compactArtifactOutput(result.output)
      if (compact) {
        return { ...tc, status: 'complete' as const, output: compact }
      }
    }
    return { ...tc, status: 'complete' as const, output: result.output as Record<string, unknown> }
  })

  const { error: updateError } = await supabase
    .from('conversation_messages')
    .update({ tool_calls: toolCalls })
    .eq('id', assistant.id)
  throwIfError(updateError)
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

function storedAttachments(raw: unknown): ChatAttachment[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((item) => item && typeof item === 'object') as ChatAttachment[]
}

function attachmentsForStorage(items: ChatAttachment[] | undefined) {
  if (!items?.length) return null
  return items.map((a) => ({
    name: a.name,
    mime: a.mime,
    kind: a.kind,
    text: a.text?.slice(0, 12_000),
    path: a.path,
    url: a.url,
  }))
}

type UserContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

const PROFILE_CONTEXT_MAX_CHARS = 6_000

function trimProfileContext(raw: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const out: Record<string, unknown> = { ...raw }
  if (Array.isArray(out.skills) && out.skills.length > 40) {
    out.skills = out.skills.slice(0, 40)
  }
  if (Array.isArray(out.interests) && out.interests.length > 20) {
    out.interests = out.interests.slice(0, 20)
  }
  if (Array.isArray(out.uploadedFiles)) {
    out.uploadedFiles = (out.uploadedFiles as Array<{ name?: string; text?: string; kind?: string }>).map(
      (f) => ({
        name: f.name,
        kind: f.kind,
        text: typeof f.text === 'string' ? f.text.slice(0, 4_000) : undefined,
      })
    )
  }
  const json = JSON.stringify(out)
  if (json.length <= PROFILE_CONTEXT_MAX_CHARS) return out
  return {
    fullName: out.fullName,
    course: out.course,
    careerGoal: out.careerGoal,
    interests: Array.isArray(out.interests) ? out.interests.slice(0, 10) : out.interests,
    skills: Array.isArray(out.skills) ? out.skills.slice(0, 15) : out.skills,
    _truncated: true,
  }
}

function buildUserContent(text: string, attachments: ChatAttachment[]): string | UserContentPart[] {
  const parts: UserContentPart[] = []
  const trimmed = text.trim()
  if (trimmed) parts.push({ type: 'text', text: trimmed })
  for (const a of attachments) {
    if (a.kind === 'image') {
      const url = a.dataUrl || a.url
      if (url) parts.push({ type: 'image_url', image_url: { url } })
    } else if (a.text) {
      parts.push({
        type: 'text',
        text: `Attached file "${a.name}":\n${a.text.slice(0, 12_000)}`,
      })
    }
  }
  if (parts.length === 0) return trimmed || '(empty message)'
  const only = parts[0]
  if (parts.length === 1 && only?.type === 'text') return only.text
  return parts
}

function toOpenAiHistory(rows: Array<Record<string, unknown>>): ChatCompletionMessageParam[] {
  const messages: ChatCompletionMessageParam[] = []
  for (const row of rows) {
    const role = row.role as string
    const content = (row.content as string) ?? ''
    if (role === 'user') {
      const attachments = storedAttachments(row.attachments)
      messages.push({
        role: 'user',
        content: attachments.length ? buildUserContent(content, attachments) : content,
      })
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
    const userRow: Record<string, unknown> = {
      conversation_id: conversationId,
      role: 'user',
      content: opts.body.userMessage.trim(),
    }
    const storedAttachments = attachmentsForStorage(opts.body.attachments)
    if (storedAttachments) userRow.attachments = storedAttachments

    let { error } = await opts.supabase.from('conversation_messages').insert(userRow)
    if (error && storedAttachments && /attachments/i.test(String(error.message ?? ''))) {
      delete userRow.attachments
      ;({ error } = await opts.supabase.from('conversation_messages').insert(userRow))
    }
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
    await patchAssistantToolOutputs(opts.supabase, conversationId, opts.body.toolResults)
  }

  const history = await loadHistory(opts.supabase, conversationId)
  const toolRounds = history.filter(
    (row) => row.role === 'assistant' && Array.isArray(row.tool_calls) && (row.tool_calls as unknown[]).length > 0
  ).length
  const allowTools = toolRounds < 8
  const system = MODE_SYSTEM[mode] ?? MODE_SYSTEM.general
  const trimmedContext = trimProfileContext(opts.body.profileContext)
  const profileNote = trimmedContext
    ? `\nStudent context JSON: ${JSON.stringify(trimmedContext)}`
    : ''

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: `${system}${profileNote}` },
    ...toOpenAiHistory(history),
  ]

  const hasVision =
    opts.body.attachments?.some((a) => a.kind === 'image' && (a.dataUrl || a.url)) ||
    history.some(
      (row) =>
        row.role === 'user' &&
        storedAttachments(row.attachments).some((a) => a.kind === 'image' && a.url)
    )
  const model = hasVision ? env.OPENROUTER_VISION_MODEL || env.OPENROUTER_MODEL : env.OPENROUTER_MODEL

  const client = createOpenRouterClient()
  let completion
  try {
    completion = await client.chat.completions.create({
      model,
      messages,
      max_tokens: env.OPENROUTER_MAX_TOKENS,
      tools: allowTools && tools.length > 0 ? tools : undefined,
      tool_choice: allowTools && tools.length > 0 ? 'auto' : undefined,
      temperature: 0.4,
    })
  } catch (err) {
    throw mapOpenRouterError(err)
  }

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
