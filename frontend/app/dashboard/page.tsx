'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { appKitModal } from '@/config'
import Link from 'next/link'

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalPoints: number;
  imageUrl?: string;
  participants: {
    length: number;
  };
}

export default function Dashboard() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [createdEvents, setCreatedEvents] = useState<Event[]>([])
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    // Check if user is authenticated
    fetch('/api/auth/user')
      .then(res => {
        console.log('User API response status:', res.status);
        if (!res.ok) {
          throw new Error(`Authentication failed: ${res.status}`);
        }
        return res.json()
      })
      .then(data => {
        console.log('User data received:', data);
        setUserData(data)
        setLoading(false)
        
        // After user data is loaded, fetch events
        fetchEvents()
      })
      .catch((err) => {
        console.error('Authentication error:', err);
        setError(err.message);
        // Don't redirect immediately, show error first
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      })
  }, [isConnected, router])
  
  const fetchEvents = async () => {
    setEventsLoading(true)
    try {
      // Fetch created events
      const createdRes = await fetch('/api/events/user/created')
      if (createdRes.ok) {
        const created = await createdRes.json()
        setCreatedEvents(created)
      }
      
      // Fetch joined events
      const joinedRes = await fetch('/api/events/user/joined')
      if (joinedRes.ok) {
        const joined = await joinedRes.json()
        setJoinedEvents(joined)
      }
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setEventsLoading(false)
    }
  }

  const handleSignOut = async () => {
    // First disconnect wallet
    await appKitModal.disconnect()
    
    // Then clear server-side session
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => router.push('/login'))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">Loading...</p>
        {error && (
          <p className="text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="space-x-4">
            <Link 
              href="/events/create" 
              className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Event
            </Link>
            <Link 
              href="/profile" 
              className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Welcome to your Dashboard</h2>
          <p className="mb-2"><strong>Connected Address:</strong> {address}</p>
          {userData && (
            <div className="mt-4">
              {userData.firstName && (
                <p>
                  <strong>Name:</strong> {userData.firstName} {userData.lastName}
                </p>
              )}
              {userData.email && (
                <p><strong>Email:</strong> {userData.email}</p>
              )}
              <p><strong>Total Points Earned:</strong> {userData.totalPoints}</p>
              <p><strong>Last login:</strong> {new Date(userData.lastLogin).toLocaleString()}</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Created Events */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Created Events</h2>
              <Link 
                href="/events/create" 
                className="py-1 px-3 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                + New
              </Link>
            </div>
            
            {eventsLoading ? (
              <p className="text-gray-500 text-center py-4">Loading events...</p>
            ) : createdEvents.length > 0 ? (
              <div className="space-y-4">
                {createdEvents.map(event => (
                  <Link href={`/events/${event._id}`} key={event._id} className="block">
                    <div className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{event.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{event.description}</p>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Participants: {event.participants?.length || 0}</span>
                        <span>Points: {event.totalPoints}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">You haven't created any events yet</p>
            )}
          </div>
          
          {/* Joined Events */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Events You've Joined</h2>
              <Link 
                href="/events" 
                className="py-1 px-3 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Browse Events
              </Link>
            </div>
            
            {eventsLoading ? (
              <p className="text-gray-500 text-center py-4">Loading events...</p>
            ) : joinedEvents.length > 0 ? (
              <div className="space-y-4">
                {joinedEvents.map(event => (
                  <Link href={`/events/${event._id}`} key={event._id} className="block">
                    <div className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <h3 className="font-medium">{event.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs ${event.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {event.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{event.description}</p>
                      <div className="flex justify-between mt-2 text-xs text-gray-500">
                        <span>Ends: {new Date(event.endDate).toLocaleDateString()}</span>
                        <span>Points: {event.totalPoints}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">You haven't joined any events yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}