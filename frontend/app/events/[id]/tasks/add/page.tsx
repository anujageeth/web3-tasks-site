'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { 
  FiArrowLeft, FiHelpCircle, FiLink, FiCheck, FiUser, FiThumbsUp, 
  FiRepeat, FiInfo, FiMessageSquare, FiEdit, FiServer, FiSend,
  FiPhoneCall, FiYoutube, FiHeart, FiLayers, FiExternalLink
} from 'react-icons/fi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'

interface Event {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
}

// Platform-specific task types
const platformTasks = {
  twitter: [
    { value: 'follow', label: 'Follow', icon: <FiUser className="text-light-green" /> },
    { value: 'like', label: 'Like', icon: <FiHeart className="text-light-green" /> },
    { value: 'repost', label: 'Repost', icon: <FiRepeat className="text-light-green" /> },
    { value: 'comment', label: 'Comment', icon: <FiMessageSquare className="text-light-green" /> },
    { value: 'create_post', label: 'Create a post', icon: <FiEdit className="text-light-green" /> },
  ],
  discord: [
    { value: 'join_server', label: 'Join server', icon: <FiServer className="text-light-green" /> },
    { value: 'send_message', label: 'Send a message', icon: <FiSend className="text-light-green" /> },
  ],
  telegram: [
    { value: 'join_channel', label: 'Join channel', icon: <FiLayers className="text-light-green" /> },
    { value: 'join_group', label: 'Join group', icon: <FiUser className="text-light-green" /> },
    { value: 'start_bot', label: 'Start the bot', icon: <FiPhoneCall className="text-light-green" /> },
  ],
  youtube: [
    { value: 'subscribe', label: 'Subscribe to channel', icon: <FiYoutube className="text-light-green" /> },
    { value: 'like_video', label: 'Like the video', icon: <FiThumbsUp className="text-light-green" /> },
    { value: 'comment_video', label: 'Comment on the video', icon: <FiMessageSquare className="text-light-green" /> },
  ],
  facebook: [
    { value: 'follow_page', label: 'Like/Follow the page', icon: <FiUser className="text-light-green" /> },
    { value: 'like_post', label: 'Like post', icon: <FiHeart className="text-light-green" /> },
    { value: 'comment_post', label: 'Comment on the post', icon: <FiMessageSquare className="text-light-green" /> },
  ],
  instagram: [
    { value: 'follow', label: 'Follow', icon: <FiUser className="text-light-green" /> },
    { value: 'like_post', label: 'Like the post', icon: <FiHeart className="text-light-green" /> },
    { value: 'comment_post', label: 'Comment on the post', icon: <FiMessageSquare className="text-light-green" /> },
  ],
  website: [
    { value: 'visit', label: 'Visit the link', icon: <FiExternalLink className="text-light-green" /> },
  ],
  other: [
    { value: 'custom', label: 'Custom action', icon: <FiCheck className="text-light-green" /> },
  ]
};

// All platforms
const platforms = [
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'discord', label: 'Discord' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'website', label: 'Website' },
  { value: 'other', label: 'Other' },
];

