export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'dira_onboarding_complete',
  ONBOARDING_DATA: 'dira_onboarding_data',
  CHATS: 'dira_chats',
  messages: (chatId) => `dira_messages_${chatId}`,
}

/** @deprecated removed — clear any stale dev auth from older builds */
export function clearLegacyDevSession() {
  localStorage.removeItem('dira_dev_session')
}

export function clearOnboardingState() {
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE)
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DATA)
}

export function isOnboardingComplete() {
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true'
}

export function setOnboardingComplete(data) {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true')
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_DATA, JSON.stringify(data))
}

export function getOnboardingData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHATS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveChats(chats) {
  localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats))
}

export function getMessages(chatId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.messages(chatId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMessages(chatId, messages) {
  localStorage.setItem(STORAGE_KEYS.messages(chatId), JSON.stringify(messages))
}

export function createChatId() {
  return crypto.randomUUID()
}

export function upsertChat(chat) {
  const chats = getChats()
  const idx = chats.findIndex((c) => c.id === chat.id)
  if (idx >= 0) {
    chats[idx] = { ...chats[idx], ...chat }
  } else {
    chats.unshift(chat)
  }
  saveChats(chats)
  return chat
}

export function getChat(chatId) {
  return getChats().find((c) => c.id === chatId) ?? null
}

export function createChat({ mode, title = 'New conversation' }) {
  const chat = {
    id: createChatId(),
    title,
    mode,
    updatedAt: new Date().toISOString(),
    preview: '',
  }
  upsertChat(chat)
  return chat
}
