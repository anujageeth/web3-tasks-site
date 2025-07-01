'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSend, FiMessageSquare, FiAlertTriangle } from 'react-icons/fi'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

const feedbackTypes = [
  { value: 'error', label: 'Bug Report', icon: FiAlertTriangle, color: 'text-red-400' },
  { value: 'suggestion', label: 'Suggestion', icon: FiMessageSquare, color: 'text-yellow-400' }
]

const sections = [
  'home',
  'login',
  'logout', 
  'dashboard',
  'events',
  'tasks',
  'profile',
  'account connect',
  'other'
]

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [formData, setFormData] = useState({
    type: '',
    section: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Validation
    if (!formData.type || !formData.section || !formData.description.trim()) {
      setError('Please fill in all fields')
      setIsSubmitting(false)
      return
    }

    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters long')
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit feedback')
      }

      setSuccess(true)
      
      // Auto close after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)
    } catch (err: any) {
      console.error('Feedback submission error:', err)
      setError(err.message || 'Failed to submit feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ type: '', section: '', description: '' })
    setError(null)
    setSuccess(false)
    setIsSubmitting(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GlassCard className="relative">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <FiMessageSquare className="text-light-green mr-2" size={20} />
                    <h2 className="text-xl font-semibold text-white">Send Feedback</h2>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                  >
                    <FiX size={20} />
                  </button>
                </div>

                {success ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiSend className="text-green-400" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Feedback Sent!</h3>
                    <p className="text-gray-300 text-sm">
                      Thank you for your feedback. We'll review it and get back to you if needed.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Feedback Type */}
                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-2">
                        Feedback Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {feedbackTypes.map((type) => {
                          const IconComponent = type.icon; // Change this line
                          return (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                              className={`p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                                formData.type === type.value
                                  ? 'border-light-green/50 bg-light-green/10'
                                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                              }`}
                            >
                              <IconComponent // Change this line
                                className={formData.type === type.value ? 'text-light-green' : type.color} 
                                size={16} 
                              />
                              <span className={`text-sm ${formData.type === type.value ? 'text-light-green' : 'text-gray-300'}`}>
                                {type.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Section */}
                    <div>
                      <label htmlFor="section" className="block text-gray-200 text-sm font-medium mb-2">
                        Section
                      </label>
                      <select
                        id="section"
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        className="glass-input w-full"
                        required
                      >
                        <option value="">Select section...</option>
                        {sections.map((section) => (
                          <option key={section} value={section} className="bg-gray-800 text-white">
                            {section.charAt(0).toUpperCase() + section.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-gray-200 text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="glass-input w-full resize-none"
                        placeholder={
                          formData.type === 'error' 
                            ? 'Please describe the bug you encountered, including steps to reproduce it...'
                            : 'Please describe your suggestion or idea for improvement...'
                        }
                        required
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {formData.description.length}/500 characters
                      </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        className="flex-1"
                        disabled={isSubmitting || !formData.type || !formData.section || !formData.description.trim()}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-white">
                            <FiSend size={16} className='text-white' />
                            Send Feedback
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}