export default function AddTaskPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { isConnected } = useAccount()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [customPlatform, setCustomPlatform] = useState('')
  
  const [formData, setFormData] = useState({
    taskType: 'follow',
    platform: 'twitter',
    description: '',
    pointsValue: 10,
    linkUrl: '',
    isRequired: false
  })
  
  // Add this state to track if we should show the username input
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [username, setUsername] = useState('');

  // Get available task types for current platform
  const getAvailableTaskTypes = () => {
    return platformTasks[formData.platform as keyof typeof platformTasks] || platformTasks.other;
  };

  // Handle platform change to ensure task type is valid for the platform
  useEffect(() => {
    const availableTaskTypes = getAvailableTaskTypes();
    const isCurrentTaskTypeAvailable = availableTaskTypes.some(
      task => task.value === formData.taskType
    );

    // If current task type is not available for selected platform, default to first available
    if (!isCurrentTaskTypeAvailable && availableTaskTypes.length > 0) {
      setFormData(prev => ({
        ...prev,
        taskType: availableTaskTypes[0].value
      }));
    }
  }, [formData.platform]);
  
  // Add this effect to detect when to show the username input
  useEffect(() => {
    // Check if the task type is a follow/subscribe type that needs username
    const isFollowTask = 
      (formData.platform === 'twitter' && ['follow'].includes(formData.taskType)) ||
      (formData.platform === 'youtube' && ['subscribe'].includes(formData.taskType)) ||
      (formData.platform === 'instagram' && ['follow'].includes(formData.taskType)) ||
      (formData.platform === 'facebook' && ['follow_page'].includes(formData.taskType)) ||
      (formData.platform === 'telegram' && ['join_channel', 'join_group'].includes(formData.taskType));
    
    setShowUsernameInput(isFollowTask);
    
    // Clear username when switching task types
    if (!isFollowTask) {
      setUsername('');
    }
  }, [formData.platform, formData.taskType]);
  
  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    // Fetch event details
    fetch(`/api/events/${id}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to load event')
        }
        return res.json()
      })
      .then(data => {
        setEvent(data.event)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching event:', err)
        setError('Failed to load event')
        setLoading(false)
      })
  }, [id, isConnected, router])
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }))
      return
    }
    
    // Set custom platform
    if (name === 'customPlatform') {
      setCustomPlatform(value)
      return
    }
    
    // Convert point value to number
    if (name === 'pointsValue') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }))
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Add a function to generate the proper URL based on username
  const generateUrlFromUsername = () => {
    const cleanUsername = username.trim().replace(/^@/, ''); // Remove @ if user added it
    
    switch(formData.platform) {
      case 'twitter':
        return `https://x.com/${cleanUsername}`;
      case 'instagram':
        return `https://instagram.com/${cleanUsername}`;
      case 'youtube':
        return `https://youtube.com/@${cleanUsername}`; // Add @ for YouTube
      case 'facebook':
        return `https://facebook.com/${cleanUsername}`;
      case 'telegram':
        return `https://t.me/${cleanUsername}`;
      default:
        return formData.linkUrl;
    }
  };

  // Form validation
  const validateForm = () => {
    // Reset error
    setError(null)
    
    // Points must be positive
    if (formData.pointsValue <= 0) {
      setError('Points value must be greater than zero')
      return false
    }
    
    // Username validation for relevant task types
    if (showUsernameInput) {
      if (!username.trim()) {
        setError('Username is required')
        return false
      }
      
      // Check if user incorrectly included @
      if (username.startsWith('@')) {
        setError('Please enter username without the @ symbol')
        return false
      }
    }
    // Regular URL validation for non-username tasks
    else if (!formData.linkUrl.trim()) {
      setError('Link URL is required')
      return false
    } else {
      // Basic URL validation
      try {
        new URL(formData.linkUrl)
      } catch (e) {
        setError('Please enter a valid URL (including http:// or https://)')
        return false
      }
    }
    
    // Validate custom platform if needed
    if (formData.platform === 'other' && !customPlatform.trim()) {
      setError('Please specify the platform name')
      return false
    }
    
    return true
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Set URL from username if applicable
    if (showUsernameInput && username) {
      formData.linkUrl = generateUrlFromUsername();
    }
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventId: id,
          ...formData,
          // Include custom platform if applicable
          ...(formData.platform === 'other' ? { customPlatform } : {})
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create task')
      }
      
      // Redirect back to event page
      router.push(`/events/${id}`)
    } catch (err: any) {
      console.error('Error creating task:', err)
      setError(err.message || 'Failed to create task')
      setIsSubmitting(false)
    }
  }
  
  // Add this to your component's CSS or in a style tag in the head
  const dropdownStyles = `
    /* Style for select elements to match theme */
    select.glass-input {
      appearance: none;
      background-color: rgba(0, 0, 0, 0.2);
      color: white;
      backdrop-filter: blur(10px);
      border: 0px solid rgba(255, 255, 255, 0.1);
      padding-right: 2rem;
    }
    
    /* Style for dropdown options */
    select.glass-input option {
      background-color:rgb(0, 19, 3);
      border: 0px solid rgba(255, 255, 255, 0.1);
      color: white;
    }
  `;

  const getPlatformRequirement = (platform: string) => {
    switch (platform) {
      case 'twitter':
        return 'Participants must have Twitter connected to complete this task';
      case 'telegram':
        return 'Participants must have Telegram connected to complete this task';
      case 'discord':
        return 'Participants must have Discord connected to complete this task';
      case 'youtube':
        return 'Participants must have Google connected to complete this task';
      default:
        return 'No account connection required for this platform';
    }
  };

  if (loading) {
    return (
      <PageWrapper className="flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-lg text-white">Loading event details...</p>
          <div className="mt-4 h-2 w-40 mx-auto bg-gray-700 overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-gradient-to-r from-light-green to-dark-green"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </PageWrapper>
    )
  }
  
  if (!event) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center">
        <GlassCard animate withBorder className="text-center">
          <p className="text-red-400 mb-4">{error || 'Event not found'}</p>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="glass-button inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Return to Dashboard
          </button>
        </GlassCard>
      </PageWrapper>
    )
  }

  const availableTaskTypes = getAvailableTaskTypes();

  return (
    <PageWrapper>
      {/* Add the style tag with custom dropdown styles */}
      <style jsx>{dropdownStyles}</style>
      
      <div className="max-w-3xl mx-auto">
        <motion.div 
          className="flex justify-between items-center mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold gradient-text">Add Task to Event</h1>
          <button 
            onClick={() => router.push(`/events/${id}`)}
            className="glass-button inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Event
          </button>
        </motion.div>
        
        <GlassCard animate withBorder highlight className="mb-6">
          <div className="flex items-center mb-6 p-4 rounded-xl bg-black/20 backdrop-blur-md">
            <div className="w-10 h-10 rounded-full glass-avatar flex items-center justify-center text-light-green">
              {event.title.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <h2 className="text-xl font-semibold text-white">{event.title}</h2>
              <p className="text-sm text-gray-400">Add a task for participants to complete</p>
            </div>
          </div>
          
          {!event.isActive && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm">
              <p className="text-yellow-300 flex items-center">
                <FiInfo className="mr-2" />
                This event is currently inactive. Tasks can still be added, but participants won't be able to complete them until the event is activated.
              </p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl backdrop-blur-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Platform Selection */}
              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="platform">
                  Platform
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="glass-input w-full"
                >
                  {platforms.map(platform => (
                    <option key={platform.value} value={platform.value}>{platform.label}</option>
                  ))}
                </select>
                
                {/* Custom platform input for "Other" */}
                {formData.platform === 'other' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      name="customPlatform"
                      value={customPlatform}
                      onChange={handleChange}
                      className="glass-input w-full"
                      placeholder="Enter platform name"
                      required
                    />
                  </div>
                )}
                
                <div className="mt-1 text-xs text-gray-400">
                  {getPlatformRequirement(formData.platform)}
                </div>
              </div>
              
              {/* Task Type Selection */}
              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="taskType">
                  Task Type
                </label>
                <div className="relative">
                  <select
                    id="taskType"
                    name="taskType"
                    value={formData.taskType}
                    onChange={handleChange}
                    className="glass-input w-full appearance-none pr-8"
                  >
                    {availableTaskTypes.map(task => (
                      <option key={task.value} value={task.value}>{task.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    {availableTaskTypes.find(task => task.value === formData.taskType)?.icon || 
                      <FiCheck className="text-light-green" />}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description (now optional) */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-200 text-sm font-bold" htmlFor="description">
                  Task Description
                </label>
                <span className="text-xs text-gray-400">Optional</span>
              </div>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="glass-input w-full h-32 resize-none"
                placeholder={`Describe what participants need to do (e.g., ${
                  formData.platform === 'twitter' ? 'Follow @accountname on Twitter' :
                  formData.platform === 'discord' ? 'Join our Discord server' :
                  formData.platform === 'telegram' ? 'Join our Telegram channel' :
                  formData.platform === 'youtube' ? 'Subscribe to our channel' :
                  formData.platform === 'facebook' ? 'Like our page' :
                  formData.platform === 'instagram' ? 'Follow our profile' :
                  formData.platform === 'website' ? 'Visit our website' :
                  'Complete the required action'
                })`}
              />
            </div>
            
            {/* Conditional Username or URL Input */}
            <div className="mb-6">
              {showUsernameInput ? (
                <>
                  <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="username">
                    <FiUser className="inline-block mr-2 text-light-green" />
                    Username 
                  </label>
                  <div className="relative">
                    {/* {formData.platform === 'twitter' && (
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-400">@</span>
                      </div>
                    )}
                    {formData.platform === 'telegram' && (
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <span className="text-gray-400">username</span>
                      </div>
                    )} */}
                    <input
                      id="username"
                      name="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`glass-input w-full ${(formData.platform === 'twitter' || formData.platform === 'telegram') ? 'pl-12' : ''}`}
                      placeholder={
                        formData.platform === 'twitter' ? 'username (without @)' :
                        formData.platform === 'youtube' ? 'username (without @)' :
                        formData.platform === 'instagram' ? 'username' :
                        formData.platform === 'facebook' ? 'pagename' :
                        formData.platform === 'telegram' ? '' :
                        'username'
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.platform === 'twitter' && 'Enter the Twitter username without @'}
                    {formData.platform === 'youtube' && 'Enter the YouTube channel username without @'}
                    {formData.platform === 'instagram' && 'Enter the Instagram username'}
                    {formData.platform === 'facebook' && 'Enter the Facebook page name'}
                    {formData.platform === 'telegram' && 'Enter the Telegram channel/group username'}
                  </p>
                  <div className="mt-2 text-xs p-2 rounded-md bg-gray-800/50 border border-gray-700">
                    <p className="text-gray-400">
                      Will generate: <span className="text-light-green">{generateUrlFromUsername()}</span>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="linkUrl">
                    <FiLink className="inline-block mr-2 text-light-green" />
                    Link URL
                  </label>
                  <input
                    id="linkUrl"
                    name="linkUrl"
                    type="url"
                    value={formData.linkUrl}
                    onChange={handleChange}
                    className="glass-input w-full"
                    placeholder={
                      formData.platform === 'twitter' ? 'https://twitter.com/username/status/123' :
                      formData.platform === 'discord' ? 'https://discord.gg/invite' :
                      formData.platform === 'telegram' ? 'https://t.me/channelname' :
                      formData.platform === 'youtube' ? 'https://youtube.com/watch?v=123' :
                      formData.platform === 'facebook' ? 'https://facebook.com/post/123' :
                      formData.platform === 'instagram' ? 'https://instagram.com/p/123' :
                      formData.platform === 'website' ? 'https://example.com' :
                      'https://'
                    }
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Direct link to the content participants should interact with</p>
                </>
              )}
            </div>
            
            {/* Points Value */}
            <div className="mb-6">
              <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="pointsValue">
                Points Value
              </label>
              <input
                id="pointsValue"
                name="pointsValue"
                type="number"
                min="1"
                max="1000"
                value={formData.pointsValue}
                onChange={handleChange}
                className="glass-input w-full"
                required
              />
              <p className="text-xs text-gray-400 mt-1">How many points users earn for completing this task</p>
            </div>
            
            {/* Required Task Toggle */}
            <div className="mb-6 p-4 rounded-xl border border-gray-700/30 bg-black/20 backdrop-blur-sm">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isRequired"
                    checked={formData.isRequired}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full ${formData.isRequired ? 'bg-light-green/30' : 'bg-gray-700'} transition-colors duration-300`}>
                    <div className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-300 ${formData.isRequired ? 'translate-x-5' : 'translate-x-1'}`} style={{marginTop: '2px'}}></div>
                  </div>
                </div>
                <span className="text-gray-200 text-sm ml-3 font-medium">Mark as required task</span>
              </label>
              <p className="text-xs text-gray-400 mt-2 ml-13 pl-13">Required tasks must be completed before other tasks are considered</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-end items-center gap-4">
              <button
                type="button"
                onClick={() => router.push(`/events/${id}`)} 
                className="glass-button bg-transparent border-gray-600/30 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="glass-button bg-gradient-to-r from-green-500/30 to-green-700/30 text-light-green border-green-500/30"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </motion.button>
            </div>
          </form>
        </GlassCard>
        
        <GlassCard animate className="backdrop-blur-md bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-start">
            <FiHelpCircle className="text-blue-400 text-xl mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2 text-blue-300">Tips for creating effective tasks</h3>
              <ul className="text-sm text-gray-300 list-disc pl-5 space-y-2">
                <li>Be specific about what users need to do</li>
                <li>Include clear instructions in the task description</li>
                <li>Make sure the link URL works and goes directly to the content</li>
                <li>Assign points based on the effort required (more effort = more points)</li>
                <li>Use required tasks for the most important actions</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  )
}