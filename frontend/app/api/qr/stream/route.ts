import { NextRequest, NextResponse } from 'next/server'

const backendUrl = process.env.INTERNAL_API_BASE_URL || 'https://apievent.expsolution.io'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse('Missing token parameter', { status: 400 })
  }

  // Set up Server-Sent Events headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  })

  const stream = new ReadableStream({
    start(controller) {
      console.log(`[SSE] Starting stream for token: ${token}`)
      
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        token: token,
        timestamp: Date.now()
      })}\n\n`
      controller.enqueue(new TextEncoder().encode(initialMessage))

      // Set up polling to check for check-in status changes
      const pollInterval = setInterval(async () => {
        try {
          // Get guest data by token
          const response = await fetch(`${backendUrl}/api/invite/${token}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const data = await response.json()
            const guest = data.guest

            if (guest && guest.checkin_status === 'checked_in') {
              console.log(`[SSE] Check-in detected for guest ${guest.id}`)
              
              const checkinMessage = `data: ${JSON.stringify({
                type: 'checkin',
                guestId: guest.id,
                guestName: guest.name,
                token: token,
                timestamp: Date.now()
              })}\n\n`
              
              controller.enqueue(new TextEncoder().encode(checkinMessage))
            }
          }
        } catch (error) {
          console.error('[SSE] Error polling check-in status:', error)
        }
      }, 2000) // Poll every 2 seconds

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Client disconnected for token: ${token}`)
        clearInterval(pollInterval)
        controller.close()
      })

      // Keep connection alive with periodic heartbeat
      const heartbeatInterval = setInterval(() => {
        const heartbeatMessage = `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: Date.now()
        })}\n\n`
        controller.enqueue(new TextEncoder().encode(heartbeatMessage))
      }, 30000) // Heartbeat every 30 seconds

      // Clean up heartbeat on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval)
      })
    }
  })

  return new NextResponse(stream, { headers })
}
