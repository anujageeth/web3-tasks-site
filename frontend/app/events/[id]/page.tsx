'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { FaTwitter, FaInstagram, FaFacebook, FaDiscord, FaTelegram, FaCheck, FaClock, FaYoutube, FaGlobe, FaLink } from 'react-icons/fa'
import { FiCalendar, FiUsers, FiCheck, FiEdit, FiPlus, FiArrowLeft, FiExternalLink, FiClock, FiAward } from 'react-icons/fi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'

interface Task {
  _id: string;
  taskType: 'follow' | 'like' | 'repost' | 'other';
  platform: 'twitter' | 'instagram' | 'facebook' | 'discord' | 'telegram' | 'other';
  description: string;
  pointsValue: number;
  linkUrl: string;
  isRequired: boolean;
}

interface UserTask {
  _id: string;
  task: Task;
  completed: boolean;
  completedAt: string | null;
  pointsEarned: number;
}

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
    _id: string;
    address: string;
    firstName: string;
    lastName: string;
  };
  participants: Array<{
    user: {
      _id: string;
      address: string;
      firstName: string;
      lastName: string;
    };
    pointsEarned: number;
  }>;
}

export default function EventDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { address, isConnected } = useAccount()
  
  const [event, setEvent] = useState<Event | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [userTasks, setUserTasks] = useState<UserTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreator, setIsCreator] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)
  const [joiningEvent, setJoiningEvent] = useState(false)
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [taskMessage, setTaskMessage] = useState<{id: string, message: string, type: 'success' | 'error'} | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [clickedTasks, setClickedTasks] = useState<{[key: string]: boolean}>({})
  const [taskVerifying, setTaskVerifying] = useState<boolean>(false);
  const [verifiableTaskIds, setVerifiableTaskIds] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    fetchEventData()
  }, [id, isConnected, router])
  
  const fetchEventData = async () => {
    setLoading(true)
    try {
      // Fetch event details
      const eventRes = await fetch(`/api/events/${id}`)
      if (!eventRes.ok) {
        throw new Error('Failed to load event')
      }
      
      const eventData = await eventRes.json()
      setEvent(eventData.event)
      setTasks(eventData.tasks || [])
      
      // Check if user is creator
      if (eventData.event.creator.address === address?.toLowerCase()) {
        setIsCreator(true)
      }
      
      // Check if user has joined
      const isParticipant = eventData.event.participants.some(
        (p: any) => p.user.address === address?.toLowerCase()
      )
      setHasJoined(isParticipant)
      
      // If joined, fetch user's task status
      if (isParticipant) {
        fetchUserTasks()
      }
    } catch (err) {
      console.error('Error fetching event:', err)
      setError('Failed to load event data')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchUserTasks = async () => {
    try {
      const res = await fetch(`/api/tasks/user/event/${id}`)
      if (res.ok) {
        const userTasksData = await res.json()
        setUserTasks(userTasksData)
      }
    } catch (err) {
      console.error('Error fetching user tasks:', err)
    }
  }
  
  const handleJoinEvent = async () => {
    setJoiningEvent(true)
    try {
      const res = await fetch(`/api/events/${id}/join`, {
        method: 'POST'
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to join event')
      }
      
      // Refresh event data
      fetchEventData()
    } catch (err: any) {
      console.error('Error joining event:', err)
      setError(err.message || 'Failed to join event')
    } finally {
      setJoiningEvent(false)
    }
  }
  
  // Replace handleTwitterTaskVerification with this simplified version
  const handleTwitterTaskVerification = async (taskId: string, taskType: string, linkUrl: string) => {
    setCompletingTask(taskId);
    setTaskMessage(null);
    setTaskVerifying(true);
    
    try {
      // No need to check Twitter status anymore
      console.log('Sending verification request for task:', { taskId, taskType, linkUrl });
      
      // Show verifying message
      setTaskMessage({
        id: taskId,
        message: 'Verifying task completion...',
        type: 'success'
      });
      
      // Proceed with verification
      const res = await fetch('/api/twitter/verify-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId, taskType, linkUrl })
      });
      
      console.log('Verification response status:', res.status);
      
      const data = await res.json();
      
      if (!res.ok) {
        console.error('Verification error:', data);
        throw new Error(data.message || 'Failed to verify task');
      }
      
      console.log('Verification success:', data);
      
      // Show success message
      setTaskMessage({
        id: taskId,
        message: data.message || `Task verified! You earned ${data.pointsEarned} points.`,
        type: 'success'
      });
      
      // Refresh user tasks
      fetchUserTasks();
    } catch (err: any) {
      console.error('Error verifying Twitter task:', err);
      setTaskMessage({
        id: taskId,
        message: err.message || 'Failed to verify task',
        type: 'error'
      });
    } finally {
      setTaskVerifying(false);
      setCompletingTask(null);
    }
  };

  // Add or update this function in your component to handle all task types
  const handleCompleteTask = async (task: Task, taskId: string) => {
    setCompletingTask(taskId);
    setTaskMessage(null);
    
    try {
      // For Twitter tasks, use the Twitter verification flow
      if (task.platform === 'twitter') {
        await handleTwitterTaskVerification(task._id, task.taskType, task.linkUrl);
        return;
      }
      
      // For all other platforms, use the generic task completion
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          platform: task.platform,
          taskType: task.taskType
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete task');
      }
      
      // Show success message
      setTaskMessage({
        id: taskId,
        message: data.message || `Task completed! You earned ${data.pointsEarned} points.`,
        type: 'success'
      });
      
      // Refresh user tasks
      fetchUserTasks();
    } catch (err: any) {
      console.error('Error completing task:', err);
      setTaskMessage({
        id: taskId,
        message: err.message || 'Failed to complete task',
        type: 'error'
      });
    } finally {
      setCompletingTask(null);
    }
  }
  
  useEffect(() => {
    // Fetch user profile to check Twitter status
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
          console.log('User profile loaded with Twitter status:', !!data.twitterId);
        } else {
          console.error('Failed to load profile:', res.status);
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };
    
    fetchProfile();
  }, []);
  
  // Update the handleOpenTask function to show only one message during verification
  const handleOpenTask = (taskId: string, linkUrl: string, taskType: string) => {
    // Validate URL
    if (!linkUrl.match(/^https?:\/\//)) {
      linkUrl = "https://" + linkUrl;
    }
    
    // Open the URL in a new tab
    try {
      window.open(linkUrl, '_blank');
      
      // Mark this task as clicked
      setClickedTasks(prev => ({
        ...prev,
        [taskId]: true
      }));
      
      console.log(`Task ${taskId} opened (${taskType}) and marked as clicked`);
      
      // Don't set a message here - rely on the getTwitterTaskMessage function
      // to show the waiting message based on the hasClickedTask and isVerifiable states
      
      // After 10 seconds, mark the task as verifiable
      setTimeout(() => {
        setVerifiableTaskIds(prev => ({
          ...prev,
          [taskId]: true
        }));
        
        // No need for another message here - the getTwitterTaskMessage function
        // will automatically update to show the "You can now verify" message
        // when isVerifiable becomes true
      }, 10000); // 10 seconds timer
      
    } catch (err) {
      console.error('Error opening link:', err);
      // Show error message
      setTaskMessage({
        id: taskId,
        message: 'Invalid URL or could not open link',
        type: 'error'
      });
    }
  };

  const isEventActive = event ? (event.isActive && new Date(event.endDate) > new Date()) : false
  
  // Calculate user's progress
  const completedTasks = userTasks.filter(ut => ut.completed).length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  // Find user's earned points
  const userParticipant = event?.participants?.find(
    p => p.user.address === address?.toLowerCase()
  )
  const userPoints = userParticipant?.pointsEarned || 0

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={() => router.push('/dashboard')}
            className="glass-button inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Dashboard
          </button>
          
          {isCreator && (
            <div className="flex gap-2">
              <button 
                onClick={() => router.push(`/events/${id}/edit`)}
                className="glass-button inline-flex items-center"
              >
                <FiEdit className="mr-2" /> Edit Event
              </button>
              <button 
                onClick={() => router.push(`/events/${id}/tasks/add`)}
                className="glass-button inline-flex items-center"
              >
                <FiPlus className="mr-2" /> Add Task
              </button>
            </div>
          )}
        </motion.div>
        
        {/* Event Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {loading ? (
            <GlassCard withBorder highlight>
              <div className="h-48 flex items-center justify-center">
                <div className="animate-pulse text-gray-400">Loading event details...</div>
              </div>
            </GlassCard>
          ) : error ? (
            <GlassCard withBorder highlight>
              <div className="text-red-400 text-center py-8">{error}</div>
            </GlassCard>
          ) : event ? (
            <GlassCard withBorder highlight className="relative overflow-hidden">
              {event.imageUrl && (
                <div className="relative w-full h-40 -mx-6 -mt-6 mb-6">
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${event.imageUrl})`,
                      filter: 'blur(2px)',
                      transform: 'scale(1.03)'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
                  <div className="absolute top-6 left-6 right-6">
                    <div 
                      className={`inline-block px-3 py-1 rounded-full text-sm float-right ${
                        isEventActive ? 'glass-badge' : 'glass-badge glass-badge-inactive'
                      }`}
                    >
                      {isEventActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">{event.title}</h1>
                <p className="text-gray-300 mb-6">{event.description}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="flex flex-col items-center p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
                    <FiUsers className="text-light-green mb-1" size={18} />
                    <p className="text-xs text-gray-400">Creator</p>
                    <p className="text-sm font-medium truncate text-white">
                      {event.creator.firstName || event.creator.address.substring(0, 8)}
                    </p>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
                    <FiCalendar className="text-light-green mb-1" size={18} />
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="text-sm font-medium text-white">{new Date(event.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
                    <FiClock className="text-light-green mb-1" size={18} />
                    <p className="text-xs text-gray-400">End Date</p>
                    <p className="text-sm font-medium text-white">{new Date(event.endDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-black/20 backdrop-blur-sm border border-white/5">
                    <FiAward className="text-light-green mb-1" size={18} />
                    <p className="text-xs text-gray-400">Total Points</p>
                    <p className="text-sm font-medium text-light-green">{event.totalPoints}</p>
                  </div>
                </div>
                
                {/* Join button or progress */}
                {!isCreator && (
                  hasJoined ? (
                    <div className="p-4 rounded-xl bg-black/30 border border-light-green/20 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium text-white">Your Progress</p>
                        <p className="text-sm text-gray-300">
                          {completedTasks}/{totalTasks} tasks ({Math.round(progressPercentage)}%)
                        </p>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                          className="bg-gradient-to-r from-light-green to-dark-green h-2.5 rounded-full" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-300">
                        You've earned <span className="font-bold text-light-green">{userPoints}</span> out of {event.totalPoints} possible points
                      </p>
                    </div>
                  ) : (
                    <motion.button
                      onClick={handleJoinEvent}
                      disabled={joiningEvent || !isEventActive}
                      className={`w-full py-2 px-6 rounded-full font-medium ${
                        isEventActive 
                          ? 'glass-button bg-gradient-to-r from-light-green to-dark-green text-black disabled:opacity-70' 
                          : 'glass-button bg-gray-700/50 text-gray-400 cursor-not-allowed'
                      }`}
                      whileHover={isEventActive ? { scale: 1.02 } : {}}
                      whileTap={isEventActive ? { scale: 0.98 } : {}}
                    >
                      {joiningEvent ? 'Joining...' : 'Join Event'}
                    </motion.button>
                  )
                )}
              </div>
            </GlassCard>
          ) : (
            <GlassCard withBorder highlight>
              <div className="text-center py-8 text-gray-400">No event data available</div>
            </GlassCard>
          )}
        </motion.div>
        
        {/* Tasks Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          <GlassCard withBorder>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold gradient-text">Tasks</h2>
              <p className="text-sm text-gray-400">
                {isCreator 
                  ? 'These are the tasks for participants to complete'
                  : hasJoined
                    ? 'Complete these tasks to earn points'
                    : 'Join this event to complete tasks and earn points'
                }
              </p>
            </div>
            
            {tasks.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-700/50 rounded-xl">
                {isCreator 
                  ? (
                    <div>
                      <p className="mb-4 text-gray-400">No tasks have been added yet</p>
                      <button 
                        onClick={() => router.push(`/events/${id}/tasks/add`)}
                        className="glass-button inline-flex items-center"
                      >
                        <FiPlus className="mr-2" /> Add Your First Task
                      </button>
                    </div>
                  )
                  : <p className="text-gray-400">No tasks available for this event yet</p>
                }
              </div>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => {
                  const userTask = userTasks.find(ut => ut.task._id === task._id)
                  const isCompleted = userTask?.completed || false
                  const isCurrentTaskMessage = taskMessage && taskMessage.id === task._id
                  const hasClickedTask = clickedTasks[task._id] || false;
                  const isVerifiable = verifiableTaskIds[task._id] || false;
                  
                  return (
                    <div 
                      key={task._id}
                      className={`p-4 rounded-xl border backdrop-blur-sm ${
                        isCompleted 
                          ? 'border-light-green/30 bg-light-green/5' 
                          : task.isRequired
                            ? 'border-yellow-500/30 bg-yellow-500/5'
                            : 'border-gray-700/50 bg-black/20'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-light-green/20 border border-light-green/50' : 'bg-gray-700/50'
                          }`}>
                            {isCompleted && <FiCheck className="text-light-green" />}
                          </div>
                          
                          <div>
                            <div className="flex flex-wrap gap-2 mb-2">
                              <span 
                                className={`px-2 py-1 text-xs rounded-full inline-flex items-center gap-1 ${
                                  getPlatformClass(task.platform)
                                }`}
                              >
                                {getPlatformIcon(task.platform)}
                                {task.platform}
                              </span>
                              <span className="text-xs bg-gray-700/50 px-2 py-1 rounded-full">
                                {getFriendlyTaskType(task.taskType)}
                              </span>
                              {task.isRequired && (
                                <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                            
                            <h3 className="font-medium text-white mb-1">{task.description}</h3>
                            
                            {/* Replace the old link with a proper button */}
                            {/* <motion.button
                              onClick={() => handleOpenTask(task._id, task.linkUrl, task.taskType)}
                              className="text-sm font-medium glass-button bg-gradient-to-r from-blue-400/30 to-blue-600/30 text-blue-300 border-blue-400/30 inline-flex items-center px-3 py-1 rounded-full hover:from-blue-400/40 hover:to-blue-600/40"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              {task.taskType === 'follow' ? 'Follow Account' : 
                               task.taskType === 'like' ? 'Like Tweet' :
                               task.taskType === 'repost' ? 'Retweet Post' : 'Complete Task'} 
                              <FiExternalLink className="ml-1" size={14} />
                            </motion.button> */}
                            
                            {isCurrentTaskMessage && (
                              <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${
                                taskMessage.type === 'success' 
                                  ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
                              }`}>
                                {taskMessage.message}
                              </div>
                            )}
                            
                            {task.platform === 'twitter' && getTwitterTaskMessage(task, !!userProfile?.twitterId, task._id, hasClickedTask, isVerifiable)}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="font-bold text-lg text-light-green">{task.pointsValue}</span>
                          <span className="text-gray-400 text-sm ml-1">pts</span>
                          
                          {/* Complete button (only for joined users who haven't completed this task) */}
                          {hasJoined && !isCreator && !isCompleted && (
                            <div className="space-x-2 flex justify-end mt-2">
                              {task.platform === 'twitter' && (
                                <>
                                  <motion.button
                                    onClick={() => handleOpenTask(task._id, task.linkUrl, task.taskType)}
                                    disabled={completingTask === task._id}
                                    className="glass-button text-xs py-1 px-3 bg-blue-500/20 text-blue-400"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    {task.taskType === 'follow' ? 'Follow Account' : task.taskType === 'like' ? 'Like Tweet' : 'Retweet Post'}
                                  </motion.button>
                                  
                                  <motion.button
                                    onClick={() => handleTwitterTaskVerification(task._id, task.taskType, task.linkUrl)}
                                    disabled={completingTask === task._id || !hasClickedTask || !isVerifiable}
                                    className={`glass-button text-xs py-1 px-3 ${
                                      hasClickedTask && isVerifiable 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-gray-500/20 text-gray-400'
                                    }`}
                                    whileHover={hasClickedTask && isVerifiable ? { scale: 1.05 } : {}}
                                    whileTap={hasClickedTask && isVerifiable ? { scale: 0.95 } : {}}
                                  >
                                    {completingTask === task._id ? 'Verifying...' : 'Verify'}
                                  </motion.button>
                                </>
                              )}
                              
                              {task.platform !== 'twitter' && (
                                <motion.button
                                  onClick={() => handleCompleteTask(task, task._id)}
                                  disabled={completingTask === task._id}
                                  className="glass-button text-xs py-1 px-3 bg-light-green/20 text-light-green"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  {completingTask === task._id ? 'Completing...' : 'Complete Task'}
                                </motion.button>
                              )}
                            </div>
                          )}
                          
                          {isCompleted && (
                            <p className="text-xs text-light-green mt-1">
                              Completed {userTask?.completedAt 
                                ? new Date(userTask.completedAt).toLocaleDateString() 
                                : ''
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>
        
        {/* Participants Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6"
        >
          <GlassCard withBorder>
            <div className="mb-4">
              <h2 className="text-xl font-bold gradient-text">Participants</h2>
              <p className="text-gray-400 text-sm">
                {event?.participants?.length || 0} user{(event?.participants?.length || 0) !== 1 ? 's' : ''} joined this event
              </p>
            </div>
            
            {!event?.participants || event.participants.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-700/50 rounded-xl">
                <p className="text-gray-400">No participants have joined yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {event.participants.slice(0, 10).map((participant, index) => (
                  <motion.div 
                    key={participant.user._id} 
                    className="p-3 flex justify-between items-center rounded-xl bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full glass-avatar flex items-center justify-center text-light-green"
                      >
                        {participant.user.firstName?.[0]?.toUpperCase() || participant.user.address.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-white">
                          {participant.user.firstName 
                            ? `${participant.user.firstName} ${participant.user.lastName || ''}`
                            : `${participant.user.address.substring(0, 6)}...${participant.user.address.slice(-4)}`
                          }
                        </p>
                        <p className="text-xs text-gray-400">
                          {participant.user.address.substring(0, 6)}...{participant.user.address.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-light-green">{participant.pointsEarned}</span>
                      <span className="text-gray-400 text-sm ml-1">pts</span>
                    </div>
                  </motion.div>
                ))}
                
                {event.participants.length > 10 && (
                  <p className="text-center text-sm text-gray-400 py-2">
                    + {event.participants.length - 10} more participants
                  </p>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </PageWrapper>
  )
}

function getPlatformClass(platform: string): string {
  switch (platform) {
    case 'twitter':
      return 'bg-blue-500/20 text-blue-400';
    case 'discord':
      return 'bg-indigo-500/20 text-indigo-400';
    case 'telegram':
      return 'bg-sky-500/20 text-sky-400';
    case 'youtube':
      return 'bg-red-500/20 text-red-400';
    case 'instagram':
      return 'bg-pink-500/20 text-pink-400';
    case 'facebook':
      return 'bg-blue-700/20 text-blue-400';
    case 'website':
      return 'bg-emerald-500/20 text-emerald-400';
    default:
      return 'bg-purple-500/20 text-purple-400';
  }
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'twitter':
      return <FaTwitter className="text-blue-500" />;
    case 'discord':
      return <FaDiscord className="text-indigo-500" />;
    case 'telegram':
      return <FaTelegram className="text-sky-500" />;
    case 'youtube':
      return <FaYoutube className="text-red-500" />;
    case 'instagram':
      return <FaInstagram className="text-pink-500" />;
    case 'facebook':
      return <FaFacebook className="text-blue-700" />;
    case 'website':
      return <FaGlobe className="text-emerald-500" />;
    default:
      return <FaLink className="text-purple-500" />;
  }
}

// Update the getTwitterTaskMessage function to have clearer, non-redundant messages
function getTwitterTaskMessage(task: Task, userHasTwitterConnected: boolean, taskId: string, hasClickedTask: boolean, isVerifiable: boolean) {
  if (task.platform !== 'twitter') return null;
  
  if (!hasClickedTask) {
    return (
      <div className="mt-2 text-xs bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
        <p className="text-blue-400">
          <span className="font-medium">1. Click the action button above ({task.taskType})</span>
          <br />
          <span className="font-medium">2. Complete the action on Twitter</span>
          <br />
          <span className="font-medium">3. Come back and verify your completion</span>
        </p>
      </div>
    );
  } else if (hasClickedTask && !isVerifiable) {
    return (
      <div className="mt-2 text-xs bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/30">
        <p className="flex items-center text-yellow-400">
          <FaClock className="mr-1" /> 
          Please wait 10 seconds before verifying...
        </p>
      </div>
    );
  } else {
    return (
      <div className="mt-2 text-xs bg-green-500/10 p-2 rounded-lg border border-green-500/30">
        <p className="flex items-center text-green-400">
          <FaCheck className="mr-1" /> 
          You can now click the "Verify" button to complete the task!
        </p>
      </div>
    );
  }
}

// Add this helper function to get the appropriate button text for each platform
function getTaskButtonText(task: Task) {
  if (task.platform === 'twitter') {
    if (task.taskType === 'follow') return 'Follow Account';
    if (task.taskType === 'like') return 'Like Tweet';
    if (task.taskType === 'repost') return 'Retweet';
    if (task.taskType === 'comment') return 'Comment';
    return 'Complete Twitter Task';
  }
  
  if (task.platform === 'discord') {
    if (task.taskType === 'join_server') return 'Join Discord';
    if (task.taskType === 'send_message') return 'Send Message';
    return 'Complete Discord Task';
  }
  
  if (task.platform === 'telegram') {
    if (task.taskType === 'join_channel') return 'Join Channel';
    if (task.taskType === 'join_group') return 'Join Group';
    return 'Join Telegram';
  }
  
  if (task.platform === 'instagram') {
    if (task.taskType === 'follow') return 'Follow Account';
    if (task.taskType === 'like_post') return 'Like Post';
    return 'Complete Instagram Task';
  }
  
  if (task.platform === 'facebook') {
    if (task.taskType === 'follow_page') return 'Follow Page';
    if (task.taskType === 'like_post') return 'Like Post';
    return 'Complete Facebook Task';
  }
  
  if (task.platform === 'youtube') {
    if (task.taskType === 'subscribe') return 'Subscribe';
    if (task.taskType === 'like_video') return 'Like Video';
    return 'Complete YouTube Task';
  }
  
  if (task.platform === 'website') {
    return 'Visit Website';
  }
  
  return 'Complete Task';
}

// Add this helper function to your component
function getFriendlyTaskType(taskType: string): string {
  switch (taskType) {
    // Twitter/Social Media
    case 'follow': return 'Follow';
    case 'like': return 'Like';
    case 'repost': return 'Repost';
    case 'comment': return 'Comment';
    
    // Discord
    case 'join_server': return 'Join server';
    case 'send_message': return 'Send message';
    
    // Telegram
    case 'join_channel': return 'Join channel';
    case 'join_group': return 'Join group';
    case 'start_bot': return 'Start bot';
    
    // YouTube
    case 'subscribe': return 'Subscribe';
    case 'like_video': return 'Like video';
    case 'comment_video': return 'Comment';
    
    // Instagram/Facebook
    case 'follow_page': return 'Follow page';
    case 'like_post': return 'Like post';
    case 'comment_post': return 'Comment';
    
    // Website
    case 'visit': return 'Visit';
    case 'custom': return 'Custom';
    
    // Default: capitalize and replace underscores with spaces
    default: 
      return taskType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  }
}