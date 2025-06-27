'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PageWrapper } from "@/components/ui/page-wrapper"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"

export default function Login() {
  const router = useRouter()
  
  // Redirect to home page where connect wallet now lives
  useEffect(() => {
    router.replace('/');
  }, [router]);

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