'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiSave, FiUser, FiMail, FiTwitter, FiSend } from 'react-icons/fi'

// Add this type declaration for TypeScript to recognize the global function
declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

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
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [telegramUsername, setTelegramUsername] = useState('')
  
  const telegramLoginRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    fetchProfileData()
  }, [isConnected, router])
  
  // Add this effect to initialize the Telegram login widget
  useEffect(() => {
    if (!loading && !telegramConnected && telegramLoginRef.current) {
      // Remove any existing script
      const existingScript = document.getElementById('telegram-login-widget')
      if (existingScript) existingScript.remove()
      
      // Create script element
      const script = document.createElement('script')
      script.id = 'telegram-login-widget'
      script.src = 'https://telegram.org/js/telegram-widget.js?22'
      script.async = true
      
      // Set the attributes
      script.setAttribute('data-telegram-login', 'CRYPTOKEN_tasksbot')
      script.setAttribute('data-size', 'medium')
      script.setAttribute('data-radius', '4')
      script.setAttribute('data-request-access', 'write')
      script.setAttribute('data-userpic', 'false')
      script.setAttribute('data-onauth', 'onTelegramAuth(user)')
      
      // Append the script to the container
      telegramLoginRef.current.appendChild(script)
      
      // Create global callback function
      window.onTelegramAuth = function(user) {
        // Send the Telegram auth data to the backend
        fetch('/api/telegram/widget-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(user)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            setTelegramConnected(true)
            setTelegramUsername(user.username || '')
            setSuccess('Telegram account connected successfully')
          } else {
            setError('Failed to connect Telegram account: ' + (data.message || ''))
          }
        })
        .catch(err => {
          console.error('Error connecting Telegram:', err)
          setError('Error connecting Telegram account')
        })
      }
    }
  }, [loading, telegramConnected])
  
  const fetchProfileData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) {
        throw new Error('Failed to load profile data')
      }
      
      const data = await res.json()
      
      console.log('Edit page received profile data:', data); // Add this for debugging
      
      setFormData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
      })
      
      // Check both twitterConnected and twitterId fields
      if (data.twitterConnected || data.twitterId) {
        setTwitterConnected(true)
        setTwitterUsername(data.twitterUsername || '')
      }
      
      // Check both telegramConnected and telegramId fields
      if (data.telegramConnected || data.telegramId) {
        setTelegramConnected(true)
        setTelegramUsername(data.telegramUsername || '')
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
  
  const handleConnectTwitter = async () => {
    try {
      setError(null)
      
      // Call the API to get the Twitter auth URL
      const response = await fetch('/api/twitter/auth', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to get Twitter auth URL')
      }
      
      const data = await response.json()
      
      if (data.authUrl) {
        // Redirect to Twitter for authorization
        window.location.href = data.authUrl
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (err: any) {
      console.error('Twitter connect error:', err)
      setError(err.message || 'Failed to connect Twitter')
    }
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
  
  const handleDisconnectTelegram = async () => {
    try {
      const res = await fetch('/api/telegram/disconnect', {
        method: 'POST'
      })
      
      if (res.ok) {
        setTelegramConnected(false)
        setTelegramUsername('')
        setSuccess('Telegram disconnected successfully')
      } else {
        throw new Error('Failed to disconnect Telegram')
      }
    } catch (err: any) {
      console.error('Telegram disconnect error:', err)
      setError(err.message || 'Failed to disconnect Telegram')
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
                
                {/* <div className="mb-6">
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
                </div> */}
                
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
              
              <div className="flex flex-col gap-4">
                {/* Twitter Connection */}
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
                
                {/* Telegram Connection */}
                <div className="flex justify-between items-center p-4 border border-gray-700 rounded-xl">
                  <div className="flex items-center">
                    <FiSend className="text-[#0088cc] mr-3 text-xl" />
                    <div>
                      <h3 className="font-medium text-white">Telegram</h3>
                      {telegramConnected ? (
                        <p className="text-sm text-gray-400">
                          Connected as <span className="text-[#0088cc]">@{telegramUsername}</span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400">
                          Connect your Telegram account to receive notifications
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {telegramConnected ? (
                    <Button
                      variant="outline"
                      onClick={handleDisconnectTelegram}
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <div ref={telegramLoginRef} className="telegramLoginWidget">
                      {/* Telegram login button will be inserted here by script */}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}