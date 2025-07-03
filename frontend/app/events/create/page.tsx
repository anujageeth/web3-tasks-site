'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { FiArrowLeft, FiImage, FiCalendar, FiEdit3, FiShield, FiAlertCircle } from 'react-icons/fi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'

export default function CreateEventPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0], // Today's date
    endDate: '', 
    imageUrl: ''
  })

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    // Check if user is authenticated and verified
    const checkUserVerification = async () => {
      setIsLoading(true)
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const res = await fetch(`${backendUrl}/api/profile`, {
          credentials: 'include',
        });
        if (res.ok) {
          const userData = await res.json()
          setIsVerified(userData.verified === true)
        } else {
          router.push('/login')
        }
      } catch (err) {
        console.error('Error checking user verification:', err)
      } finally {
        setIsLoading(false)
      }
    }
    
    checkUserVerification()
  }, [isConnected, router])
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
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
    
    const endDate = new Date(formData.endDate)
    if (endDate <= new Date()) {
      setError('End date must be in the future')
      return false
    }
    
    return true
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!isVerified) {
      setError("You must be verified to create events")
      return
    }
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to create event')
      }
      
      const eventData = await response.json()
      
      // Redirect to new event page
      router.push(`/events/${eventData._id}`)
    } catch (err: any) {
      console.error('Error creating event:', err)
      setError(err.message || 'Error creating event')
    } finally {
      setIsSubmitting(false)
    }
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
          <h1 className="text-3xl font-bold gradient-text">Create New Event</h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="glass-button inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Dashboard
          </button>
        </motion.div>
        
        {isLoading ? (
          <GlassCard animate withBorder highlight className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-light-green mx-auto mb-4"></div>
              <p className="text-gray-300">Checking verification status...</p>
            </div>
          </GlassCard>
        ) : !isVerified ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard animate withBorder highlight className="mb-6 p-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                  <FiAlertCircle className="text-yellow-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Verification Required</h2>
                <p className="text-gray-300 mb-6">
                  Only verified users can create events currently!
                </p>
                <p className="text-gray-400 text-sm mb-6">
                  Verification helps ensure the quality and legitimacy of events on our platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/profile" className="glass-button bg-gradient-to-r from-light-green to-dark-green text-black">
                    Go to Profile
                  </Link>
                  <Link href="/events" className="glass-button">
                    Browse Events
                  </Link>
                </div>
              </div>
            </GlassCard>
            
            <GlassCard animate withBorder className="mb-6">
              <div className="flex items-start">
                <div className="p-2 bg-blue-500/20 rounded-full mr-4">
                  <FiShield className="text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">How to get verified?</h3>
                  <p className="text-gray-300">
                    Verification is currently managed by our team. Please complete your profile 
                    with accurate information and participate in existing events to establish 
                    a positive reputation in the community.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <>
            <GlassCard animate withBorder highlight className="mb-6">
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
                    <p className="text-xs text-gray-400 mt-1">Defaults to today if not specified</p>
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
                  <p className="text-xs text-gray-400 mt-1">Optional: Add an image URL for your event</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-400">
                    * Required fields
                  </p>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="glass-button bg-gradient-to-r from-light-green to-dark-green text-black"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                  </motion.button>
                </div>
              </form>
            </GlassCard>
            
            <GlassCard animate withBorder className="mb-6">
              <div className="flex items-start">
                <div className="p-2 bg-blue-500/20 rounded-full mr-4">
                  <FiEdit3 className="text-blue-400" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">What happens next?</h3>
                  <p className="text-gray-300">
                    After creating your event, you'll be able to add tasks for participants to complete.
                    Each task can have its own point value and will contribute to the overall event points.
                  </p>
                </div>
              </div>
            </GlassCard>
          </>
        )}
      </div>
    </PageWrapper>
  )
}