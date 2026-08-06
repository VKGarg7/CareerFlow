import { useEffect, useRef, useState } from 'react'
import { Send, AddComment, ForumOutlined, ChevronRight, DeleteOutlineOutlined } from '@mui/icons-material'
import { DrawerShell, DrawerHeader } from './DrawerShell'
import ChatApplicationPicker from './ChatApplicationPicker'
import useTransientMessage from '../hooks/useTransientMessage'
import {
  listChatSessions,
  createChatSession,
  getChatMessages,
  sendChatMessage,
  deleteChatSession,
} from '../api/chatbot'

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-white/[0.06] bg-[#0B0C14] px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/40" />
      </div>
    </div>
  )
}

// Reveals `text` a few words at a time to simulate streaming, since the
// backend returns the full reply in one response rather than token-by-token.
function useTypewriter(text, active, onDone) {
  const [visibleCount, setVisibleCount] = useState(active ? 0 : Infinity)

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resets the reveal to "done" when this bubble stops streaming
      setVisibleCount(Infinity)
      return
    }
    setVisibleCount(0)
    const words = text.split(' ')
    let i = 0
    const id = setInterval(() => {
      i += 2
      setVisibleCount(i)
      if (i >= words.length) {
        clearInterval(id)
        onDone?.()
      }
    }, 35)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, active])

  if (visibleCount === Infinity) return text
  return text.split(' ').slice(0, visibleCount).join(' ')
}

const isPendingMessage = (message) => String(message.id).startsWith('pending-')

function MessageBubble({ message, streaming, onStreamingDone }) {
  const isUser = message.role === 'USER'
  const displayedContent = useTypewriter(message.content, streaming, onStreamingDone)
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isUser
            ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-gradient-to-br from-app-accent to-app-accent2 px-3.5 py-2.5 text-sm text-white'
            : 'max-w-[85%] rounded-2xl rounded-bl-sm border border-white/[0.06] bg-[#0B0C14] px-3.5 py-2.5 text-sm text-white/85'
        }
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {displayedContent}
      </div>
    </div>
  )
}

