'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { FaTwitter, FaCheckCircle } from 'react-icons/fa'
import { FiArrowLeft, FiCalendar, FiUser, FiExternalLink, FiSend } from 'react-icons/fi'
import { SiDiscord } from 'react-icons/si' // Add this import
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowingBorder } from '@/components/ui/glowing-border'
import { CursorGlow } from '@/components/ui/cursor-glow'
import { motion } from 'framer-motion'

interface ProfileData {
  _id: string;
  firstName: string;
  lastName: string;
  address: string;
  createdAt: string;
  twitterConnected: boolean;
  twitterUsername?: string;
  totalPoints: number;
  createdEvents: number;
  joinedEvents: number;
  verified: boolean;
  telegramConnected?: boolean;
  telegramUsername?: string;
  discordConnected?: boolean; // Add this line
  discordUsername?: string; // Add this line
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

export default function UserProfilePage() {
  const { address } = useParams() as { address: string }
  const router = useRouter()
  const { address: currentUserAddress, isConnected } = useAccount()
  
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [createdEvents, setCreatedEvents] = useState<CreatedEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    // Check if this is the user's own profile
    if (currentUserAddress && address.toLowerCase() === currentUserAddress.toLowerCase()) {
      // Redirect to main profile page if user is viewing their own profile
      router.push('/profile')
      return
    }
    
    fetchUserProfile()
  }, [address, currentUserAddress, isConnected, router])
  
  const fetchUserProfile = async () => {
    setLoading(true)
    try {
      // Fetch user profile
      const profileRes = await fetch(`/api/profile/${address}`)
      if (!profileRes.ok) {
        throw new Error('Failed to load user profile')
      }
      
      const userData = await profileRes.json()
      
      setProfileData({
        _id: userData._id,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        address: userData.address || '',
        createdAt: userData.createdAt,
        twitterConnected: !!userData.twitterId,
        twitterUsername: userData.twitterUsername,
        totalPoints: userData.totalPoints || 0,
        createdEvents: userData.createdEvents?.length || 0,
        joinedEvents: userData.joinedEvents?.length || 0,
        verified: userData.verified || false,
        telegramConnected: userData.telegramId ? true : false,
        telegramUsername: userData.telegramUsername,
        discordConnected: userData.discordId ? true : false, // Add this line
        discordUsername: userData.discordUsername // Add this line
      })
      
      // After profile is loaded, fetch created events
      fetchUserEvents(userData._id)
    } catch (err: any) {
      console.error('Error loading user profile:', err)
      setError('Failed to load user profile')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchUserEvents = async (userId: string) => {
    try {
      // Fetch events created by this user
      const eventsRes = await fetch(`/api/events/user/${userId}/created`)
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setCreatedEvents(eventsData)
      }
    } catch (err) {
      console.error('Error loading user events:', err)
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
            <div className="h-10 w-24 bg-gray-800/80 rounded-xl animate-pulse"></div>
            <div className="h-10 w-40 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-md animate-pulse"></div>
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
                  <div className="text-center mb-6">
                    <div className="h-8 w-12 bg-gray-800/80 rounded-md mb-1 mx-auto animate-pulse"></div>
                    <div className="h-3 w-36 bg-gray-800/50 rounded-md mx-auto animate-pulse"></div>
                  </div>
                  
                  {/* Info rows */}
                  <div className="w-full space-y-3">
                    {[1,2].map(i => (
                      <div key={i} className="h-12 bg-gray-800/30 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Events skeleton */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 backdrop-blur-lg">
                  <div className="mb-6">
                    <div className="h-7 w-36 bg-gray-800/80 rounded-md animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="border border-gray-700/30 rounded-xl p-4">
                        <div className="flex justify-between mb-3">
                          <div className="h-6 w-40 bg-gray-800/80 rounded-md animate-pulse"></div>
                          <div className="h-5 w-20 bg-gray-800/50 rounded-full animate-pulse"></div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="h-4 w-full bg-gray-800/50 rounded-md animate-pulse"></div>
                          <div className="h-4 w-3/4 bg-gray-800/50 rounded-md animate-pulse"></div>
                        </div>
                        <div className="flex justify-between mt-3">
                          <div className="h-4 w-48 bg-gray-800/30 rounded-md animate-pulse"></div>
                          <div className="flex gap-2">
                            <div className="h-4 w-24 bg-gray-800/30 rounded-md animate-pulse"></div>
                            <div className="h-4 w-24 bg-gray-800/30 rounded-md animate-pulse"></div>
                          </div>
                        </div>
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
          <button 
            onClick={() => router.back()}
            className="glass-button inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back
          </button>
          
          <motion.h1 
            className="text-4xl font-bold gradient-text"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            User Profile
          </motion.h1>
        </div>
        
        {error ? (
          <div className="mb-6 p-6 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-center">
            {error}
            <div className="mt-4">
              <button 
                onClick={() => router.back()}
                className="glass-button"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
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
                    
                    <p className="text-sm text-gray-400 mb-4">
                      {profileData?.address.slice(0, 6)}...{profileData?.address.slice(-4)}
                    </p>
                    
                    <div className="w-full border-t border-gray-800 my-4"></div>
                    
                    <div className="text-center">
                        <p className="text-2xl font-bold text-light-green">{profileData?.createdEvents}</p>
                        <p className="text-xs text-gray-400">Events Created</p>
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

                      <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-800/30">
                        <div className="flex items-center">
                          <FiSend className="mr-2 text-light-green" />
                          <span className="text-sm">Telegram</span>
                        </div>
                        {profileData?.telegramConnected ? (
                          <a 
                            href={`https://t.me/${profileData.telegramUsername}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:underline flex items-center"
                          >
                            @{profileData.telegramUsername} <FiExternalLink className="ml-1" size={12} />
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">Not connected</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-800/30">
                        <div className="flex items-center">
                          <SiDiscord className="mr-2 text-light-green" />
                          <span className="text-sm">Discord</span>
                        </div>
                        {profileData?.discordConnected ? (
                          <span className="text-sm text-[#5865F2]">
                            {profileData.discordUsername}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Not connected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </GlowingBorder>
            </motion.div>
            
            {/* Created Events */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <GlassCard>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-white">Events Created</h2>
                </div>
                
                {createdEvents.length > 0 ? (
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
                    <p className="text-gray-400">
                      This user hasn't created any events yet
                    </p>
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}