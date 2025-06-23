'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { appKitModal } from '@/config'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) {
      router.push('/login')
      return
    }
    
    // Check if user is authenticated
    fetch('/api/auth/user')
      .then(res => {
        console.log('User API response status:', res.status);
        if (!res.ok) {
          throw new Error(`Authentication failed: ${res.status}`);
        }
        return res.json()
      })
      .then(data => {
        console.log('User data received:', data);
        setUserData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Authentication error:', err);
        setError(err.message);
        // Don't redirect immediately, show error first
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      })
  }, [isConnected, router])

  const handleSignOut = async () => {
    // First disconnect wallet
    await appKitModal.disconnect()
    
    // Then clear server-side session
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => router.push('/login'))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">Loading...</p>
        {error && (
          <p className="text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="space-x-4">
            <Link 
              href="/profile" 
              className="py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              className="py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Welcome to your Dashboard</h2>
          <p className="mb-2"><strong>Connected Address:</strong> {address}</p>
          {userData && (
            <div className="mt-4">
              {userData.firstName && (
                <p>
                  <strong>Name:</strong> {userData.firstName} {userData.lastName}
                </p>
              )}
              {userData.email && (
                <p><strong>Email:</strong> {userData.email}</p>
              )}
              <p><strong>Last login:</strong> {new Date(userData.lastLogin).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}