'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageWrapper } from "@/components/ui/page-wrapper"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Check if user is already authenticated before redirecting
    const checkAuth = async () => {
      try {
        // Try to get user data to check if already authenticated
        const response = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (response.ok) {
          // Already authenticated, go to dashboard
          router.replace('/dashboard');
        } else {
          // Not authenticated, go to home to connect wallet
          router.replace('/');
        }
      } catch (err) {
        console.error('Error checking auth:', err);
        // On error, just go to home page
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <PageWrapper className="flex flex-col items-center justify-center">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard className="p-8" withBorder highlight>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-1">Checking Authentication...</h1>
              <p className="text-gray-300 mb-6">Please wait</p>
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-light-green mx-auto"></div>
            </div>
          </GlassCard>
        </motion.div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="flex flex-col items-center justify-center">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard className="p-8" withBorder highlight>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-1">Redirecting...</h1>
            <p className="text-gray-300 mb-6">Taking you to the homepage</p>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-light-green mx-auto"></div>
          </div>
        </GlassCard>
      </motion.div>
    </PageWrapper>
  )
}