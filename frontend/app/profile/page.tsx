'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAccount } from 'wagmi'
import Link from 'next/link'
import { FaTwitter } from 'react-icons/fa'

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
    }
    
    if (urlSuccess) {
      setSuccess(urlSuccess)
    }
  }, [searchParams])

  // Load profile data
  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    // Fetch profile data
    fetch('/api/profile')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load profile: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
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
      })
      .catch(err => {
        console.error('Error loading profile:', err)
        setError('Failed to load profile. Please try again later.')
        setLoading(false)
      })
  }, [isConnected, router])

  // Connect Twitter account
  const handleConnectTwitter = async () => {
    try {
      const res = await fetch('/api/twitter/auth')
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to initiate Twitter authentication')
      }
      
      const { authUrl } = await res.json()
      
      // Redirect to Twitter auth page
      window.location.href = authUrl
    } catch (err: any) {
      console.error('Error connecting Twitter:', err)
      setError(err.message || 'Failed to connect Twitter account')
    }
  }
  
  // Disconnect Twitter account
  const handleDisconnectTwitter = async () => {
    setDisconnectingTwitter(true)
    try {
      const res = await fetch('/api/twitter/disconnect', {
        method: 'POST'
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
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Profile</h1>
          <Link 
            href="/dashboard" 
            className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                Wallet Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={profileData.address}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">Your blockchain address cannot be changed</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={profileData.firstName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={profileData.lastName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={profileData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="py-2 px-6 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Social accounts section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Connected Social Accounts</h2>
          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FaTwitter className="text-blue-400 text-xl mr-3" />
                <div>
                  <p className="font-medium">Twitter</p>
                  {profileData.twitterConnected ? (
                    <p className="text-sm text-gray-600">
                      Connected as @{profileData.twitterUsername}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Not connected</p>
                  )}
                </div>
              </div>
              
              {profileData.twitterConnected ? (
                <button
                  onClick={handleDisconnectTwitter}
                  disabled={disconnectingTwitter}
                  className="px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 text-sm disabled:opacity-50"
                >
                  {disconnectingTwitter ? 'Disconnecting...' : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={handleConnectTwitter}
                  className="px-3 py-1 bg-blue-400 text-white rounded hover:bg-blue-500 text-sm flex items-center"
                >
                  <FaTwitter className="mr-1" /> Connect Twitter
                </button>
              )}
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p className="mb-2">
              <strong>Why connect your accounts?</strong>
            </p>
            <p>
              Connecting your social media accounts allows us to automatically verify when you complete social tasks.
              This means you can earn points instantly without manual verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}