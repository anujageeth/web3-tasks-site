'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { appKitModal } from '@/config'
import Link from 'next/link'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { GlowingBorder } from '@/components/ui/glowing-border'
import { motion } from 'framer-motion'
import { FiExternalLink, FiPlus, FiUser, FiCalendar, FiUsers, FiTrendingUp, FiStar, FiActivity, FiTag, FiUserPlus } from 'react-icons/fi'
import { FaCheckCircle } from 'react-icons/fa'
import { CursorGlow } from '@/components/ui/cursor-glow'
import { InfiniteMovingCards } from '@/components/ui/infinite-moving-cards'

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalPoints: number;
  imageUrl?: string;
  creator: {
    address: string;
    firstName?: string;
    lastName?: string;
    verified?: boolean;
  };
  participants: {
    length: number;
  };
}

export default function Dashboard() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [createdEvents, setCreatedEvents] = useState<Event[]>([])
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([])
  const [latestEvents, setLatestEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [latestLoading, setLatestLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [referralStats, setReferralStats] = useState({
    referralsCount: 0,
    referralPoints: 0
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (!res.ok) {
          // User is not authenticated with the backend
          if (isConnected) {
            // They have a wallet connected but not authenticated
            router.push('/'); // Send to home to sign message
          } else {
            // Not connected at all
            router.push('/');
          }
          return;
        }
        
        // User is authenticated, fetch their data
        const userData = await res.json();
        setUserData(userData);
        setAuthChecked(true);
        
        // Now fetch other data in parallel
        Promise.all([
          fetch('/api/events?page=1&limit=3'),
          fetch('/api/events/user/created'),
          fetch('/api/events/user/joined'),
          fetch('/api/referrals/stats')
        ])
        .then(async ([latestRes, createdRes, joinedRes, referralRes]) => {
          // Process responses in parallel
          const [latestData, createdData, joinedData, referralData] = await Promise.all([
            latestRes.ok ? latestRes.json() : {events: []},
            createdRes.ok ? createdRes.json() : [],
            joinedRes.ok ? joinedRes.json() : [],
            referralRes.ok ? referralRes.json() : {referralsCount: 0, referralPoints: 0}
          ]);
          
          // Update state with all data
          setLatestEvents(latestData.events || []);
          setCreatedEvents(createdData || []);
          setJoinedEvents(joinedData || []);
          setReferralStats({
            referralsCount: referralData.referralsCount || 0,
            referralPoints: referralData.referralPoints || 0
          });
          
          // Set loading states
          setLatestLoading(false);
          setEventsLoading(false);
          setLoading(false);
        });
        
      } catch (err) {
        console.error('Error checking authentication:', err);
        setError('Failed to authenticate');
        setAuthChecked(true);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router, isConnected]);

  const handleSignOut = async () => {
    try {
      // First call the logout API to clear server-side session
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('Server logout successful');
      }
    } catch (err) {
      console.error('Error logging out from server:', err);
    }
    
    try {
      // Disconnect wallet
      await appKitModal.disconnect();
      console.log('Wallet disconnected');
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
    }
    
    // Clear all possible cookie variations more aggressively
    const cookiesToClear = [
      'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=;',
      'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;',
      'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;',
      'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;'
    ];
    
    cookiesToClear.forEach(cookie => {
      document.cookie = cookie;
    });
    
    // Clear any cached data
    setUserData(null);
    setCreatedEvents([]);
    setJoinedEvents([]);
    setLatestEvents([]);
    
    // Force a complete page reload to clear all state and cookies
    window.location.href = "/?logout=true";
  }

  // Render a referral stats component for the dashboard
  const ReferralStatsCard = () => {
    return (
      <div className="bg-black/30 rounded-xl border border-gray-700/30 p-4 hover:border-light-green/20 transition-all">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium flex items-center">
            <FiUserPlus className="mr-2 text-light-green" /> 
            Referrals
          </h3>
          <Link href="/profile" className="text-xs text-light-green hover:underline">
            View details
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div className="text-center p-2 bg-black/20 rounded-lg">
            <p className="text-2xl font-bold text-light-green">
              {referralStats.referralsCount}
            </p>
            <p className="text-xs text-gray-400">People Referred</p>
          </div>
          <div className="text-center p-2 bg-black/20 rounded-lg">
            <p className="text-2xl font-bold text-light-green">
              {referralStats.referralPoints}
            </p>
            <p className="text-xs text-gray-400">Points Earned</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="h-10 w-40 bg-gradient-to-r from-gray-800/80 to-gray-700/80 rounded-md animate-pulse"></div>
            <div className="flex gap-3">
              <div className="h-10 w-32 bg-gray-800/80 rounded-xl animate-pulse"></div>
              <div className="h-10 w-32 bg-gray-800/80 rounded-xl animate-pulse"></div>
            </div>
          </div>
          
          {/* User profile card skeleton */}
          <div className="mb-8 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 backdrop-blur-lg">
              <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-800/80 animate-pulse"></div>
                  <div>
                    <div className="h-7 w-40 bg-gray-800/80 rounded-md mb-2 animate-pulse"></div>
                    <div className="h-4 w-28 bg-gray-800/50 rounded-md animate-pulse"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-black/30 rounded-xl p-3 text-center">
                      <div className="h-8 w-12 bg-gray-800/80 rounded-md mb-2 mx-auto animate-pulse"></div>
                      <div className="h-3 w-16 bg-gray-800/50 rounded-md mx-auto animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Latest events skeleton */}
          <div className="mb-8 rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 backdrop-blur-lg">
              <div className="flex justify-between items-center mb-6">
                <div className="h-7 w-36 bg-gray-800/80 rounded-md animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-800/50 rounded-md animate-pulse"></div>
              </div>
              
              <div className="flex gap-4 overflow-hidden">
                {[1,2,3].map(i => (
                  <div key={i} className="w-[300px] border border-gray-700/50 rounded-xl overflow-hidden">
                    <div className="h-32 bg-gray-800/50 animate-pulse"></div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-5 w-32 bg-gray-800/80 rounded-md animate-pulse"></div>
                        <div className="h-5 w-16 bg-gray-800/50 rounded-full animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-gray-800/50 rounded-md animate-pulse"></div>
                        <div className="h-3 w-4/5 bg-gray-800/50 rounded-md animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Two-column layout skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2].map(col => (
              <div key={col} className="rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 backdrop-blur-lg">
                  <div className="flex justify-between items-center mb-6">
                    <div className="h-6 w-36 bg-gray-800/80 rounded-md animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-800/50 rounded-md animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="border border-gray-700/30 rounded-xl p-4">
                        <div className="flex justify-between mb-3">
                          <div className="h-5 w-32 bg-gray-800/80 rounded-md animate-pulse"></div>
                          <div className="h-5 w-16 bg-gray-800/50 rounded-full animate-pulse"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-gray-800/50 rounded-md animate-pulse"></div>
                          <div className="h-3 w-4/5 bg-gray-800/50 rounded-md animate-pulse"></div>
                        </div>
                        <div className="flex justify-between mt-3">
                          <div className="h-3 w-16 bg-gray-800/50 rounded-md animate-pulse"></div>
                          <div className="h-3 w-16 bg-gray-800/50 rounded-md animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center">
        <GlassCard className="p-6 max-w-md text-center">
          <h2 className="text-xl text-red-400 mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="glass-button py-2 px-4"
          >
            Return to Home
          </button>
        </GlassCard>
      </PageWrapper>
    )
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
          <h1 className="text-4xl font-bold gradient-text">CRYPTOKEN</h1>
          <div className="flex gap-3">
            <Link href="/events" className="glass-button rounded-xl px-4 py-2 inline-flex items-center">
              <FiActivity className="mr-2" /> Browse Events
            </Link>
            <Link href="/profile" className="glass-button rounded-xl px-4 py-2 inline-flex items-center">
              <FiUser className="mr-2" /> My Profile
            </Link>
          </div>
        </motion.div>
        
        <GlowingBorder glowColor="rgba(74, 222, 128, 0.2)" className="mb-8">
          <GlassCard animate withBorder>
            <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-dark-green to-light-green flex items-center justify-center text-white text-xl font-bold relative overflow-hidden border-4 border-light-green/30 shadow-lg shadow-light-green/20">
                  <div className="absolute inset-0 bg-light-green/20 animate-pulse-slow"
                    style={{ 
                              background: `rgba(74, 222, 128, 0.54)`,
                            }}
                  ></div>
                  <div className="relative z-10">
                    {userData?.firstName?.[0]?.toUpperCase() || address?.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center">
                    <h2 className="text-2xl font-bold text-white">
                      {userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}` : `User ${address?.slice(0, 6)}...${address?.slice(-4)}`}
                    </h2>
                    {userData?.verified && (
                      <FaCheckCircle className="text-light-green ml-2" title="Verified user" size={16} />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 font-mono">
                    {address?.slice(0, 8)}...{address?.slice(-6)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-black/30 rounded-xl p-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-light-green">{userData?.totalPoints || 0}</p>
                  <p className="text-xs text-gray-400">Total Points</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-light-green">{joinedEvents.length}</p>
                  <p className="text-xs text-gray-400">Events Joined</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3 text-center backdrop-blur-sm">
                  <p className="text-2xl font-bold text-light-green">{createdEvents.length}</p>
                  <p className="text-xs text-gray-400">Events Created</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </GlowingBorder>
        
        {/* Referral Stats Card - add below user profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <GlassCard>
            <ReferralStatsCard />
          </GlassCard>
        </motion.div>
        
        {/* Latest Events Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <GlassCard>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FiTrendingUp className="mr-2 text-light-green" /> Latest Events
              </h2>
              <Link 
                href="/events" 
                className="glass-button inline-flex items-center text-sm"
              >
                View All <FiExternalLink className="ml-1" size={14} />
              </Link>
            </div>
            
            {latestLoading ? (
              <div className="py-4 text-center">
                <p className="text-gray-400">Loading latest events...</p>
              </div>
            ) : latestEvents.length > 0 ? (
              <div className="relative">
                <InfiniteMovingCards
                  items={[
                    // Ensure we have multiple copies if there are few items
                    ...latestEvents,
                    ...latestEvents,
                    ...latestEvents
                  ].slice(0, Math.max(6, latestEvents.length * 2)).map((event, index) => (
                    <Link key={`${event._id}-${index}`} href={`/events/${event._id}`} className="block w-[300px]">
                      <div className="w-[300px] border border-gray-700/50 rounded-xl overflow-hidden hover:border-light-green/30 hover:bg-black/20 transition-all group">
                        <div className="h-32 relative overflow-hidden">
                          <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
                            style={{ 
                              backgroundImage: `url(${event.imageUrl || "https://images.unsplash.com/photo-1636953056323-9c09fdd74fa6?q=80&w=2070&auto=format&fit=crop"})`,
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60" />
                        </div>
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-white leading-tight">{event.title}</h3>
                            <span className={event.isActive 
                              ? 'text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }>
                              {event.isActive ? 'Active' : 'Ended'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-300 line-clamp-2 mb-2">{event.description}</p>
                          
                          <div className="flex justify-between items-center text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <FiUsers size={12} />
                              <span>{event.participants?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiTag size={12} />
                              <span className="text-light-green">{event.totalPoints} pts</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  direction="right"
                  speed="fast"
                  pauseOnHover={true}
                />
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-400">No events available at the moment</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Created Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FiStar className="mr-2 text-light-green" /> Your Created Events
                </h2>
                <Link 
                  href="/events/create" 
                  className="glass-button inline-flex items-center text-sm"
                >
                  <FiPlus className="mr-1" /> New
                </Link>
              </div>
              
              {eventsLoading ? (
                <div className="py-4">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border border-gray-700/50 rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                          <div className="h-5 w-1/2 bg-gray-700/50 rounded"></div>
                          <div className="h-5 w-16 bg-gray-700/50 rounded-full"></div>
                        </div>
                        <div className="h-4 w-full bg-gray-700/30 rounded mb-1"></div>
                        <div className="h-4 w-2/3 bg-gray-700/30 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : createdEvents.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {createdEvents.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                    >
                      <Link href={`/events/${event._id}`} className="block">
                        <div className="border border-gray-700/50 rounded-xl p-4 hover:bg-white/5 transition-colors backdrop-blur-sm hover:border-light-green/30">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-white">{event.title}</h3>
                            <span className={event.isActive 
                              ? 'text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }>
                              {event.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2 mt-1">{event.description}</p>
                          <div className="flex justify-between mt-2 text-xs text-gray-400">
                            <span className="flex items-center">
                              <FiUsers className="mr-1" /> {event.participants?.length || 0}
                            </span>
                            <span className="flex items-center">
                              <FiCalendar className="mr-1" /> {new Date(event.endDate).toLocaleDateString()}
                            </span>
                            <span className="text-light-green">{event.totalPoints} points</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
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
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FiActivity className="mr-2 text-light-green" /> Events You've Joined
                </h2>
                <Link 
                  href="/events" 
                  className="glass-button inline-flex items-center text-sm"
                >
                  Browse
                </Link>
              </div>
              
              {eventsLoading ? (
                <div className="py-4">
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="border border-gray-700/50 rounded-xl p-4">
                        <div className="flex justify-between mb-2">
                          <div className="h-5 w-1/2 bg-gray-700/50 rounded"></div>
                          <div className="h-5 w-16 bg-gray-700/50 rounded-full"></div>
                        </div>
                        <div className="h-4 w-full bg-gray-700/30 rounded mb-1"></div>
                        <div className="h-4 w-2/3 bg-gray-700/30 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : joinedEvents.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {joinedEvents.map((event, index) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                    >
                      <Link href={`/events/${event._id}`} className="block">
                        <div className="border border-gray-700/50 rounded-xl p-4 hover:bg-white/5 transition-colors backdrop-blur-sm hover:border-light-green/30">
                          <div className="flex justify-between">
                            <h3 className="font-medium text-white">{event.title}</h3>
                            <span className={event.isActive 
                              ? 'text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/30'
                            }>
                              {event.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 line-clamp-2 mt-1">{event.description}</p>
                          <div className="flex justify-between mt-2 text-xs text-gray-400">
                            <div className="flex items-center">
                              <FiCalendar className="mr-1" size={12} />
                              <span>{new Date(event.endDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <FiUsers className="mr-1" size={12} />
                              <span>{event.participants?.length || 0} participants</span>
                            </div>
                            <span className="text-light-green">{event.totalPoints} points</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
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