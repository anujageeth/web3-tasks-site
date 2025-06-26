'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiSave, FiUser, FiMail, FiTwitter } from 'react-icons/fi'

export default function EditProfilePage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  })
  
  const [twitterConnected, setTwitterConnected] = useState(false)
  const [twitterUsername, setTwitterUsername] = useState('')

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    fetchProfileData()
  }, [isConnected, router])
  
  const fetchProfileData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) {
        throw new Error('Failed to load profile data')
      }
      
      const data = await res.json()
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
      })
      
      if (data.twitterId) {
        setTwitterConnected(true)
        setTwitterUsername(data.twitterUsername || '')
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to update profile')
      }
      
      setSuccess('Profile updated successfully')
      
      // Redirect back to profile page after successful update
      setTimeout(() => {
        router.push('/profile')
      }, 1500)
    } catch (err: any) {
      console.error('Update error:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }
  
  const handleConnectTwitter = () => {
    // Redirect to Twitter auth endpoint
    window.location.href = '/api/twitter/auth'
  }
  
  const handleDisconnectTwitter = async () => {
    try {
      const res = await fetch('/api/twitter/disconnect', {
        method: 'POST'
      })
      
      if (res.ok) {
        setTwitterConnected(false)
        setTwitterUsername('')
        setSuccess('Twitter disconnected successfully')
      } else {
        throw new Error('Failed to disconnect Twitter')
      }
    } catch (err: any) {
      console.error('Twitter disconnect error:', err)
      setError(err.message || 'Failed to disconnect Twitter')
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            onClick={() => router.push('/profile')}
            className="glass-button inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" /> Back to Profile
          </button>
          
          <h1 className="text-3xl font-bold gradient-text">Edit Your Profile</h1>
        </motion.div>
        
        {loading ? (
          <GlassCard className="p-10" animate>
            <div className="flex items-center justify-center h-40">
              <div className="spinner border-t-2 border-light-green w-12 h-12 rounded-full animate-spin"></div>
            </div>
          </GlassCard>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="mb-6" animate withBorder>
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-semibold mb-6 text-white">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2" htmlFor="firstName">
                      <FiUser className="inline-block mr-2 text-light-green" />
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="glass-input w-full"
                      placeholder="Your first name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-200 text-sm font-medium mb-2" htmlFor="lastName">
                      <FiUser className="inline-block mr-2 text-light-green" />
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="glass-input w-full"
                      placeholder="Your last name"
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-200 text-sm font-medium mb-2" htmlFor="email">
                    <FiMail className="inline-block mr-2 text-light-green" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="glass-input w-full"
                    placeholder="Your email address"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Your email is private and never shared publicly
                  </p>
                </div>
                
                {error && (
                  <div className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mb-6 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400">
                    {success}
                  </div>
                )}
                
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    animate
                    disabled={saving}
                    className="inline-flex items-center"
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <FiSave className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </GlassCard>
            
            <GlassCard animate withBorder>
              <h2 className="text-xl font-semibold mb-6 text-white">Connected Accounts</h2>
              
              <div className="flex justify-between items-center p-4 border border-gray-700 rounded-xl">
                <div className="flex items-center">
                  <FiTwitter className="text-blue-400 mr-3 text-xl" />
                  <div>
                    <h3 className="font-medium text-white">Twitter</h3>
                    {twitterConnected ? (
                      <p className="text-sm text-gray-400">
                        Connected as <span className="text-blue-400">@{twitterUsername}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Connect your Twitter account to verify tasks
                      </p>
                    )}
                  </div>
                </div>
                
                {twitterConnected ? (
                  <Button
                    variant="outline"
                    onClick={handleDisconnectTwitter}
                    size="sm"
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleConnectTwitter}
                    size="sm"
                  >
                    Connect
                  </Button>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}