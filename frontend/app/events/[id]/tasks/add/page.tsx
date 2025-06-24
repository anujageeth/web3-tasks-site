'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'

interface Event {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
}

export default function AddTaskPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { isConnected } = useAccount()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    taskType: 'follow',
    platform: 'twitter',
    description: '',
    pointsValue: 10,
    linkUrl: '',
    isRequired: false
  })
  
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
  
  // Form validation
  const validateForm = () => {
    // Reset error
    setError(null)
    
    // Required fields
    if (!formData.description.trim()) {
      setError('Task description is required')
      return false
    }
    
    if (!formData.linkUrl.trim()) {
      setError('Link URL is required')
      return false
    }
    
    // Points must be positive
    if (formData.pointsValue <= 0) {
      setError('Points value must be greater than zero')
      return false
    }
    
    // Basic URL validation
    try {
      new URL(formData.linkUrl)
    } catch (e) {
      setError('Please enter a valid URL (including http:// or https://)')
      return false
    }
    
    return true
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
          ...formData
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
  
  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p>Loading event details...</p>
      </div>
    )
  }
  
  if (!event) {
    return (
      <div className="min-h-screen p-8 flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error || 'Event not found'}</p>
        <Link href="/dashboard" className="text-blue-600">
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Add Task to Event</h1>
          <Link 
            href={`/events/${id}`}
            className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Event
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
          <p className="text-gray-600 text-sm mb-4">Adding a task to your event will create a new action for participants to complete.</p>
          
          {!event.isActive && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-700">
                This event is currently inactive. Tasks can still be added, but participants won't be able to complete them until the event is activated.
              </p>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="taskType">
                  Task Type
                </label>
                <select
                  id="taskType"
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="follow">Follow</option>
                  <option value="like">Like / React</option>
                  <option value="repost">Repost / Share / Retweet</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="platform">
                  Platform
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="twitter">Twitter / X</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="discord">Discord</option>
                  <option value="telegram">Telegram</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                Task Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-32"
                placeholder="Describe what participants need to do (e.g., Follow @accountname on Twitter)"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="linkUrl">
                Link URL
              </label>
              <input
                id="linkUrl"
                name="linkUrl"
                type="url"
                value={formData.linkUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://twitter.com/username"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Direct link to the content participants should interact with</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pointsValue">
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
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">How many points users earn for completing this task</p>
            </div>
            
            <div className="mb-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isRequired"
                  checked={formData.isRequired}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-gray-700 text-sm">Mark as required task</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">Required tasks must be completed before other tasks are considered</p>
            </div>
            
            <div className="flex justify-between items-center">
              <Link
                href={`/events/${id}`} 
                className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-2 px-6 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Tips for creating effective tasks</h3>
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            <li>Be specific about what users need to do</li>
            <li>Include clear instructions in the task description</li>
            <li>Make sure the link URL works and goes directly to the content</li>
            <li>Assign points based on the effort required (more effort = more points)</li>
            <li>Use required tasks for the most important actions</li>
          </ul>
        </div>
      </div>
    </div>
  )
}