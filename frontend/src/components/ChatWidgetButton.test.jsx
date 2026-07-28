import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('@mui/icons-material', () => ({
  ChatBubbleOutlineRounded: () => null,
  Close: () => null,
  Send: () => null,
  AddComment: () => null,
  ForumOutlined: () => null,
  ChevronRight: () => null,
  DeleteOutlineOutlined: () => null,
}))

vi.mock('../api/chatbot', () => ({
  listChatSessions: vi.fn().mockResolvedValue({ data: [] }),
  createChatSession: vi.fn(),
  getChatMessages: vi.fn(),
  sendChatMessage: vi.fn(),
  deleteChatSession: vi.fn(),
}))

vi.mock('../api/application', () => ({
  getApplications: vi.fn().mockResolvedValue({ data: [] }),
}))

const { default: ChatWidgetButton } = await import('./ChatWidgetButton')

describe('ChatWidgetButton', () => {
  it('renders the floating trigger button', () => {
    render(<ChatWidgetButton />)
    expect(screen.getByLabelText('Interview prep chat')).toBeTruthy()
  })

  it('opens the panel on click and hides the trigger while open', async () => {
    render(<ChatWidgetButton />)
    const trigger = screen.getByLabelText('Interview prep chat')

    expect(screen.queryByText('Interview Prep')).toBeNull()

    fireEvent.click(trigger)
    expect(await screen.findByText('Interview Prep')).toBeTruthy()
    expect(screen.queryByLabelText('Interview prep chat')).toBeNull()
  })

  it('closes the panel and restores the trigger via the panel close button', async () => {
    render(<ChatWidgetButton />)
    fireEvent.click(screen.getByLabelText('Interview prep chat'))
    await screen.findByText('Interview Prep')

    fireEvent.click(screen.getByLabelText('Close'))

    expect(screen.queryByText('Interview Prep')).toBeNull()
    expect(await screen.findByLabelText('Interview prep chat')).toBeTruthy()
  })
})
