'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { FiArrowLeft, FiImage, FiCalendar, FiEdit3, FiToggleRight } from 'react-icons/fi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  imageUrl: string;
}

export default function EditEventPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { isConnected } = useAccount()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState<Event>({
    _id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    isActive: true,
    imageUrl: ''
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
        // Format dates for input fields
        const event = data.event
        setFormData({
          ...event,
          startDate: new Date(event.startDate).toISOString().split('T')[0],
          endDate: new Date(event.endDate).toISOString().split('T')[0]
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching event:', err)
        setError('Failed to load event')
        setLoading(false)
      })
  }, [id, isConnected, router])
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Form validation
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required')
      return false
    }
    
    if (!formData.description.trim()) {
      setError('Description is required')
      return false
    }
    
    if (!formData.endDate) {
      setError('End date is required')
      return false
    }
    
    return true
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update event')
      }
      
      router.push(`/events/${id}`)
    } catch (err: any) {
      console.error('Error updating event:', err)
      setError(err.message || 'Error updating event')
      setIsSubmitting(false)
    }
  }
  
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

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <motion.div 
          className="flex justify-between items-center mb-8 gap-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold gradient-text">Edit Event</h1>
          <button 
            onClick={() => router.push(`/events/${id}`)}
            className="glass-button inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Event
          </button>
        </motion.div>
        
        <GlassCard animate withBorder highlight>
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="title">
                Event Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="glass-input w-full"
                placeholder="Enter a title for your event"
                required
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="description">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="glass-input w-full h-32 resize-none"
                placeholder="Describe your event and what participants will gain from it"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="startDate">
                  <FiCalendar className="inline-block mr-2" />
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="glass-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="endDate">
                  <FiCalendar className="inline-block mr-2" />
                  End Date *
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="glass-input w-full"
                  required
                />
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="imageUrl">
                <FiImage className="inline-block mr-2" />
                Cover Image URL
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleChange}
                className="glass-input w-full"
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank to remove image</p>
            </div>
            
            <div className="mb-6 flex items-center p-4 rounded-xl border border-gray-700/30 bg-gray-800/20">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="sr-only"
              />
              <label 
                htmlFor="isActive"
                className={`flex items-center cursor-pointer w-12 h-6 rounded-full p-1 ${formData.isActive ? 'bg-green-500/80' : 'bg-gray-600/50'}`}
              >
                <motion.div 
                  className="bg-white w-4 h-4 rounded-full shadow-md"
                  animate={{ x: formData.isActive ? 24 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              </label>
              
              <div className="ml-4">
                <h3 className="font-medium text-white">Event Status</h3>
                <p className="text-xs text-gray-400">
                  {formData.isActive 
                    ? 'Active: Participants can join and complete tasks' 
                    : 'Inactive: Event is paused and not visible to new participants'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">
                * Required fields
              </p>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push(`/events/${id}`)}
                  className="glass-button bg-gray-700/50 text-gray-300"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button bg-gradient-to-r from-light-green to-dark-green text-black"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </div>
          </form>
        </GlassCard>
      </div>
    </PageWrapper>
  )
}