export default function ChatPanel({ onClose }) {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [showSessionList, setShowSessionList] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [streamingMessageId, setStreamingMessageId] = useState(null)
  const [sendError, setSendError] = useTransientMessage(5000)
  const messagesEndRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    const onDocClick = (e) => { if (!panelRef.current?.contains(e.target)) onClose() }
    const onEsc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [onClose])

  const loadMessages = (sessionId, errorMessage) => {
    setLoading(true)
    return getChatMessages(sessionId)
      .then((res) => setMessages(res.data))
      .catch(() => setLoadError(errorMessage))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount: sets loading state before the async call, matches usePagedList's pattern
    setLoading(true)
    setLoadError('')
    listChatSessions()
      .then((res) => {
        if (cancelled) return null
        const list = res.data
        setSessions(list)
        if (list.length === 0) {
          setShowPicker(true)
          setActiveSession(null)
          setMessages([])
          return null
        }
        setActiveSession(list[0])
        return getChatMessages(list[0].id).then((msgRes) => { if (!cancelled) setMessages(msgRes.data) })
      })
      .catch(() => { if (!cancelled) setLoadError('Could not load your chat history. Please try again.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectSession = (session) => {
    setActiveSession(session)
    setShowPicker(false)
    setShowSessionList(false)
    setStreamingMessageId(null)
    loadMessages(session.id, 'Could not load this conversation.')
  }

  const handleStartNewChat = (jobApplicationId) => {
    setLoading(true)
    createChatSession(jobApplicationId)
      .then((res) => {
        const session = res.data
        setSessions((prev) => [session, ...prev])
        setActiveSession(session)
        setMessages([])
        setShowPicker(false)
        setShowSessionList(false)
      })
      .catch(() => setLoadError('Could not start a new chat. Please try again.'))
      .finally(() => setLoading(false))
  }

  const handleDeleteSession = (session, e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete "${session.title}"? This can't be undone.`)) return

    deleteChatSession(session.id)
      .then(() => {
        const remaining = sessions.filter((s) => s.id !== session.id)
        setSessions(remaining)
        if (activeSession?.id !== session.id) return
        if (remaining.length > 0) {
          handleSelectSession(remaining[0])
        } else {
          setActiveSession(null)
          setMessages([])
          setShowPicker(true)
          setShowSessionList(false)
        }
      })
      .catch(() => setSendError('Could not delete this conversation. Please try again.'))
  }

  const handleSend = () => {
    const content = draft.trim()
    if (!content || sending || !activeSession) return

    setSending(true)
    setDraft('')
    setMessages((prev) => [
      ...prev,
      { id: `pending-${Date.now()}`, role: 'USER', content, createdAt: new Date().toISOString() },
    ])

    sendChatMessage(activeSession.id, content)
      .then((res) => {
        setMessages((prev) => [
          ...prev.filter((m) => !isPendingMessage(m)),
          res.data.userMessage,
          res.data.assistantMessage,
        ])
        setStreamingMessageId(res.data.assistantMessage.id)
      })
      .catch((err) => {
        setMessages((prev) => prev.filter((m) => !isPendingMessage(m)))
        if (err?.response?.status === 429) {
          setSendError("You've reached today's message limit. Please try again tomorrow.")
        } else {
          setSendError('The assistant is unavailable right now. Please try again.')
        }
      })
      .finally(() => setSending(false))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const subtitle = activeSession
    ? activeSession.applicationRole
      ? `${activeSession.applicationRole} at ${activeSession.companyName}`
      : 'General prep chat'
    : ''

  return (
    <DrawerShell ref={panelRef}>
      <DrawerHeader title="Interview Prep" subtitle={subtitle} onClose={onClose} />

      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <button
          onClick={() => { setShowSessionList((v) => !v); setShowPicker(false) }}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white"
        >
          <ForumOutlined sx={{ fontSize: 15 }} />
          {sessions.length} conversation{sessions.length === 1 ? '' : 's'}
        </button>
        <button
          onClick={() => { setShowPicker(true); setShowSessionList(false) }}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-white/60 transition hover:bg-white/[0.06] hover:text-white"
        >
          <AddComment sx={{ fontSize: 15 }} />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading && <p className="p-4 text-sm text-white/40">Loading…</p>}
        {loadError && <p className="p-4 text-sm text-app-danger">{loadError}</p>}

        {!loading && !loadError && showPicker && (
          <ChatApplicationPicker onSelect={handleStartNewChat} />
        )}

        {!loading && !loadError && !showPicker && showSessionList && (
          <div className="flex flex-col gap-1 p-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectSession(s)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSelectSession(s) }}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 text-left transition ${
                  activeSession?.id === s.id
                    ? 'border-app-accent/40 bg-app-accent/10'
                    : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/85">{s.title}</p>
                  <p className="text-xs text-white/40">{s.messageCount} message{s.messageCount === 1 ? '' : 's'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Delete ${s.title}`}
                    onClick={(e) => handleDeleteSession(s, e)}
                    className="rounded-lg p-1 text-white/25 transition hover:bg-app-danger/10 hover:text-app-danger"
                  >
                    <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
                  </button>
                  <ChevronRight sx={{ fontSize: 16 }} className="text-white/25" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !loadError && !showPicker && !showSessionList && (
          <div className="flex flex-col gap-3 p-4">
            {messages.length === 0 && (
              <p className="text-sm text-white/30">
                Ask a mock interview question, paste a resume bullet for feedback, or ask anything about
                interview prep.
              </p>
            )}
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                streaming={m.id === streamingMessageId}
                onStreamingDone={() => setStreamingMessageId(null)}
              />
            ))}
            {sending && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {sendError && (
        <div className="border-t border-white/[0.06] bg-app-danger/10 px-4 py-2 text-xs text-app-danger">
          {sendError}
        </div>
      )}

      {!showPicker && !showSessionList && (
        <div className="flex items-end gap-2 border-t border-white/[0.06] p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || !activeSession}
            placeholder="Ask a question or paste a resume bullet…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/90 placeholder:text-white/25 focus:border-app-accent/50 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !draft.trim() || !activeSession}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-app-accent to-app-accent2 text-white transition disabled:opacity-40"
          >
            <Send sx={{ fontSize: 17 }} />
          </button>
        </div>
      )}
    </DrawerShell>
  )
}
