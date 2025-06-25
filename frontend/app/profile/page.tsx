'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { FaTwitter } from 'react-icons/fa'
import { PageWrapper } from '@/components/ui/page-wrapper'
import { GlassCard } from '@/components/ui/glass-card'
import { motion } from 'framer-motion'

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  lastLogin?: Date;
  twitterConnected: boolean;
  twitterUsername?: string;
}

export default function ProfilePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connectingTwitter, setConnectingTwitter] = useState(false)
  const [disconnectingTwitter, setDisconnectingTwitter] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    twitterConnected: false
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: ''
  })

  // Get success/error messages from URL parameters
  useEffect(() => {
    const urlError = searchParams.get('error')
    const urlSuccess = searchParams.get('success')
    
    if (urlError) {
      setError(urlError)
      
      // Clear error from URL - prevents it from showing again on refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl);
    }
    
    if (urlSuccess) {
      setSuccess(urlSuccess)
      
      // Clear success from URL - prevents it from showing again on refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('success');
      window.history.replaceState({}, '', newUrl);
      
      // Refresh profile data to show connected account
      fetchProfileData();
    }
  }, [searchParams])

  // Load profile data
  const fetchProfileData = async () => {
    try {
      const res = await fetch('/api/profile')
      
      if (!res.ok) {
        throw new Error(`Failed to load profile: ${res.status}`)
      }
      
      const data = await res.json()
      
      setProfileData({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        address: data.address || '',
        lastLogin: data.lastLogin,
        twitterConnected: !!data.twitterId,
        twitterUsername: data.twitterUsername
      })
      
      setLoading(false)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile. Please try again later.')
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    fetchProfileData()
  }, [isConnected, router])

  // Connect Twitter account
  const handleConnectTwitter = async () => {
    setError(null);
    setConnectingTwitter(true);
    
    try {
      const res = await fetch('/api/twitter/auth')
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Failed to initiate Twitter authentication')
      }
      
      const { authUrl } = await res.json()
      
      if (!authUrl) {
        throw new Error('No Twitter authentication URL returned')
      }
      
      console.log('Redirecting to Twitter auth URL:', authUrl);
      
      // Redirect to Twitter auth page
      window.location.href = authUrl
    } catch (err: any) {
      console.error('Error connecting Twitter:', err)
      setError(`Twitter connection failed: ${err.message}`)
      setConnectingTwitter(false)
    }
  }
  
  // Disconnect Twitter account
  const handleDisconnectTwitter = async () => {
    setDisconnectingTwitter(true)
    setError(null)
    
    try {
      const res = await fetch('/api/twitter/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to disconnect Twitter account')
      }
      
      // Update profile data
      setProfileData(prev => ({
        ...prev,
        twitterConnected: false,
        twitterUsername: undefined
      }))
      
      setSuccess('Twitter account disconnected successfully')
    } catch (err: any) {
      console.error('Error disconnecting Twitter:', err)
      setError(err.message || 'Failed to disconnect Twitter account')
    } finally {
      setDisconnectingTwitter(false)
    }
  }

  // Validate form before submission
  const validateForm = () => {
    let isValid = true
    const newErrors = {
      firstName: '',
      lastName: '',
      email: ''
    }
    
    // Validate email format
    if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }
    
    // Check name length
    if (profileData.firstName.length > 50) {
      newErrors.firstName = 'First name must be 50 characters or less'
      isValid = false
    }
    
    if (profileData.lastName.length > 50) {
      newErrors.lastName = 'Last name must be 50 characters or less'
      isValid = false
    }
    
    setErrors(newErrors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    
    // Validate form before submission
    if (!validateForm()) {
      return
    }
    
    setSaving(true)
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update profile')
      }
      
      const updatedData = await response.json()
      setProfileData(prev => ({
        ...prev,
        ...updatedData
      }))
      setSuccess('Profile updated successfully!')
    } catch (err: any) {
      console.error('Error updating profile:', err)
      setError(err.message || 'An error occurred while updating your profile')
    } finally {
      setSaving(false)
    }
  }

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
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
          <p className="text-lg text-white">Loading profile...</p>
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <motion.h1 
            className="text-4xl font-bold gradient-text"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Your Profile
          </motion.h1>
        </div>
        
        <GlassCard className="mb-6" animate withBorder>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="address">
                Wallet Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={profileData.address}
                disabled
                className="glass-input w-full text-gray-400"
              />
              <p className="text-sm text-gray-400 mt-1">Your blockchain address cannot be changed</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={profileData.firstName}
                  onChange={handleChange}
                  className={`glass-input w-full ${errors.firstName ? 'border-red-500' : ''}`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={profileData.lastName}
                  onChange={handleChange}
                  className={`glass-input w-full ${errors.lastName ? 'border-red-500' : ''}`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-200 text-sm font-bold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleChange}
                className={`glass-input w-full ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={saving}
                className="glass-button bg-gradient-to-r from-green-500/30 to-green-700/30 text-light-green border-green-500/30"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </motion.button>
            </div>
          </form>
        </GlassCard>
        
        {/* Social accounts section */}
        <GlassCard animate withBorder highlight>
          <h2 className="text-xl font-semibold mb-4 text-white">Connected Social Accounts</h2>
          <div className="border-b border-gray-700/50 pb-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaTwitter className="text-blue-400 text-xl mr-3" />
                <div>
                  <p className="font-medium text-white">Twitter</p>
                  {profileData.twitterConnected ? (
                    <p className="text-sm text-gray-300">
                      Connected as @{profileData.twitterUsername}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">Not connected</p>
                  )}
                </div>
              </div>
              
              {profileData.twitterConnected ? (
                <motion.button
                  onClick={handleDisconnectTwitter}
                  disabled={disconnectingTwitter}
                  className="glass-button bg-red-500/10 border-red-500/30 text-red-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {disconnectingTwitter ? 'Disconnecting...' : 'Disconnect'}
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleConnectTwitter}
                  disabled={connectingTwitter}
                  className="glass-button bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {connectingTwitter ? 'Connecting...' : (
                    <>
                      <FaTwitter className="mr-1" /> Connect Twitter
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-300">
            <p className="mb-2">
              <strong>Why connect your accounts?</strong>
            </p>
            <p>
              Connecting your social media accounts allows us to automatically verify when you complete social tasks.
              This means you can earn points instantly without manual verification.
            </p>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  )
}