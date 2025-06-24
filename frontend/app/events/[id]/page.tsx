'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { FaTwitter, FaInstagram, FaFacebookF, FaDiscord, FaTelegram } from 'react-icons/fa'

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
  
  // Add this function to handle Twitter task verification
  const handleTwitterTaskVerification = async (taskId: string, taskType: string, linkUrl: string) => {
    setCompletingTask(taskId)
    setTaskMessage(null)
    
    try {
      const res = await fetch('/api/twitter/verify-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId, taskType, linkUrl })
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        // Check if Twitter connection is required
        if (data.twitterRequired) {
          // Ask user to connect Twitter account
          setTaskMessage({
            id: taskId,
            message: 'This task requires a connected Twitter account. Go to your profile to connect Twitter.',
            type: 'error'
          })
        } else {
          throw new Error(data.message || 'Failed to verify task')
        }
        return
      }
      
      // Show success message
      setTaskMessage({
        id: taskId,
        message: data.message || `Task verified! You earned ${data.pointsEarned} points.`,
        type: 'success'
      })
      
      // Refresh user tasks
      fetchUserTasks()
    } catch (err: any) {
      console.error('Error verifying Twitter task:', err)
      setTaskMessage({
        id: taskId,
        message: err.message || 'Failed to verify task',
        type: 'error'
      })
    } finally {
      setCompletingTask(null)
    }
  }

  // Update the handleCompleteTask function to use Twitter verification for Twitter tasks
  const handleCompleteTask = async (task: Task, taskId: string) => {
    // For Twitter tasks, use dedicated verification
    if (task.platform === 'twitter') {
      handleTwitterTaskVerification(taskId, task.taskType, task.linkUrl)
      return
    }
    
    // Original implementation for other platforms
    setCompletingTask(taskId)
    setTaskMessage(null)
    
    try {
      const res = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ proof: 'user-verification' })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to complete task')
      }
      
      const data = await res.json()
      
      // Show success message
      setTaskMessage({
        id: taskId,
        message: data.message || `Task completed! You earned ${data.pointsEarned} points.`,
        type: 'success'
      })
      
      // Refresh user tasks
      fetchUserTasks()
    } catch (err: any) {
      console.error('Error completing task:', err)
      setTaskMessage({
        id: taskId,
        message: err.message || 'Failed to complete task',
        type: 'error'
      })
    } finally {
      setCompletingTask(null)
    }
  }
  
  useEffect(() => {
    // Fetch user profile to check Twitter status
    fetch('/api/profile')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUserProfile(data);
        }
      })
      .catch(err => console.error('Error loading user profile:', err));
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p>Loading event...</p>
      </div>
    )
  }
  
  if (error || !event) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
        <Link href="/dashboard" className="text-blue-600">
          Return to Dashboard
        </Link>
      </div>
    )
  }
  
  const isEventActive = event.isActive && new Date(event.endDate) > new Date()
  
  // Calculate user's progress
  const completedTasks = userTasks.filter(ut => ut.completed).length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
  
  // Find user's earned points
  const userParticipant = event.participants.find(
    p => p.user.address === address?.toLowerCase()
  )
  const userPoints = userParticipant?.pointsEarned || 0

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link 
            href="/dashboard" 
            className="text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
          
          {isCreator && (
            <div className="flex space-x-2">
              <Link 
                href={`/events/${id}/edit`}
                className="py-1 px-3 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Edit Event
              </Link>
              <Link 
                href={`/events/${id}/tasks/add`}
                className="py-1 px-3 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Add Task
              </Link>
            </div>
          )}
        </div>
        
        {/* Event Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {event.imageUrl && (
            <img 
              src={event.imageUrl} 
              alt={event.title} 
              className="w-full h-48 object-cover" 
            />
          )}
          
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
                <p className="text-gray-600 mb-4">{event.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${isEventActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isEventActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500">Created By</p>
                <p className="font-medium truncate">
                  {event.creator.firstName || event.creator.address.substring(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(event.startDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">End Date</p>
                <p className="font-medium">{new Date(event.endDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Points</p>
                <p className="font-medium">{event.totalPoints}</p>
              </div>
            </div>
            
            {/* Join button or progress */}
            {!isCreator && (
              hasJoined ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium">Your Progress</p>
                    <p className="text-sm">
                      {completedTasks}/{totalTasks} tasks ({Math.round(progressPercentage)}%)
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm">
                    You've earned <span className="font-bold">{userPoints}</span> out of {event.totalPoints} possible points
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleJoinEvent}
                  disabled={joiningEvent || !isEventActive}
                  className={`mt-4 py-2 px-6 rounded text-white font-medium ${
                    isEventActive 
                      ? 'bg-blue-600 hover:bg-blue-700 disabled:opacity-70' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {joiningEvent ? 'Joining...' : 'Join Event'}
                </button>
              )
            )}
          </div>
        </div>
        
        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Tasks</h2>
            <p className="text-sm text-gray-600">
              {isCreator 
                ? 'These are the tasks you created for participants to complete'
                : hasJoined
                  ? 'Complete these tasks to earn points'
                  : 'Join this event to complete tasks and earn points'
              }
            </p>
          </div>
          
          {tasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {isCreator 
                ? (
                  <div>
                    <p className="mb-4">No tasks have been added yet</p>
                    <Link 
                      href={`/events/${id}/tasks/add`}
                      className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Your First Task
                    </Link>
                  </div>
                )
                : 'No tasks available for this event yet'
              }
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {tasks.map(task => {
                const userTask = userTasks.find(ut => ut.task._id === task._id)
                const isCompleted = userTask?.completed || false
                const isCurrentTaskMessage = taskMessage && taskMessage.id === task._id
                
                return (
                  <li key={task._id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}>
                          {isCompleted && (
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 text-xs rounded mr-2 uppercase ${
                              getPlatformClass(task.platform)
                            }`}>
                              {task.platform}
                            </span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {task.taskType}
                            </span>
                          </div>
                          
                          <h3 className="font-medium mt-1">{task.description}</h3>
                          
                          <a 
                            href={task.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm block mt-1"
                          >
                            View Task Link
                          </a>
                          
                          {isCurrentTaskMessage && (
                            <div className={`mt-2 text-sm px-3 py-2 rounded ${
                              taskMessage.type === 'success' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {taskMessage.message}
                            </div>
                          )}
                          
                          {getTwitterTaskMessage(
                            task, 
                            !!(userProfile?.twitterId) // Check if user has Twitter connected
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="font-bold text-lg">{task.pointsValue}</span>
                        <span className="text-gray-500 text-sm ml-1">pts</span>
                        
                        {/* Complete button (only for joined users who haven't completed this task) */}
                        {hasJoined && !isCreator && !isCompleted && (
                          <button
                            onClick={() => handleCompleteTask(task, task._id)}
                            disabled={completingTask === task._id || !isEventActive}
                            className={`block ml-auto mt-2 py-1 px-3 rounded text-sm ${
                              isEventActive
                                ? 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70'
                                : 'bg-gray-300 text-gray-700 cursor-not-allowed'
                            }`}
                          >
                            {completingTask === task._id ? 'Verifying...' : 'Complete'}
                          </button>
                        )}
                        
                        {isCompleted && (
                          <p className="text-xs text-green-600 mt-1">
                            Completed {userTask?.completedAt 
                              ? new Date(userTask.completedAt).toLocaleDateString() 
                              : ''
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        
        {/* Participants Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Participants</h2>
            <p className="text-gray-600 text-sm">
              {event.participants.length} user{event.participants.length !== 1 ? 's' : ''} joined this event
            </p>
          </div>
          
          {event.participants.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No participants have joined yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {event.participants.slice(0, 10).map(participant => (
                <li key={participant.user._id} className="p-4 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                      {participant.user.firstName?.[0] || participant.user.address.substring(0, 2)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">
                        {participant.user.firstName 
                          ? `${participant.user.firstName} ${participant.user.lastName || ''}`
                          : `${participant.user.address.substring(0, 6)}...${participant.user.address.slice(-4)}`
                        }
                      </p>
                    </div>
                  </div>
                  <div>
                    <span className="font-bold">{participant.pointsEarned}</span>
                    <span className="text-gray-500 text-sm ml-1">pts</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function getPlatformClass(platform: string): string {
  switch (platform) {
    case 'twitter': return 'bg-blue-100 text-blue-800';
    case 'instagram': return 'bg-purple-100 text-purple-800';
    case 'facebook': return 'bg-indigo-100 text-indigo-800';
    case 'discord': return 'bg-indigo-100 text-indigo-800';
    case 'telegram': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Add this helper function to get platform icon
function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'twitter': return <FaTwitter className="text-blue-400" />;
    case 'instagram': return <FaInstagram className="text-purple-500" />;
    case 'facebook': return <FaFacebookF className="text-blue-600" />;
    case 'discord': return <FaDiscord className="text-indigo-500" />;
    case 'telegram': return <FaTelegram className="text-blue-500" />;
    default: return null;
  }
}

// Add this function to get a message for Twitter tasks
function getTwitterTaskMessage(task: Task, userHasTwitterConnected: boolean) {
  if (task.platform !== 'twitter') return null;
  
  if (!userHasTwitterConnected) {
    return (
      <div className="mt-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
        <p className="flex items-center text-yellow-700">
          <FaTwitter className="mr-1 text-blue-400" /> 
          This task requires a connected Twitter account. 
          <Link href="/profile" className="ml-1 text-blue-500 hover:underline">
            Connect your account
          </Link>
        </p>
      </div>
    );
  }
  
  const actionText = task.taskType === 'follow' 
    ? 'Follow the account'
    : task.taskType === 'like'
    ? 'Like the tweet'
    : 'Retweet the post';
    
  return (
    <div className="mt-2 text-xs bg-blue-50 p-2 rounded border border-blue-200">
      <p className="text-blue-700">
        <span className="font-medium">{actionText}</span> and click "Verify" to automatically confirm completion.
      </p>
    </div>
  );
}