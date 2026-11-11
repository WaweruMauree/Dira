import { useState, useCallback, useEffect, useRef } from 'react'
import { sendAgentMessage } from '@/lib/api/agent.client'
import { diraApi } from '@/lib/api/dira'
import { definitionsFor } from '@/lib/agent/tools/index'
import { executeClientTool } from '@/lib/agent/tools/execute'
import { useAuth } from '@/context/AuthProvider'
import { AgentApiError } from '@/lib/api/client'
import { normalizeTurns } from '@/lib/chat/normalizeTurns'
import { rehydrateMessages, rehydrateAssistantMessage } from '@/lib/chat/rehydrateToolCalls'
import { cacheArtifactOutput } from '@/lib/chat/artifactCache'
import { isArtifactTool } from '@/lib/chat/artifactFromTool'
import { extractMarkdownArtifact } from '@/lib/chat/parseArtifact'
import { mergeChatMessages } from '@/lib/chat/mergeChatMessages'

function makeId() {
  return crypto.randomUUID()
}

function mapDbMessage(row) {
  return {
    id: String(row.id),
    role: row.role || 'assistant',
    content: String(row.content ?? ''),
    toolCalls: row.tool_calls ?? undefined,
    attachments: row.attachments ?? undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

function stripAttachmentsForApi(attachments) {
  if (!Array.isArray(attachments) || attachments.length === 0) return undefined
  return attachments.map((a) => {
    const base = {
      name: a.name,
      mime: a.mime,
      kind: a.kind,
      text: a.text,
      path: a.path,
      url: a.url,
    }
    if (a.kind === 'image' && a.url) return base
    if (a.kind === 'image' && a.dataUrl) return { ...base, dataUrl: a.dataUrl }
    return base
  })
}

function finalizeToolCalls(toolCalls, content, conversationId) {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) return toolCalls
  const fallback = extractMarkdownArtifact(content ?? '')
  return toolCalls.map((tc) => {
    if (!isArtifactTool(tc.name)) return tc
    if (tc.status === 'complete' && tc.output) return tc
    if (tc.output?.artifact) {
      return { ...tc, status: 'complete' }
    }
    const fromExtract = fallback
      ? {
          title: fallback.title,
          markdown: fallback.markdown,
          filename: fallback.filename,
          artifactType: fallback.artifactType,
          artifact: true,
        }
      : null
    if (fromExtract) {
      return { ...tc, status: 'complete', output: fromExtract }
    }
    return tc
  })
}

function mergeFinalAssistant(prev, responseMessage, responseDurationMs, conversationId) {
  const next = [...prev]
  const last = next[next.length - 1]
  const mergedContent = responseMessage.content ?? last?.content ?? ''

  if (last?.role === 'assistant' && last.toolCalls?.length) {
    const toolCalls = finalizeToolCalls(last.toolCalls, mergedContent, conversationId)
    const updated = {
      ...last,
      id: responseMessage.id ?? last.id,
      content: mergedContent,
      toolCalls,
      responseDurationMs,
      createdAt: responseMessage.createdAt ?? last.createdAt,
    }
    next[next.length - 1] = rehydrateAssistantMessage(updated, conversationId)
    return next
  }

  next.push({
    ...responseMessage,
    responseDurationMs,
  })
  return next
}

export function useChat({ chatId, agentMode, tools, onToolComplete }) {
  const { getAccessToken } = useAuth()
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [agentPhase, setAgentPhase] = useState(null)
  const [error, setError] = useState(null)
  const sendingInFlightRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (!chatId) {
      if (!sendingInFlightRef.current) {
        setMessages([])
      }
      return undefined
    }
    if (sendingInFlightRef.current) {
      return undefined
    }
    ;(async () => {
      const token = await getAccessToken()
      if (!token || cancelled) return
      try {
        const { data } = await diraApi.listMessages(token, chatId)
        if (!cancelled) {
          const mapped = data.filter((row) => row.role !== 'tool').map(mapDbMessage)
          const normalized = normalizeTurns(mapped)
          const fromServer = rehydrateMessages(normalized, chatId)
          setMessages((prev) => {
            if (!prev.length) return fromServer
            if (sendingInFlightRef.current) {
              return mergeChatMessages(fromServer, prev)
            }
            return fromServer
          })
        }
      } catch {
        if (!cancelled) {
          setMessages((prev) => (sendingInFlightRef.current ? prev : []))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chatId, getAccessToken])

  const sendMessage = useCallback(
    async (userMessage, extras = {}) => {
      if (!userMessage.trim() || sending) return

      const activeChatId = extras.conversationId || chatId
      if (!activeChatId) return

      const turnStartedAt = performance.now()
      sendingInFlightRef.current = true
      setSending(true)
      setAgentPhase('thinking')
      setError(null)

      const attachments = extras.attachments ?? []
      const userMsg = {
        id: makeId(),
        role: 'user',
        content: userMessage.trim(),
        attachments: attachments.length ? attachments : undefined,
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])

      try {
        const token = await getAccessToken()
        const definitions = definitionsFor(tools)
        const uploadedFiles = (attachments ?? [])
          .filter((a) => a.text || a.kind === 'document')
          .map((a) => ({
            name: a.name,
            kind: a.kind,
            text: a.text?.slice(0, 8000),
          }))
        const profileContext = {
          ...(extras.profileContext ?? {}),
          ...(uploadedFiles.length ? { uploadedFiles } : {}),
          ...(extras.cvExcerpt && extras.cvExcerpt.trim()
            ? {
                cvExcerpt: extras.cvExcerpt.trim(),
                cvFileName: extras.cvFileName ?? 'cv.txt',
              }
            : {}),
        }
        const hasProfileContext = Object.keys(profileContext).length > 0
        const attachmentPayload = stripAttachmentsForApi(attachments)

        let response = await sendAgentMessage(
          {
            conversationId: activeChatId,
            chatId: activeChatId,
            mode: agentMode,
            tools: definitions,
            userMessage: userMessage.trim(),
            ...(attachmentPayload?.length ? { attachments: attachmentPayload } : {}),
            ...(hasProfileContext ? { profileContext } : {}),
          },
          token
        )

        let guard = 0
        while (response.status === 'requires_action' && response.toolCalls?.length && guard < 8) {
          guard += 1
          const pending = response.toolCalls.map((tc) => ({ ...tc, status: 'pending' }))
          setAgentPhase('cogitating')
          setMessages((prev) => [
            ...prev,
            {
              id: makeId(),
              role: 'assistant',
              content: response.message?.content ?? '',
              toolCalls: pending,
              createdAt: new Date().toISOString(),
            },
          ])

          const toolResults = []
          const completed = []
          for (const call of pending) {
            try {
              const output = await executeClientTool(String(call.name), call.input ?? {}, token, {
                profileContext,
                attachments: attachmentPayload,
              })
              const toolCallId = call.id || makeId()
              if (isArtifactTool(String(call.name)) && output && typeof output === 'object') {
                cacheArtifactOutput(activeChatId, toolCallId, output)
              }
              toolResults.push({
                toolCallId,
                name: String(call.name),
                output,
              })
              completed.push({ ...call, id: toolCallId, status: 'complete', output })
              onToolComplete?.(String(call.name), call.input, output)
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Tool failed'
              toolResults.push({
                toolCallId: call.id || makeId(),
                name: String(call.name),
                error: message,
              })
              completed.push({ ...call, status: 'error', output: { error: message } })
            }
          }

          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last?.role === 'assistant') {
              next[next.length - 1] = { ...last, toolCalls: completed }
            }
            return next
          })

          setAgentPhase('finalising')

          response = await sendAgentMessage(
            {
              conversationId: response.conversationId || activeChatId,
              chatId: activeChatId,
              mode: agentMode,
              tools: definitions,
              toolResults,
              ...(hasProfileContext ? { profileContext } : {}),
            },
            token
          )
        }

        if (response.status === 'error') {
          throw new Error(response.error || 'Agent request failed')
        }

        if (response.status === 'complete' || response.message) {
          setAgentPhase('finalising')
        }

        const responseDurationMs = Math.round(performance.now() - turnStartedAt)

        if (response.message) {
          setMessages((prev) =>
            mergeFinalAssistant(prev, response.message, responseDurationMs, activeChatId)
          )
        }
      } catch (err) {
        const responseDurationMs = Math.round(performance.now() - turnStartedAt)
        const detail =
          err instanceof AgentApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to send message'
        setError(detail)
        const isProvider =
          err instanceof AgentApiError ||
          /openrouter|credits|max_tokens|Cannot reach/i.test(detail)
        const errorMsg = {
          id: makeId(),
          role: 'assistant',
          content: isProvider ? detail : `Sorry, something went wrong. ${detail}`,
          responseDurationMs,
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        sendingInFlightRef.current = false
        setSending(false)
        setAgentPhase(null)
      }
    },
    [agentMode, chatId, getAccessToken, sending, tools, onToolComplete]
  )

  return { messages, sending, agentPhase, error, sendMessage }
}
