import { useState, useCallback, useEffect } from 'react'
import { sendAgentMessage } from '@/lib/api/agent.client'
import { diraApi } from '@/lib/api/dira'
import { definitionsFor } from '@/lib/agent/tools/index'
import { executeClientTool } from '@/lib/agent/tools/execute'
import { useAuth } from '@/context/AuthProvider'

function makeId() {
  return crypto.randomUUID()
}

function mapDbMessage(row) {
  return {
    id: String(row.id),
    role: row.role || 'assistant',
    content: String(row.content ?? ''),
    toolCalls: row.tool_calls ?? undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
  }
}

export function useChat({ chatId, agentMode, tools }) {
  const { getAccessToken } = useAuth()
  const [messages, setMessages] = useState([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const token = await getAccessToken()
      if (!token || cancelled) return
      try {
        const { data } = await diraApi.listMessages(token, chatId)
        if (!cancelled) {
          setMessages(data.filter((row) => row.role !== 'tool').map(mapDbMessage))
        }
      } catch {
        if (!cancelled) setMessages([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chatId, getAccessToken])

  const sendMessage = useCallback(
    async (userMessage) => {
      if (!userMessage.trim() || sending) return

      setSending(true)
      setError(null)

      const userMsg = {
        id: makeId(),
        role: 'user',
        content: userMessage.trim(),
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])

      try {
        const token = await getAccessToken()
        const definitions = definitionsFor(tools)
        let response = await sendAgentMessage(
          {
            conversationId: chatId,
            chatId,
            mode: agentMode,
            tools: definitions,
            userMessage: userMessage.trim(),
          },
          token
        )

        let guard = 0
        while (response.status === 'requires_action' && response.toolCalls?.length && guard < 8) {
          guard += 1
          const pending = response.toolCalls.map((tc) => ({ ...tc, status: 'pending' }))
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
              const output = await executeClientTool(String(call.name), call.input ?? {}, token)
              toolResults.push({
                toolCallId: call.id || makeId(),
                name: String(call.name),
                output,
              })
              completed.push({ ...call, status: 'complete', output })
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

          response = await sendAgentMessage(
            {
              conversationId: response.conversationId || chatId,
              chatId,
              mode: agentMode,
              tools: definitions,
              toolResults,
            },
            token
          )
        }

        if (response.status === 'error') {
          throw new Error(response.error || 'Agent request failed')
        }

        if (response.message) {
          setMessages((prev) => [...prev, response.message])
        }
      } catch (err) {
        setError(err.message || 'Failed to send message')
        const errorMsg = {
          id: makeId(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          createdAt: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, errorMsg])
      } finally {
        setSending(false)
      }
    },
    [agentMode, chatId, getAccessToken, sending, tools]
  )

  return { messages, sending, error, sendMessage }
}
