'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiUser, FiTwitter, FiAward, FiCalendar, FiCheck, FiX, FiExternalLink } from 'react-icons/fi'
import { CursorGlow } from '@/components/ui/cursor-glow'
import Link from 'next/link'
import { GlowingBorder } from '@/components/ui/glowing-border'

interface UserProfile {
  _id: string;
  address: string;
  firstName: string;
  lastName: string;
  email: string;
  totalPoints: number;
  twitterId?: string;
  twitterUsername?: string;
  createdAt: string;
  createdEvents: number;
  joinedEvents: number;
}

interface TaskHistory {
  _id: string;
  eventId: string;
  eventTitle: string;
  taskId: string;
  taskType: string;
  platform: string;
  description: string;
  pointsEarned: number;
  completedAt: string;
}

export default function ProfilePage() {
  const { address } = useParams() as { address: string }
  const router = useRouter()
  const { address: userAddress, isConnected } = useAccount()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([])
  const [createdEvents, setCreatedEvents] = useState([])
  const [historyType, setHistoryType] = useState<'completed' | 'created'>('completed')

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    fetchProfileData()
  }, [address, isConnected, router])
  
  const fetchProfileData = async () => {
    setLoading(true)
    try {
      // Check if this is the user's own profile
      if (!address || address.toLowerCase() === userAddress?.toLowerCase()) {
        setIsOwnProfile(true)
        const res = await fetch('/api/profile')
        if (!res.ok) {
          throw new Error('Failed to load profile data')
        }
        
        const data = await res.json()
        setProfile({
          ...data,
          createdEvents: data.createdEvents?.length || 0,
          joinedEvents: data.joinedEvents?.length || 0
        })
        
        // Fetch own task history
        fetchTaskHistory()
        fetchCreatedEvents()
      } else {
        // Fetch other user's profile
        setIsOwnProfile(false)
        const res = await fetch(`/api/profile/${address}`)
        if (!res.ok) {
          throw new Error('Failed to load user profile')
        }
        
        const data = await res.json()
        setProfile({
          ...data,
          createdEvents: data.createdEvents?.length || 0,
          joinedEvents: data.joinedEvents?.length || 0
        })
        
        // Fetch other user's public task history
        fetchPublicTaskHistory(address)
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchTaskHistory = async () => {
    try {
      const res = await fetch('/api/tasks/history')
      if (res.ok) {
        const data = await res.json()
        setTaskHistory(data)
      }
    } catch (err) {
      console.error('Error fetching task history:', err)
    }
  }
  
  const fetchPublicTaskHistory = async (userAddress: string) => {
    try {
      const res = await fetch(`/api/profile/${userAddress}/tasks`)
      if (res.ok) {
        const data = await res.json()
        setTaskHistory(data)
      }
    } catch (err) {
      console.error('Error fetching public task history:', err)
    }
  }
  
  const fetchCreatedEvents = async () => {
    try {
      const res = await fetch('/api/events/user/created')
      if (res.ok) {
        const data = await res.json()
        setCreatedEvents(data)
      }
    } catch (err) {
      console.error('Error fetching created events:', err)
    }
  }
  
  const getProfileInitials = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    } else if (profile?.firstName) {
      return profile.firstName[0].toUpperCase()
    } else {
      return profile?.address.slice(0, 2).toUpperCase() || '?'
    }
  }
  
  const getDisplayName = () => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`
    } else if (profile?.firstName) {
      return profile.firstName
    } else {
      return `${profile?.address.slice(0, 6)}...${profile?.address.slice(-4)}`
    }
  }

  return (
    <PageWrapper>
      <CursorGlow />
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={() => router.back()}
            className="glass-button inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          
          <h1 className="text-3xl font-bold gradient-text">
            {isOwnProfile ? 'Your Profile' : 'User Profile'}
          </h1>
          
          {isOwnProfile && (
            <Button
              variant="outline"
              animate
              onClick={() => router.push('/profile/edit')}
            >
              Edit Profile
            </Button>
          )}
        </motion.div>
        
        {loading ? (
          <div className="py-12">
            <GlassCard className="p-10" animate>
              <div className="flex items-center justify-center h-40">
                <div className="spinner border-t-2 border-light-green w-12 h-12 rounded-full animate-spin"></div>
              </div>
            </GlassCard>
          </div>
        ) : error ? (
          <GlassCard className="p-10 text-center" animate>
            <p className="text-red-400 mb-4">{error}</p>
            <Button 
              variant="secondary"
              onClick={() => router.push('/dashboard')}
            >
              Return to Dashboard
            </Button>
          </GlassCard>
        ) : profile ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <GlowingBorder glowColor="rgba(74, 222, 128, 0.4)">
                <GlassCard glowOnHover={false} className="h-full">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-r from-dark-green to-light-green flex items-center justify-center text-white text-3xl font-bold">
                      {getProfileInitials()}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {getDisplayName()}
                    </h2>
                    
                    <p className="text-sm text-gray-400 break-all mb-4">
                      {profile.address}
                    </p>
                    
                    <div className="w-full border-t border-gray-800 my-4"></div>
                    
                    <div className="grid grid-cols-3 w-full gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-light-green">{profile.totalPoints}</p>
                        <p className="text-xs text-gray-400">Total Points</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-light-green">{profile.joinedEvents}</p>
                        <p className="text-xs text-gray-400">Events Joined</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-light-green">{profile.createdEvents}</p>
                        <p className="text-xs text-gray-400">Events Created</p>
                      </div>
                    </div>
                    
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-800/30">
                        <div className="flex items-center">
                          <FiUser className="mr-2 text-light-green" />
                          <span className="text-sm">Member since</span>
                        </div>
                        <span className="text-sm text-light-green">
                          {new Date(profile.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-800/30">
                        <div className="flex items-center">
                          <FiTwitter className="mr-2 text-light-green" />
                          <span className="text-sm">Twitter</span>
                        </div>
                        {profile.twitterUsername ? (
                          <a 
                            href={`https://twitter.com/${profile.twitterUsername}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:underline flex items-center"
                          >
                            @{profile.twitterUsername} <FiExternalLink className="ml-1" size={12} />
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">Not connected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </GlowingBorder>
            </motion.div>
            
            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <GlassCard>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-white">Activity History</h2>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant={historyType === 'completed' ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setHistoryType('completed')}
                    >
                      Completed Tasks
                    </Button>
                    <Button
                      variant={historyType === 'created' ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setHistoryType('created')}
                    >
                      Created Events
                    </Button>
                  </div>
                </div>
                
                {historyType === 'completed' ? (
                  taskHistory.length > 0 ? (
                    <div className="space-y-4">
                      {taskHistory.map((task, index) => (
                        <motion.div
                          key={task._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm"
                        >
                          <div className="flex justify-between">
                            <Link href={`/events/${task.eventId}`} className="font-medium text-white hover:text-light-green transition-colors">
                              {task.eventTitle}
                            </Link>
                            <span className="text-light-green font-medium">+{task.pointsEarned} pts</span>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50">
                              {task.platform}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50">
                              {task.taskType.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 mt-2">{task.description}</p>
                          
                          <div className="mt-2 text-xs text-gray-400 flex items-center">
                            <FiCalendar className="mr-1" size={12} />
                            Completed on {new Date(task.completedAt).toLocaleDateString()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                      <p className="text-gray-400 mb-4">
                        {isOwnProfile 
                          ? "You haven't completed any tasks yet" 
                          : "This user hasn't completed any tasks yet"}
                      </p>
                      {isOwnProfile && (
                        <Link href="/events" className="glass-button text-sm">
                          Browse events to participate
                        </Link>
                      )}
                    </div>
                  )
                ) : (
                  createdEvents.length > 0 ? (
                    <div className="space-y-4">
                      {createdEvents.map((event: any, index) => (
                        <motion.div
                          key={event._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm"
                        >
                          <div className="flex justify-between">
                            <Link href={`/events/${event._id}`} className="font-medium text-white hover:text-light-green transition-colors">
                              {event.title}
                            </Link>
                            <span className={event.isActive ? 'glass-badge' : 'glass-badge glass-badge-inactive'}>
                              {event.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 mt-2 line-clamp-2">{event.description}</p>
                          
                          <div className="mt-3 flex justify-between">
                            <div className="text-xs text-gray-400 flex items-center">
                              <FiCalendar className="mr-1" size={12} />
                              {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                            </div>
                            <span className="text-xs text-light-green font-medium">{event.totalPoints} total points</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                      <p className="text-gray-400 mb-4">
                        {isOwnProfile 
                          ? "You haven't created any events yet" 
                          : "This user hasn't created any events yet"}
                      </p>
                      {isOwnProfile && (
                        <Link href="/events/create" className="glass-button text-sm">
                          Create your first event
                        </Link>
                      )}
                    </div>
                  )
                )}
              </GlassCard>
            </motion.div>
          </div>
        ) : null}
      </div>
    </PageWrapper>
  )
}