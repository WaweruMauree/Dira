import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useChat } from '@/hooks/useChat'
import { useRecentChats } from '@/hooks/useRecentChats'
import { useAuth } from '@/context/AuthProvider'
import { diraApi } from '@/lib/api/dira'
import { AGENT_MODES } from '@/lib/agent/tools/registry'
import { interestsFromMe } from '@/lib/profile/careerInterests'

async function enrichAttachments(token, conversationId, attachments) {
  if (!attachments?.length) return []
  const enriched = []
  for (const a of attachments) {
    if (a.dataUrl && a.kind === 'image') {
      const base64 = a.dataUrl.includes(',') ? a.dataUrl.split(',')[1] : a.dataUrl
      try {
        const { data } = await diraApi.uploadChatAttachment(token, conversationId, {
          name: a.name,
          mime: a.mime,
          kind: 'image',
          dataBase64: base64,
        })
        enriched.push({
          name: a.name,
          mime: a.mime,
          kind: a.kind,
          path: data.path,
          url: data.url ?? undefined,
        })
        continue
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed'
        throw new Error(
          `Could not upload image (${msg}). Apply Supabase migration 012_chat_attachments.sql if you have not yet.`
        )
      }
    }
    enriched.push(a)
  }
  return enriched
}

function buildProfileContext(meSnapshot) {
  if (!meSnapshot) return {}
  const interests = interestsFromMe(meSnapshot)
  const skillNames = (meSnapshot.skills ?? [])
    .map((row) => row.skills?.name ?? row.name)
    .filter(Boolean)
  return {
    fullName: meSnapshot.profile?.full_name,
    course: meSnapshot.student?.course,
    yearOfStudy: meSnapshot.studentProfile?.year_of_study,
    careerGoal: meSnapshot.studentProfile?.career_goal,
    interests,
    skills: skillNames.slice(0, 40),
  }
}

export function useHomeChat() {
  const { getAccessToken, meSnapshot } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryConvId = searchParams.get('c')
  const [conversationId, setConversationId] = useState(queryConvId || null)
  const [bootstrapping, setBootstrapping] = useState(false)
  const { refresh: refreshChats } = useRecentChats()

  useEffect(() => {
    if (queryConvId && queryConvId !== conversationId) {
      setConversationId(queryConvId)
    }
  }, [queryConvId, conversationId])

  const tools = AGENT_MODES.general.tools
  const profileContext = useMemo(() => buildProfileContext(meSnapshot), [meSnapshot])

  const { messages, sending, agentPhase, error, sendMessage: baseSend } = useChat({
    chatId: conversationId ?? undefined,
    agentMode: 'general',
    tools,
  })

  const ensureConversation = useCallback(async () => {
    if (conversationId) return conversationId
    setBootstrapping(true)
    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Not signed in')
      const { data } = await diraApi.createConversation(token, { mode: 'general' })
      setConversationId(data.id)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('c', data.id)
          return next
        },
        { replace: true }
      )
      return data.id
    } finally {
      setBootstrapping(false)
    }
  }, [conversationId, getAccessToken, setSearchParams])

  const startNewChat = useCallback(() => {
    setConversationId(null)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('c')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const loadConversation = useCallback(
    (id) => {
      setConversationId(id)
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('c', id)
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const sendMessage = useCallback(
    async (text, extras = {}) => {
      const id = await ensureConversation()
      const token = await getAccessToken()
      let attachments = extras.attachments ?? []
      if (token && attachments.length) {
        attachments = await enrichAttachments(token, id, attachments)
      }
      await baseSend(text, {
        ...extras,
        attachments,
        profileContext: { ...profileContext, ...(extras.profileContext ?? {}) },
        conversationId: id,
      })
      refreshChats()
    },
    [baseSend, ensureConversation, getAccessToken, profileContext, refreshChats]
  )

  const interests = profileContext.interests ?? []
  const hasThread = messages.length > 0 || sending || bootstrapping

  return {
    conversationId,
    messages,
    sending: sending || bootstrapping,
    agentPhase: bootstrapping ? 'thinking' : agentPhase,
    error,
    sendMessage,
    startNewChat,
    loadConversation,
    interests,
    hasThread,
    fullName: meSnapshot?.profile?.full_name,
  }
}
