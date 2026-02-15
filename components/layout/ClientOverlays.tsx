'use client'

import dynamic from 'next/dynamic'

const AudioPlayer = dynamic(() => import('@/components/player/AudioPlayer'), {
  ssr: false,
})
const CartDrawer = dynamic(() => import('@/components/cart/CartDrawer'), {
  ssr: false,
})
const ChatWrapper = dynamic(() => import('@/components/chat/ChatWrapper'), {
  ssr: false,
})

export default function ClientOverlays() {
  return (
    <>
      <AudioPlayer />
      <CartDrawer />
      <ChatWrapper />
    </>
  )
}
