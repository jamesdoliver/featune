'use client'

import { useState } from 'react'
import ChatButton from './ChatButton'
import ChatModal from './ChatModal'

export default function ChatWrapper() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <ChatButton onClick={() => setIsOpen(true)} />
      <ChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
