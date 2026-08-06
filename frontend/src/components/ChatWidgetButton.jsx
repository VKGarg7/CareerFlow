import { useState } from 'react'
import { ChatBubbleOutlineRounded } from '@mui/icons-material'
import ChatPanel from './ChatPanel'

export default function ChatWidgetButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Interview prep chat"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-app-accent to-app-accent2 text-white shadow-[0_8px_24px_-6px_rgba(99,102,241,0.6)] transition-transform hover:scale-105 active:scale-95"
        >
          <ChatBubbleOutlineRounded sx={{ fontSize: 24 }} />
        </button>
      )}

      {open && <ChatPanel onClose={() => setOpen(false)} />}
    </>
  )
}
