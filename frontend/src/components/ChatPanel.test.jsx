import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@mui/icons-material', () => ({
  Send: () => null,
  AddComment: () => null,
  Close: () => null,
  ForumOutlined: () => null,
  ChevronRight: () => null,
  DeleteOutlineOutlined: () => null,
}))

vi.mock('../api/chatbot', () => ({
  listChatSessions: vi.fn(),
  createChatSession: vi.fn(),
  getChatMessages: vi.fn(),
  sendChatMessage: vi.fn(),
  deleteChatSession: vi.fn(),
}))

vi.mock('../api/application', () => ({
  getApplications: vi.fn().mockResolvedValue({ data: [] }),
}))

const {
  listChatSessions,
  createChatSession,
  getChatMessages,
  sendChatMessage,
  deleteChatSession,
} = await import('../api/chatbot')
const { default: ChatPanel } = await import('./ChatPanel')

const EXISTING_SESSION = {
  id: 1,
  title: 'General prep chat',
  jobApplicationId: null,
  companyName: null,
  applicationRole: null,
}

beforeEach(() => vi.clearAllMocks())

describe('ChatPanel', () => {
  it('loads and displays history for the most recent session on open', async () => {
    listChatSessions.mockResolvedValue({ data: [EXISTING_SESSION] })
    getChatMessages.mockResolvedValue({
      data: [{ id: 10, role: 'USER', content: 'Hi there', createdAt: new Date().toISOString() }],
    })

    render(<ChatPanel onClose={vi.fn()} />)

    expect(await screen.findByText('Hi there')).toBeTruthy()
    expect(getChatMessages).toHaveBeenCalledWith(1)
  })

  it('shows the application picker when there are no existing sessions', async () => {
    listChatSessions.mockResolvedValue({ data: [] })

    render(<ChatPanel onClose={vi.fn()} />)

    expect(await screen.findByText('Start a new chat')).toBeTruthy()
  })

  it('sends a message and appends both the user and assistant messages', async () => {
    listChatSessions.mockResolvedValue({ data: [EXISTING_SESSION] })
    getChatMessages.mockResolvedValue({ data: [] })
    sendChatMessage.mockResolvedValue({
      data: {
        userMessage: { id: 1, role: 'USER', content: 'Tell me about yourself' },
        assistantMessage: { id: 2, role: 'ASSISTANT', content: 'Sure, lets start.' },
      },
    })

    render(<ChatPanel onClose={vi.fn()} />)
    await waitFor(() => expect(getChatMessages).toHaveBeenCalled())

    const textarea = screen.getByPlaceholderText('Ask a question or paste a resume bullet…')
    fireEvent.change(textarea, { target: { value: 'Tell me about yourself' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })

    expect(await screen.findByText('Sure, lets start.')).toBeTruthy()
    expect(sendChatMessage).toHaveBeenCalledWith(1, 'Tell me about yourself')
  })

  it('shows a rate-limit error banner when sending fails with 429', async () => {
    listChatSessions.mockResolvedValue({ data: [EXISTING_SESSION] })
    getChatMessages.mockResolvedValue({ data: [] })
    sendChatMessage.mockRejectedValue({ response: { status: 429 } })

    render(<ChatPanel onClose={vi.fn()} />)
    await waitFor(() => expect(getChatMessages).toHaveBeenCalled())

    const textarea = screen.getByPlaceholderText('Ask a question or paste a resume bullet…')
    fireEvent.change(textarea, { target: { value: 'One more question' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })

    expect(await screen.findByText(/reached today's message limit/)).toBeTruthy()
  })

  it('disables the input while a reply is in flight', async () => {
    listChatSessions.mockResolvedValue({ data: [EXISTING_SESSION] })
    getChatMessages.mockResolvedValue({ data: [] })
    let resolveSend
    sendChatMessage.mockReturnValue(new Promise((resolve) => { resolveSend = resolve }))

    render(<ChatPanel onClose={vi.fn()} />)
    await waitFor(() => expect(getChatMessages).toHaveBeenCalled())

    const textarea = screen.getByPlaceholderText('Ask a question or paste a resume bullet…')
    fireEvent.change(textarea, { target: { value: 'Question' } })
    fireEvent.keyDown(textarea, { key: 'Enter' })

    expect(textarea.disabled).toBe(true)

    resolveSend({
      data: {
        userMessage: { id: 1, role: 'USER', content: 'Question' },
        assistantMessage: { id: 2, role: 'ASSISTANT', content: 'Answer' },
      },
    })
    await screen.findByText('Answer')
    expect(textarea.disabled).toBe(false)
  })

  it('starting a new chat creates a session and clears the message list', async () => {
    listChatSessions.mockResolvedValue({ data: [EXISTING_SESSION] })
    getChatMessages.mockResolvedValue({
      data: [{ id: 10, role: 'USER', content: 'Old message', createdAt: new Date().toISOString() }],
    })
    createChatSession.mockResolvedValue({
      data: { id: 2, title: 'General prep chat', jobApplicationId: null },
    })

    render(<ChatPanel onClose={vi.fn()} />)
    await screen.findByText('Old message')

    fireEvent.click(screen.getByText('New chat'))
    const generalOption = await screen.findByRole('button', { name: 'General prep chat' })

    fireEvent.click(generalOption)

    await waitFor(() => expect(createChatSession).toHaveBeenCalledWith(null))
    expect(screen.queryByText('Old message')).toBeNull()
  })

  it('switches to a different existing session from the session list', async () => {
    const otherSession = { id: 2, title: 'Backend Engineer at Acme', jobApplicationId: 5, companyName: 'Acme', applicationRole: 'Backend Engineer' }
    listChatSessions.mockResolvedValue({ data: [EXISTING_SESSION, otherSession] })
    getChatMessages.mockImplementation((sessionId) =>
      Promise.resolve({
        data: sessionId === 1
          ? [{ id: 10, role: 'USER', content: 'General message', createdAt: new Date().toISOString() }]
          : [{ id: 20, role: 'USER', content: 'Acme message', createdAt: new Date().toISOString() }],
      })
    )

    render(<ChatPanel onClose={vi.fn()} />)
    await screen.findByText('General message')

    fireEvent.click(screen.getByText('2 conversations'))
    fireEvent.click(await screen.findByText('Backend Engineer at Acme'))

    await waitFor(() => expect(getChatMessages).toHaveBeenCalledWith(2))
    expect(await screen.findByText('Acme message')).toBeTruthy()
  })

  it('deletes a conversation after confirmation and falls back to another session', async () => {
    const otherSession = { id: 2, title: 'Backend Engineer at Acme', jobApplicationId: 5, companyName: 'Acme', applicationRole: 'Backend Engineer' }
    listChatSessions.mockResolvedValue({ data: [EXISTING_SESSION, otherSession] })
    getChatMessages.mockResolvedValue({ data: [] })
    deleteChatSession.mockResolvedValue({})
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(<ChatPanel onClose={vi.fn()} />)
    await waitFor(() => expect(getChatMessages).toHaveBeenCalledWith(1))

    fireEvent.click(screen.getByText('2 conversations'))
    await screen.findByLabelText('Delete General prep chat')

    fireEvent.click(screen.getByLabelText('Delete General prep chat'))

    await waitFor(() => expect(deleteChatSession).toHaveBeenCalledWith(1))
    await waitFor(() => expect(getChatMessages).toHaveBeenCalledWith(2))
  })
})
