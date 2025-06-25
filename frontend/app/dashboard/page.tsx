'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { appKitModal } from '@/config'
import Link from 'next/link'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'
import { FiExternalLink, FiPlus, FiUser, FiCalendar, FiUsers } from 'react-icons/fi'

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
      <PageWrapper className="flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="mb-4 text-lg text-white">Loading dashboard...</p>
          <div className="mt-4 h-2 w-40 mx-auto bg-gray-800 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-light-green to-dark-green"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
          {error && (
            <p className="mt-6 text-red-400">{error}</p>
          )}
        </motion.div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
        </motion.div>
        
        <GlassCard className="mb-8" animate withBorder highlight>
          <h2 className="text-xl font-semibold mb-4 text-white">Welcome back</h2>
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-gray-400">Connected Address</p>
              <p className="font-mono text-light-green">{address?.slice(0, 8)}...{address?.slice(-6)}</p>
            </div>
            
            {userData && (
              <>
                {userData.firstName && (
                  <div>
                    <p className="text-sm text-gray-400">Name</p>
                    <p className="text-white">{userData.firstName} {userData.lastName}</p>
                  </div>
                )}
                {userData.email && (
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white">{userData.email}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400">Total Points</p>
                  <p className="text-light-green font-bold">{userData.totalPoints}</p>
                </div>
              </>
            )}
          </div>
        </GlassCard>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Created Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Your Created Events</h2>
                <Link 
                  href="/events/create" 
                  className="glass-button inline-flex items-center text-sm"
                >
                  <FiPlus className="mr-1" /> New
                </Link>
              </div>
              
              {eventsLoading ? (
                <div className="py-4 text-center">
                  <p className="text-gray-400">Loading events...</p>
                </div>
              ) : createdEvents.length > 0 ? (
                <div className="space-y-4">
                  {createdEvents.map(event => (
                    <Link href={`/events/${event._id}`} key={event._id} className="block">
                      <div className="border border-gray-700/50 rounded-xl p-4 hover:bg-white/5 transition-colors backdrop-blur-sm">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-white">{event.title}</h3>
                          <span className={event.isActive ? 'glass-badge' : 'glass-badge glass-badge-inactive'}>
                            {event.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 mt-1">{event.description}</p>
                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                          <span className="flex items-center">
                            <FiUsers className="mr-1" /> {event.participants?.length || 0}
                          </span>
                          <span className="text-light-green">{event.totalPoints} points</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                  <p className="text-gray-400 mb-4">You haven't created any events yet</p>
                  <Link href="/events/create" className="glass-button text-sm">
                    Create Your First Event
                  </Link>
                </div>
              )}
            </GlassCard>
          </motion.div>
          
          {/* Joined Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Events You've Joined</h2>
                <Link 
                  href="/events" 
                  className="glass-button inline-flex items-center text-sm"
                >
                  Browse
                </Link>
              </div>
              
              {eventsLoading ? (
                <div className="py-4 text-center">
                  <p className="text-gray-400">Loading events...</p>
                </div>
              ) : joinedEvents.length > 0 ? (
                <div className="space-y-4">
                  {joinedEvents.map(event => (
                    <Link href={`/events/${event._id}`} key={event._id} className="block">
                      <div className="border border-gray-700/50 rounded-xl p-4 hover:bg-white/5 transition-colors backdrop-blur-sm">
                        <div className="flex justify-between">
                          <h3 className="font-medium text-white">{event.title}</h3>
                          <span className={event.isActive ? 'glass-badge' : 'glass-badge glass-badge-inactive'}>
                            {event.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 line-clamp-2 mt-1">{event.description}</p>
                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                          <span className="flex items-center">
                            <FiCalendar className="mr-1" /> {new Date(event.endDate).toLocaleDateString()}
                          </span>
                          <span className="text-light-green">{event.totalPoints} points</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                  <p className="text-gray-400 mb-4">You haven't joined any events yet</p>
                  <Link href="/events" className="glass-button text-sm">
                    Browse Available Events
                  </Link>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  )
}