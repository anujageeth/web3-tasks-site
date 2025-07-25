'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { FaTwitter, FaInstagram, FaFacebook, FaDiscord, FaTelegram, FaCheck, FaClock, FaYoutube, FaGlobe, FaLink, FaCheckCircle } from 'react-icons/fa'
import { FiCalendar, FiUsers, FiCheck, FiEdit, FiPlus, FiArrowLeft, FiExternalLink, FiClock, FiAward, FiTrash2, FiAlertTriangle, FiCheckSquare } from 'react-icons/fi'
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
    verified?: boolean;
  };
  participants: Array<{
    user: {
      _id: string;
      address: string;
      firstName: string;
      lastName: string;
      verified?: boolean;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

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

  const openDeleteTaskModal = (task: Task) => {
  setTaskToDelete(task);
  setShowDeleteTaskModal(true);
};

const handleDeleteTask = async () => {
  if (!taskToDelete) return;
  
  setDeletingTask(true);
  try {
    const response = await fetch(`/api/tasks/${taskToDelete._id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete task');
    }
    
    // Remove the deleted task from the tasks list
    setTasks(tasks.filter(t => t._id !== taskToDelete._id));
    
    // Close the modal
    setShowDeleteTaskModal(false);
    setTaskToDelete(null);
  } catch (err: any) {
    console.error('Error deleting task:', err);
    setError(err.message || 'Failed to delete task');
  } finally {
    setDeletingTask(false);
  }
};

const handleDeleteEvent = async () => {
  setDeletingEvent(true);
  try {
    const response = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete event');
    }
    
    console.log('Event deleted successfully');
    
    // Redirect to dashboard after successful deletion
    router.push('/dashboard');
  } catch (err: any) {
    console.error('Error deleting event:', err);
    setError(err.message || 'Failed to delete event');
    setDeletingEvent(false);
    setShowDeleteModal(false);
  }
};
  
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
        // Check if this is a connection requirement error
        if (data.requiresConnection) {
          const connectionMessages = {
            twitter: 'Please connect your Twitter account in your profile settings to complete Twitter tasks.',
            telegram: 'Please connect your Telegram account in your profile settings to complete Telegram tasks.',
            discord: 'Please connect your Discord account in your profile settings to complete Discord tasks.',
            google: 'Please connect your Google account in your profile settings to complete YouTube tasks.'
          };
          
          const message = connectionMessages[data.requiresConnection as keyof typeof connectionMessages] || data.message;
          
          // Show error with option to go to profile settings
          setError({
            message: message,
            actionText: 'Go to Profile Settings',
            actionHandler: () => router.push('/profile/edit')
          });
          
          return;
        }
        
        throw new Error(data.message || 'Failed to complete task');
      }
      
      // Handle successful completion
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
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const res = await fetch(`${backendUrl}/api/profile`, {
          credentials: 'include',
        });
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
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link 
                href={`/events/${id}/edit`} 
                className="glass-button inline-flex items-center justify-center"
              >
                <FiEdit className="mr-2" /> Edit
              </Link>
              <Link 
                href={`/events/${id}/tasks/add`} 
                className="glass-button inline-flex items-center justify-center"
              >
                <FiPlus className="mr-2" /> Add Task
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="glass-button bg-red-500/20 text-red-400 hover:bg-red-500/30 inline-flex items-center justify-center"
              >
                <FiTrash2 className="mr-2" /> Delete
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
                    {event?.creator ? (
                      <Link 
                        href={`/profile/${event.creator.address}`} 
                        className="flex flex-col items-center hover:text-light-green transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-dark-green to-light-green flex items-center justify-center text-white text-sm mb-1 relative overflow-hidden border-2 border-light-green/40"
                          style={{ background: 'rgba(74, 222, 128, 0.34)'}}
                        >
                          <div className="absolute inset-0 bg-light-green/20 animate-pulse-slow"></div>
                          <div className="relative z-10">
                            {event.creator.firstName 
                              ? event.creator.firstName[0].toUpperCase() 
                              : event.creator.address.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">Creator</p>
                        <p className="text-sm font-medium truncate text-white flex items-center justify-center">
                          {event.creator.firstName 
                            ? `${event.creator.firstName} ${event.creator.lastName || ''}` 
                            : `${event.creator.address.substring(0, 6)}...${event.creator.address.slice(-4)}`}
                          {event.creator.verified && (
                            <FaCheckCircle className="text-light-green ml-1" title="Verified creator" size={12} />
                          )}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-500 text-sm mb-1">
                          ...
                        </div>
                        <p className="text-xs text-gray-400">Creator</p>
                        <p className="text-sm font-medium truncate text-gray-400">Loading...</p>
                      </>
                    )}
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
          <GlassCard animate withBorder>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <FiCheckSquare className="mr-2 text-light-green" /> Tasks
              </h2>
              {isCreator && (
                <Link 
                  href={`/events/${id}/tasks/add`} 
                  className="glass-button inline-flex items-center text-sm"
                >
                  <FiPlus className="mr-1" size={14} /> Add Task
                </Link>
              )}
            </div>
            
            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-light-green"></div>
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks.map(task => {
                  // Check if task is completed
                  const userTask = userTasks.find(ut => ut.task._id === task._id);
                  const isCompleted = userTask?.completed || false;
                  const hasClickedTask = clickedTasks[task._id] || false;
                  const isVerifiable = verifiableTaskIds[task._id] || false;
                  
                  return (
                    <div 
                      key={task._id} 
                      className={`relative p-4 rounded-xl border ${isCompleted ? 'bg-green-950/20 border-green-500/30' : 'bg-gray-900/50 border-gray-700/30'} transition-all`}
                    >
                      {/* Task Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-lg mr-3 ${getPlatformClass(task.platform)}`}>
                            {getPlatformIcon(task.platform)}
                          </div>
                          <div>
                            <h3 className="font-medium text-white mb-1">
                              {getTaskDisplayTitle(task)}
                            </h3>
                            <div className="flex items-center text-xs">
                              <span className={`${getPlatformTextClass(task.platform)} mr-3`}>
                                {getFriendlyTaskType(task.taskType)} on {getPlatformName(task.platform)}
                              </span>
                              {task.isRequired && (
                                <span className="bg-yellow-500/30 text-yellow-400 px-2 py-1 rounded-full text-xs">
                                  Required
                                </span>
                              )}
                              <span className="ml-3 text-gray-400">
                                {task.pointsValue} {task.pointsValue === 1 ? 'point' : 'points'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Task Status */}
                        {isCompleted ? (
                          <div className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-xs flex items-center">
                            <FaCheck className="mr-1" size={10} /> Completed
                          </div>
                        ) : !hasJoined ? (
                          <div className="bg-gray-500/20 text-gray-400 rounded-full px-3 py-1 text-xs">
                            Join to complete
                          </div>
                        ) : !isEventActive ? (
                          <div className="bg-gray-500/20 text-gray-400 rounded-full px-3 py-1 text-xs">
                            Event ended
                          </div>
                        ) : null}
                        
                        {/* Delete Task button for creator */}
                        {isCreator && (
                          <div className="absolute top-3 right-3">
                            <button
                              onClick={() => openDeleteTaskModal(task)}
                              className="p-2 rounded-full bg-black/20 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                              title="Delete task"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Task Action Buttons */}
                      {!isCompleted && hasJoined && !isCreator && (
                        <div className="space-x-2 flex justify-end mt-2">
                          <motion.button
                            onClick={() => handleOpenTask(task._id, task.linkUrl, task.taskType)}
                            disabled={completingTask === task._id}
                            className={`glass-button text-xs py-1 px-3 ${getPlatformButtonClass(task.platform)}`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {getTaskButtonText(task)}
                          </motion.button>
                          
                          <motion.button
                            onClick={() => handleCompleteTask(task, task._id)}
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
                        </div>
                      )}
                      
                      {/* Task Message */}
                      {taskMessage && taskMessage.id === task._id && (
                        <div className={`mt-2 text-xs ${taskMessage.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-green-500/10 border-green-500/30 text-green-400'} p-2 rounded-lg border`}>
                          {taskMessage.message}
                        </div>
                      )}
                      
                      {/* Task Instructions */}
                      {hasJoined && !isCreator && !isCompleted && hasClickedTask && (
                        task.platform === 'twitter' 
                          ? getTwitterTaskMessage(task, !!userProfile?.twitterId, task._id, hasClickedTask, isVerifiable) 
                          : getTaskStatusMessage(task, task._id, hasClickedTask, isVerifiable)
                      )}
                      
                      {/* Connection status message */}
                      {!getConnectionStatus(task.platform, userProfile) && (
                        <div className="mb-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-300 text-sm">
                            ⚠️ {getConnectionMessage(task.platform)}
                          </p>
                          <Link 
                            href="/profile/edit" 
                            className="text-yellow-400 hover:underline text-sm"
                          >
                            Connect in Profile Settings →
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-700 rounded-xl">
                <p className="text-gray-400">
                  {isCreator 
                    ? "No tasks added yet. Add tasks for participants to complete."
                    : "This event doesn't have any tasks yet."
                  }
                </p>
                {isCreator && (
                  <Link 
                    href={`/events/${id}/tasks/add`} 
                    className="glass-button inline-flex items-center mt-4"
                  >
                    <FiPlus className="mr-2" /> Add First Task
                  </Link>
                )}
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
                  <Link
                    key={participant.user._id}
                    href={`/profile/${participant.user.address}`}
                  >
                    <motion.div 
                      className="p-3 flex justify-between items-center rounded-xl bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                    >
                      <div className="flex items-center">
                        <div 
                          className="w-10 h-10 rounded-full bg-gradient-to-r from-dark-green to-light-green flex items-center justify-center text-white font-medium relative overflow-hidden border-2 border-light-green/40"
                        >
                          <div className="absolute inset-0 bg-light-green/20 animate-pulse-slow"></div>
                          <div className="relative z-10">
                            {participant.user.firstName?.[0]?.toUpperCase() || participant.user.address.substring(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-white flex items-center">
                            {participant.user.firstName 
                              ? `${participant.user.firstName} ${participant.user.lastName || ''}`
                              : `${participant.user.address.substring(0, 6)}...${participant.user.address.slice(-4)}`
                            }
                            {participant.user.verified && (
                              <FaCheckCircle className="text-light-green ml-1" title="Verified user" size={12} />
                            )}
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
                  </Link>
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
        
        {/* Delete Event Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900/90 backdrop-blur-md border border-red-500/20 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                  <FiAlertTriangle className="text-red-400" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-white">Delete Event</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <span className="text-white font-medium">{event?.title}</span>? This action cannot be undone.
                All tasks and participant progress will be permanently deleted.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="glass-button bg-gray-800/50 text-gray-300"
                  disabled={deletingEvent}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteEvent}
                  className="glass-button bg-red-500/30 text-red-300 hover:bg-red-500/40"
                  disabled={deletingEvent}
                >
                  {deletingEvent ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-red-300 border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>Delete Event</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Delete Task Confirmation Modal */}
        {showDeleteTaskModal && taskToDelete && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900/90 backdrop-blur-md border border-red-500/20 rounded-xl p-6 max-w-md w-full"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                  <FiAlertTriangle className="text-red-400" size={20} />
                </div>
                <h3 className="text-xl font-semibold text-white">Delete Task</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete the "{taskToDelete.description}" task? 
                This action cannot be undone. Points earned by participants for this task will be removed.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <button
                  onClick={() => {
                    setShowDeleteTaskModal(false);
                    setTaskToDelete(null);
                  }}
                  className="glass-button bg-gray-800/50 text-gray-300"
                  disabled={deletingTask}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  className="glass-button bg-red-500/30 text-red-300 hover:bg-red-500/40"
                  disabled={deletingTask}
                >
                  {deletingTask ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-red-300 border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>Delete Task</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}

function getPlatformButtonClass(platform: string): string {
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

function getTaskStatusMessage(task: Task, taskId: string, hasClickedTask: boolean, isVerifiable: boolean) {
  if (!hasClickedTask) {
    return (
      <div className={`mt-2 text-xs ${getPlatformMessageClass(task.platform)} p-2 rounded-lg border ${getPlatformBorderClass(task.platform)}`}>
        <p className={getPlatformTextClass(task.platform)}>
          <span className="font-medium">1. Click the action button above ({getTaskActionName(task)})</span>
          <br />
          <span className="font-medium">2. Complete the action on {getPlatformName(task.platform)}</span>
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

function getPlatformMessageClass(platform: string): string {
  switch (platform) {
    case 'twitter':
      return 'bg-blue-500/10';
    case 'discord':
      return 'bg-indigo-500/10';
    case 'telegram':
      return 'bg-sky-500/10';
    case 'youtube':
      return 'bg-red-500/10';
    case 'instagram':
      return 'bg-pink-500/10';
    case 'facebook':
      return 'bg-blue-700/10';
    case 'website':
      return 'bg-emerald-500/10';
    default:
      return 'bg-purple-500/10';
  }
}

function getPlatformBorderClass(platform: string): string {
  switch (platform) {
    case 'twitter':
      return 'border-blue-500/20';
    case 'discord':
      return 'border-indigo-500/20';
    case 'telegram':
      return 'border-sky-500/20';
    case 'youtube':
      return 'border-red-500/20';
    case 'instagram':
      return 'border-pink-500/20';
    case 'facebook':
      return 'border-blue-700/20';
    case 'website':
      return 'border-emerald-500/20';
    default:
      return 'border-purple-500/20';
  }
}

function getPlatformTextClass(platform: string): string {
  switch (platform) {
    case 'twitter':
      return 'text-blue-400';
    case 'discord':
      return 'text-indigo-400';
    case 'telegram':
      return 'text-sky-400';
    case 'youtube':
      return 'text-red-400';
    case 'instagram':
      return 'text-pink-400';
    case 'facebook':
      return 'text-blue-400';
    case 'website':
      return 'text-emerald-400';
    default:
      return 'text-purple-400';
  }
}

function getPlatformName(platform: string): string {
  switch (platform) {
    case 'twitter':
      return 'Twitter';
    case 'discord':
      return 'Discord';
    case 'telegram':
      return 'Telegram';
    case 'youtube':
      return 'YouTube';
    case 'instagram':
      return 'Instagram';
    case 'facebook':
      return 'Facebook';
    case 'website':
      return 'the website';
    default:
      return platform.charAt(0).toUpperCase() + platform.slice(1);
  }
}

function getTaskActionName(task: Task): string {
  const taskText = getTaskButtonText(task);
  return taskText.toLowerCase();
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

// In your task component, add connection status indicators
const getConnectionStatus = (platform: string, userProfile: any) => {
  switch (platform) {
    case 'twitter':
      return userProfile?.twitterConnected;
    case 'telegram':
      return userProfile?.telegramConnected;
    case 'discord':
      return userProfile?.discordConnected;
    case 'youtube':
      return userProfile?.googleConnected;
    default:
      return true; // No connection required
  }
};

const getConnectionMessage = (platform: string) => {
  switch (platform) {
    case 'twitter':
      return 'Twitter account connection required';
    case 'telegram':
      return 'Telegram account connection required';
    case 'discord':
      return 'Discord account connection required';
    case 'youtube':
      return 'Google account connection required';
    default:
      return '';
  }
};

// In your event page component where tasks are rendered
const getTaskDisplayTitle = (task: any) => {
  // If we have stored username metadata, use it for better display
  if (task.metadata?.username) {
    switch (task.taskType) {
      case 'follow':
        return task.platform === 'twitter' ? `Follow @${task.metadata.username} on Twitter` :
               task.platform === 'instagram' ? `Follow @${task.metadata.username} on Instagram` :
               task.platform === 'youtube' ? `Subscribe to @${task.metadata.username}` :
               task.platform === 'facebook' ? `Follow ${task.metadata.username}` :
               task.platform === 'telegram' ? `Join @${task.metadata.username}` :
               task.title;
      default:
        return task.title;
    }
  }
  
  // Fall back to stored title
  return task.title;
};