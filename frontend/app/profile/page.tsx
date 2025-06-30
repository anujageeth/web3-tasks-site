'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { FaTwitter, FaCheckCircle } from 'react-icons/fa'
import { FiArrowLeft, FiCalendar, FiAward, FiEdit, FiUser, FiExternalLink, FiSend } from 'react-icons/fi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { GlowingBorder } from '@/components/ui/glowing-border'
import { CursorGlow } from '@/components/ui/cursor-glow'
import { motion } from 'framer-motion'

interface ProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  lastLogin?: Date;
  createdAt: string;
  twitterConnected: boolean;
  twitterUsername?: string;
  totalPoints: number;
  createdEvents: number;
  joinedEvents: number;
  verified: boolean;  // Add this line
  telegramConnected?: boolean;
  telegramUsername?: string;
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

interface CreatedEvent {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  totalPoints: number;
  participants: Array<any>;
}

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { address: userAddress, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [connectingTwitter, setConnectingTwitter] = useState(false)
  const [disconnectingTwitter, setDisconnectingTwitter] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>([])
  const [createdEvents, setCreatedEvents] = useState<CreatedEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [historyType, setHistoryType] = useState<'completed' | 'created'>('completed')

  // Get success/error messages from URL parameters
  useEffect(() => {
    const urlError = searchParams.get('error')
    const urlSuccess = searchParams.get('success')
    
    if (urlError) {
      setError(urlError)
      
      // Clear error from URL - prevents it from showing again on refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl);
    }
    
    if (urlSuccess) {
      setSuccess(urlSuccess)
      
      // Clear success from URL - prevents it from showing again on refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl);
      
      // Refresh profile data to show connected account
      fetchProfileData();
    }
  }, [searchParams])

  // Load profile data
  const fetchProfileData = async () => {
    try {
      const res = await fetch('/api/profile')
      
      if (!res.ok) {
        throw new Error(`Failed to load profile: ${res.status}`)
      }
      
      const data = await res.json()
      
      setProfileData({
        _id: data._id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        address: data.address || '',
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
        twitterConnected: !!data.twitterId,
        twitterUsername: data.twitterUsername,
        totalPoints: data.totalPoints || 0,
        createdEvents: data.createdEvents?.length || 0,
        joinedEvents: data.joinedEvents?.length || 0,
        verified: data.verified || false,  // Add this line
        telegramConnected: !!data.telegramId,
        telegramUsername: data.telegramUsername,
      })
      
      setLoading(false)
      
      // Now fetch the task history and created events
      fetchTaskHistory()
      fetchCreatedEvents()
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile. Please try again later.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    fetchProfileData()
  }, [isConnected, router])
  
  // Fetch task history
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
  
  // Fetch created events
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

  // Connect Twitter account
  const handleConnectTwitter = async () => {
    setError(null);
    setConnectingTwitter(true);
    
    try {
      const res = await fetch('/api/twitter/auth')
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to initiate Twitter authentication')
      }
      
      const { authUrl } = await res.json()
      
      if (!authUrl) {
        throw new Error('No Twitter authentication URL returned')
      }
      
      // Redirect to Twitter auth page
      window.location.href = authUrl
    } catch (err: any) {
      console.error('Error connecting Twitter:', err)
      setError(`Twitter connection failed: ${err.message}`)
      setConnectingTwitter(false)
    }
  }
  
  // Disconnect Twitter account
  const handleDisconnectTwitter = async () => {
    setDisconnectingTwitter(true)
    setError(null)
    
    try {
      const res = await fetch('/api/twitter/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to disconnect Twitter account')
      }
      
      // Update profile data
      setProfileData(prev => prev ? {
        ...prev,
        twitterConnected: false,
        twitterUsername: undefined
      } : null)
      
      setSuccess('Twitter account disconnected successfully')
    } catch (err: any) {
      console.error('Error disconnecting Twitter:', err)
      setError(err.message || 'Failed to disconnect Twitter account')
    } finally {
      setDisconnectingTwitter(false)
    }
  }
  
  const getProfileInitials = () => {
    if (!profileData) return '??';
    
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName[0]}${profileData.lastName[0]}`.toUpperCase()
    } else if (profileData.firstName) {
      return profileData.firstName[0].toUpperCase()
    } else {
      return profileData.address.slice(0, 2).toUpperCase()
    }
  }
  
  const getDisplayName = () => {
    if (!profileData) return '';
    
    if (profileData.firstName && profileData.lastName) {
      return `${profileData.firstName} ${profileData.lastName}`
    } else if (profileData.firstName) {
      return profileData.firstName
    } else {
      return `${profileData.address.slice(0, 6)}...${profileData.address.slice(-4)}`
    }
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="h-10 w-40 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-md animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-800/80 rounded-xl animate-pulse"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile card skeleton */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-white/10 overflow-hidden h-full">
                <div className="p-6 backdrop-blur-lg flex flex-col items-center text-center h-full">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-full bg-gray-800/80 mb-4 animate-pulse"></div>
                  
                  {/* Name */}
                  <div className="h-7 w-40 bg-gray-800/80 rounded-md mb-2 mx-auto animate-pulse"></div>
                  <div className="h-4 w-28 bg-gray-800/50 rounded-md mb-4 animate-pulse"></div>
                  
                  <div className="w-full border-t border-gray-800 my-4"></div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 w-full gap-4 mb-6">
                    {[1,2,3].map(i => (
                      <div key={i} className="text-center">
                        <div className="h-8 w-12 bg-gray-800/80 rounded-md mb-1 mx-auto animate-pulse"></div>
                        <div className="h-3 w-16 bg-gray-800/50 rounded-md mx-auto animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Info rows */}
                  <div className="w-full space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 bg-gray-800/30 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Activity feed skeleton */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 backdrop-blur-lg">
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-7 w-36 bg-gray-800/80 rounded-md animate-pulse"></div>
                    <div className="flex space-x-2">
                      <div className="h-8 w-32 bg-gray-800/50 rounded-md animate-pulse"></div>
                      <div className="h-8 w-32 bg-gray-800/50 rounded-md animate-pulse"></div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="border border-gray-700/30 rounded-xl p-4">
                        <div className="flex justify-between mb-3">
                          <div className="h-6 w-40 bg-gray-800/80 rounded-md animate-pulse"></div>
                          <div className="h-5 w-20 bg-gray-800/50 rounded-full animate-pulse"></div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <div className="h-6 w-20 bg-gray-800/30 rounded-full animate-pulse"></div>
                          <div className="h-6 w-24 bg-gray-800/30 rounded-full animate-pulse"></div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="h-4 w-full bg-gray-800/50 rounded-md animate-pulse"></div>
                          <div className="h-4 w-3/4 bg-gray-800/50 rounded-md animate-pulse"></div>
                        </div>
                        <div className="h-4 w-48 bg-gray-800/30 rounded-md mt-3 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <CursorGlow />
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            className="text-4xl font-bold gradient-text"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your Profile
          </motion.h1>
          
          <Button
            variant="outline"
            animate
            onClick={() => router.push('/profile/edit')}
          >
            <FiEdit className="mr-2" /> Edit Profile
          </Button>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl">
            {success}
          </div>
        )}
        
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
                  <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-r from-dark-green to-light-green flex items-center justify-center text-white text-3xl font-bold relative overflow-hidden border-4 border-light-green/30 shadow-lg shadow-light-green/20"
                    style={{ background: 'rgba(74, 222, 128, 0.34)'}}
                  >
                    <div className="absolute inset-0 bg-light-green/20 animate-pulse-slow"></div>
                    <div className="relative z-10">{getProfileInitials()}</div>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-1">
                    {getDisplayName()}
                    {profileData?.verified && (
                      <FaCheckCircle className="text-light-green ml-1" title="Verified user" size={16} />
                    )}
                  </h2>
                  
                  {/* <p className="text-sm text-gray-400 break-all mb-4">
                    {profileData?.address}
                  </p> */}
                  
                  <div className="w-full border-t border-gray-800 my-4"></div>
                  
                  <div className="grid grid-cols-3 w-full gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-light-green">{profileData?.totalPoints}</p>
                      <p className="text-xs text-gray-400">Total Points</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-light-green">{profileData?.joinedEvents}</p>
                      <p className="text-xs text-gray-400">Events Joined</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-light-green">{profileData?.createdEvents}</p>
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
                        {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-800/30">
                      <div className="flex items-center">
                        <FiAward className="mr-2 text-light-green" />
                        <span className="text-sm">Wallet</span>
                      </div>
                      <span className="text-sm text-light-green">
                        {profileData?.address ? `${profileData.address.slice(0, 6)}...${profileData.address.slice(-4)}` : 'Unknown'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-800/30">
                      <div className="flex items-center">
                        <FaTwitter className="mr-2 text-light-green" />
                        <span className="text-sm">Twitter</span>
                      </div>
                      {profileData?.twitterConnected ? (
                        <a 
                          href={`https://twitter.com/${profileData.twitterUsername}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:underline flex items-center"
                        >
                          @{profileData.twitterUsername} <FiExternalLink className="ml-1" size={12} />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">Not connected</span>
                      )}
                    </div>
                    
                    {/* Add this section where you show Twitter connection */}
                    {profileData?.telegramConnected && (
                      <div className="flex items-center mt-2">
                        <FiSend className="text-[#0088cc] mr-2" />
                        <span className="text-gray-300 text-sm">
                          Connected to <span className="text-[#0088cc]">@{profileData.telegramUsername}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Twitter connect button */}
                  {/* <div className="w-full mt-6">
                    {profileData?.twitterConnected ? (
                      <motion.button
                        onClick={handleDisconnectTwitter}
                        disabled={disconnectingTwitter}
                        className="glass-button bg-red-500/10 border-red-500/30 text-red-400 w-full"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {disconnectingTwitter ? 'Disconnecting...' : 'Disconnect Twitter'}
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handleConnectTwitter}
                        disabled={connectingTwitter}
                        className="glass-button bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center justify-center w-full"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {connectingTwitter ? 'Connecting...' : (
                          <>
                            <FaTwitter className="mr-1" /> Connect Twitter
                          </>
                        )}
                      </motion.button>
                    )}
                  </div> */}
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
                        className="border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-light-green/30 hover:bg-black/30 transition-all"
                      >
                        <Link 
                          href={`/events/${task.eventId}`}
                          className="block"
                        >
                          <div className="flex justify-between">
                            <h3 className="font-medium text-white hover:text-light-green transition-colors">
                              {task.eventTitle}
                            </h3>
                            <span className="text-light-green font-medium">+{task.pointsEarned} pts</span>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50">
                              {task.platform}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-700/50">
                              {task.taskType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 mt-2">{task.description}</p>
                          
                          <div className="mt-2 text-xs text-gray-400 flex items-center">
                            <FiCalendar className="mr-1" size={12} />
                            Completed on {new Date(task.completedAt).toLocaleDateString()}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                    <p className="text-gray-400 mb-4">
                      You haven't completed any tasks yet
                    </p>
                    <Link href="/events" className="glass-button text-sm">
                      Browse events to participate
                    </Link>
                  </div>
                )
              ) : (
                createdEvents.length > 0 ? (
                  <div className="space-y-4">
                    {createdEvents.map((event, index) => (
                      <motion.div
                        key={event._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border border-gray-700/50 rounded-xl p-4 backdrop-blur-sm hover:border-light-green/30 hover:bg-black/30 transition-all"
                      >
                        <Link 
                          href={`/events/${event._id}`}
                          className="block"
                        >
                          <div className="flex justify-between">
                            <h3 className="font-medium text-white hover:text-light-green transition-colors">
                              {event.title}
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              event.isActive 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }`}>
                              {event.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 mt-2 line-clamp-2">{event.description}</p>
                          
                          <div className="mt-3 flex justify-between">
                            <div className="text-xs text-gray-400 flex items-center">
                              <FiCalendar className="mr-1" size={12} />
                              {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-light-green font-medium">
                                {event.totalPoints} total points
                              </span>
                              <span className="text-xs text-blue-400 font-medium">
                                {event.participants.length} participants
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-700 rounded-xl">
                    <p className="text-gray-400 mb-4">
                      You haven't created any events yet
                    </p>
                    <Link href="/events/create" className="glass-button text-sm">
                      Create your first event
                    </Link>
                  </div>
                )
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  )
}