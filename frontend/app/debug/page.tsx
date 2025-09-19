"use client"
import { useState, useEffect } from 'react'

export default function DebugPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Testing API...')
        const response = await fetch('/api/invite/XwJmq68ezBb3RJeHzUK-tVYh4GUoG-JWOJW2XaCuQoE')
        console.log('Response status:', response.status)
        console.log('Response ok:', response.ok)
        
        if (response.ok) {
          const result = await response.json()
          console.log('API Response:', result)
          setData(result)
        } else {
          const errorText = await response.text()
          console.log('API Error:', errorText)
          setError(errorText)
        }
      } catch (err) {
        console.log('Fetch Error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    testAPI()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!data) return <div>No data</div>

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug API Response</h1>
      <h2>Guest Info:</h2>
      <p>Name: {data.guest?.name}</p>
      <p>RSVP Status: {data.guest?.rsvp_status}</p>
      <p>Checkin Status: {data.guest?.checkin_status}</p>
      <p>Email: {data.guest?.email}</p>
      
      <h2>Event Info:</h2>
      <p>Name: {data.event?.name}</p>
      <p>Date: {data.event?.date}</p>
      <p>Time: {data.event?.time}</p>
      
      <h2>Raw Data:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
